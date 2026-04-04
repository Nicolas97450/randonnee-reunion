import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { hapticMedium } from '@/lib/haptics';

const FEED_CACHE_KEY = 'feed-cache';
const FEED_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export interface Post {
  id: string;
  user_id: string;
  content: string | null;
  image_url: string | null;
  post_type: 'text' | 'achievement' | 'sortie_recap' | 'photo';
  trail_id: string | null;
  stats: Record<string, unknown> | null;
  visibility: 'public' | 'friends' | 'private';
  created_at: string;
  user?: { username: string | null; avatar_url: string | null };
  trail?: { name: string; slug: string } | null;
  like_count?: number;
  liked_by_me?: boolean;
  comment_count?: number;
}

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  user?: { username: string | null; avatar_url: string | null };
}

export type FeedFilter = 'public' | 'friends';

// [B8] Select string with embedded counts — eliminates N+1 queries [CODE-05]
const FEED_SELECT = `
  *,
  user:user_profiles!posts_user_profiles_fk(username, avatar_url),
  trail:trails!trail_id(name, slug),
  post_likes(count),
  post_comments(count)
`;

export function useFeed(filter: FeedFilter = 'public') {
  const currentUserId = useAuthStore((s) => s.user?.id);

  return useQuery({
    queryKey: ['feed', currentUserId, filter],
    queryFn: async () => {
      // 1. Try cache first (only for public feed)
      if (filter === 'public') {
        try {
          const cached = await AsyncStorage.getItem(FEED_CACHE_KEY);
          if (cached) {
            const { data: cachedData, timestamp, userId } = JSON.parse(cached) as {
              data: Post[];
              timestamp: number;
              userId: string | undefined;
            };
            if (Date.now() - timestamp < FEED_CACHE_TTL && userId === currentUserId) {
              return cachedData;
            }
          }
        } catch {
          // Cache read failed, continue to network
        }
      }

      let rawData: Record<string, unknown>[];

      if (filter === 'friends' && currentUserId) {
        // Get friend IDs (single OR query instead of two separate queries)
        const [asRequester, asAddressee] = await Promise.all([
          supabase
            .from('friendships')
            .select('addressee_id')
            .eq('requester_id', currentUserId)
            .eq('status', 'accepted'),
          supabase
            .from('friendships')
            .select('requester_id')
            .eq('addressee_id', currentUserId)
            .eq('status', 'accepted'),
        ]);

        const friendIds: string[] = [
          ...(asRequester.data ?? []).map((f: Record<string, unknown>) => f.addressee_id as string),
          ...(asAddressee.data ?? []).map((f: Record<string, unknown>) => f.requester_id as string),
        ];

        if (friendIds.length === 0) return [];

        const userIds = [...friendIds, currentUserId];

        const { data, error } = await supabase
          .from('posts')
          .select(FEED_SELECT)
          .in('user_id', userIds)
          .order('created_at', { ascending: false })
          .limit(50);

        if (error) throw error;
        rawData = (data ?? []) as Record<string, unknown>[];
      } else {
        // Public feed — RLS now handles visibility correctly (migration 014)
        const { data, error } = await supabase
          .from('posts')
          .select(FEED_SELECT)
          .eq('visibility', 'public')
          .order('created_at', { ascending: false })
          .limit(50);

        if (error) throw error;
        rawData = (data ?? []) as Record<string, unknown>[];
      }

      // [B9] Extract counts from embedded aggregates — single query, no N+1
      const posts = rawData.map((p) => {
        const likeAgg = p.post_likes as { count: number }[] | undefined;
        const commentAgg = p.post_comments as { count: number }[] | undefined;
        return {
          ...p,
          like_count: likeAgg?.[0]?.count ?? 0,
          comment_count: commentAgg?.[0]?.count ?? 0,
          liked_by_me: false, // Will be resolved below
          post_likes: undefined,
          post_comments: undefined,
        };
      }) as Post[];

      // Resolve liked_by_me (single query for current user's likes)
      if (currentUserId && posts.length > 0) {
        const postIds = posts.map((p) => p.id);
        const { data: myLikes } = await supabase
          .from('post_likes')
          .select('post_id')
          .eq('user_id', currentUserId)
          .in('post_id', postIds);

        const likedSet = new Set((myLikes ?? []).map((l: Record<string, unknown>) => l.post_id as string));
        for (const post of posts) {
          post.liked_by_me = likedSet.has(post.id);
        }
      }

      // Save to cache (fire-and-forget, only for public)
      if (filter === 'public') {
        AsyncStorage.setItem(
          FEED_CACHE_KEY,
          JSON.stringify({ data: posts, timestamp: Date.now(), userId: currentUserId }),
        ).catch(() => {});
      }

      return posts;
    },
    staleTime: 30 * 1000,
  });
}

