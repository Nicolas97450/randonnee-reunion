import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Alert } from 'react-native';
import { supabase } from '@/lib/supabase';

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
}

export function useFeed() {
  return useQuery({
    queryKey: ['feed'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('posts')
        .select('*, user:user_profiles!user_id(username, avatar_url), trail:trails!trail_id(name, slug)')
        .eq('visibility', 'public')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Get like counts
      const postIds = (data ?? []).map((p: Record<string, unknown>) => p.id as string);
      const { data: likes } = await supabase
        .from('post_likes')
        .select('post_id')
        .in('post_id', postIds.length > 0 ? postIds : ['none']);

      const likeCounts: Record<string, number> = {};
      (likes ?? []).forEach((l: Record<string, unknown>) => {
        const pid = l.post_id as string;
        likeCounts[pid] = (likeCounts[pid] ?? 0) + 1;
      });

      return (data ?? []).map((p: Record<string, unknown>) => ({
        ...p,
        like_count: likeCounts[p.id as string] ?? 0,
      })) as Post[];
    },
    staleTime: 2 * 60 * 1000,
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
      const { error } = await supabase.from('posts').insert(post);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['feed'] });
      Alert.alert('Publie !', 'Ton post est visible par la communaute.');
    },
    onError: () => Alert.alert('Erreur', 'Impossible de publier.'),
  });
}

export function useToggleLike() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ postId, userId, isLiked }: { postId: string; userId: string; isLiked: boolean }) => {
      if (isLiked) {
        await supabase.from('post_likes').delete().eq('post_id', postId).eq('user_id', userId);
      } else {
        await supabase.from('post_likes').insert({ post_id: postId, user_id: userId });
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['feed'] }),
  });
}