export function useUserPosts(userId: string | undefined) {
  const currentUserId = useAuthStore((s) => s.user?.id);

  return useQuery({
    queryKey: ['user-posts', userId],
    queryFn: async () => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from('posts')
        .select('*, user:user_profiles!posts_user_profiles_fk(username, avatar_url), trail:trails!trail_id(name, slug)')
        .eq('user_id', userId)
        .eq('visibility', 'public')
        .order('created_at', { ascending: false })
        .limit(30);

      if (error) throw error;

      const postIds = (data ?? []).map((p: Record<string, unknown>) => p.id as string);
      const { data: likes } = await supabase
        .from('post_likes')
        .select('post_id, user_id')
        .in('post_id', postIds.length > 0 ? postIds : ['none']);

      const likeCounts: Record<string, number> = {};
      const likedByMe: Record<string, boolean> = {};
      (likes ?? []).forEach((l: Record<string, unknown>) => {
        const pid = l.post_id as string;
        likeCounts[pid] = (likeCounts[pid] ?? 0) + 1;
        if (currentUserId && l.user_id === currentUserId) {
          likedByMe[pid] = true;
        }
      });

      return (data ?? []).map((p: Record<string, unknown>) => ({
        ...p,
        like_count: likeCounts[p.id as string] ?? 0,
        liked_by_me: likedByMe[p.id as string] ?? false,
      })) as Post[];
    },
    enabled: !!userId,
  });
}

export function useCreatePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (post: {
      user_id: string;
      content?: string;
      image_url?: string;
      post_type: string;
      trail_id?: string;
      stats?: Record<string, unknown>;
      visibility?: string;
    }) => {
      // [D4] Content moderation on post text
      if (post.content) {
        const { moderateContent } = await import('@/lib/moderation');
        const moderationError = moderateContent(post.content);
        if (moderationError) {
          throw new Error(moderationError);
        }
      }
      const { error } = await supabase.from('posts').insert(post);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['feed'] });
      Alert.alert('Publie !', 'Ton post est visible par la communaute.');
    },
    onError: (err: Error) => Alert.alert('Erreur', err.message || 'Impossible de publier.'),
  });
}

export function useToggleLike() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ postId, userId, isLiked }: { postId: string; userId: string; isLiked: boolean }) => {
      hapticMedium(); // [UX-2] Haptic on like
      if (isLiked) {
        const { error } = await supabase.from('post_likes').delete().eq('post_id', postId).eq('user_id', userId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('post_likes').insert({ post_id: postId, user_id: userId });
        if (error) throw error;
      }
    },
    onMutate: async ({ postId, isLiked }) => {
      // Cancel outgoing refetches so they don't overwrite the optimistic update
      await qc.cancelQueries({ queryKey: ['feed'] });

      // Snapshot all feed queries for rollback
      const previousQueries = qc.getQueriesData<Post[]>({ queryKey: ['feed'] });

      // Optimistic update: toggle like_count and liked_by_me in cache
      qc.setQueriesData<Post[]>({ queryKey: ['feed'] }, (old) => {
        if (!old) return old;
        return old.map((post) => {
          if (post.id !== postId) return post;
          return {
            ...post,
            liked_by_me: !isLiked,
            like_count: (post.like_count ?? 0) + (isLiked ? -1 : 1),
          };
        });
      });

      return { previousQueries };
    },
    onError: (_err, _vars, context) => {
      // Rollback to the previous state on error
      if (context?.previousQueries) {
        for (const [queryKey, data] of context.previousQueries) {
          qc.setQueryData(queryKey, data);
        }
      }
      Alert.alert('Erreur', 'Impossible de reagir a ce post');
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['feed'] });
    },
  });
}

export function useComments(postId: string | null) {
  return useQuery({
    queryKey: ['comments', postId],
    queryFn: async () => {
      if (!postId) return [];

      const { data, error } = await supabase
        .from('post_comments')
        .select('*, user:user_profiles!post_comments_user_profiles_fk(username, avatar_url)')
        .eq('post_id', postId)
        .order('created_at', { ascending: true })
        .limit(100);

      if (error) throw error;
      return (data ?? []) as unknown as Comment[];
    },
    enabled: !!postId,
    staleTime: 15 * 1000,
  });
}

export function useCreateComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ postId, userId, content }: { postId: string; userId: string; content: string }) => {
      const { error } = await supabase.from('post_comments').insert({
        post_id: postId,
        user_id: userId,
        content,
      });
      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['comments', variables.postId] });
      qc.invalidateQueries({ queryKey: ['feed'] });
    },
    onError: () => Alert.alert('Erreur', 'Impossible de publier le commentaire.'),
  });
}
