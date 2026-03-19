import React, { useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Pressable,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { COLORS, FONT_SIZE, SPACING, BORDER_RADIUS } from '@/constants';
import { useAuth } from '@/hooks/useAuth';
import { useUserPosts, useToggleLike, type Post } from '@/hooks/useFeed';
import { useFriends, useSendFriendRequest } from '@/hooks/useFriends';
import type { ProfileStackParamList } from '@/navigation/types';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

type Props = NativeStackScreenProps<ProfileStackParamList, 'UserProfile'>;

interface UserProfile {
  id: string;
  username: string | null;
  avatar_url: string | null;
}

function useUserProfile(userId: string) {
  return useQuery({
    queryKey: ['user-profile', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, username, avatar_url')
        .eq('id', userId)
        .single();
      if (error) throw error;
      return data as UserProfile;
    },
  });
}

function useUserStats(userId: string) {
  return useQuery({
    queryKey: ['user-stats', userId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('user_activities')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);
      if (error) throw error;
      const completed = count ?? 0;
      const total = 710;
      const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
      return { completed, total, progress };
    },
  });
}

interface PostItemProps {
  post: Post;
  onLike: (post: Post) => void;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "a l'instant";
  if (min < 60) return `il y a ${min}min`;
  const hours = Math.floor(min / 60);
  if (hours < 24) return `il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  return `il y a ${days}j`;
}

const PostItem = React.memo(function PostItem({ post, onLike }: PostItemProps) {
  return (
    <View style={styles.postCard}>
      {post.content && (
        <Text style={styles.postContent}>{post.content}</Text>
      )}
      {post.image_url && (
        <Image
          source={{ uri: post.image_url }}
          style={styles.postImage}
          resizeMode="cover"
        />
      )}
      <View style={styles.postFooter}>
        <Text style={styles.postTime}>{timeAgo(post.created_at)}</Text>
        <Pressable
          style={styles.likeButton}
          onPress={() => onLike(post)}
          accessibilityLabel="Aimer ce post"
        >
          <Ionicons
            name={post.liked_by_me ? 'heart' : 'heart-outline'}
            size={20}
            color={post.liked_by_me ? COLORS.danger : COLORS.textMuted}
          />
          <Text
            style={[
              styles.likeCount,
              post.liked_by_me && { color: COLORS.danger },
            ]}
          >
            {post.like_count ?? 0}
          </Text>
        </Pressable>
      </View>
    </View>
  );
});

export default function UserProfileScreen({ route }: Props) {
  const { userId } = route.params;
  const { user } = useAuth();
  const { data: profile, isLoading: profileLoading } = useUserProfile(userId);
  const { data: stats } = useUserStats(userId);
  const { data: posts = [], isLoading: postsLoading } = useUserPosts(userId);
  const { data: friends = [] } = useFriends(user?.id);
  const sendRequest = useSendFriendRequest();
  const toggleLike = useToggleLike();

  const isFriend = friends.some((f) => f.friend.id === userId);
  const isMe = user?.id === userId;

  const handleLike = useCallback(
    (post: Post) => {
      if (!user?.id) return;
      toggleLike.mutate({
        postId: post.id,
        userId: user.id,
        isLiked: post.liked_by_me ?? false,
      });
    },
    [user?.id, toggleLike],
  );

  const handleAddFriend = useCallback(() => {
    if (!user?.id) return;
    sendRequest.mutate({ requesterId: user.id, addresseeId: userId });
  }, [user?.id, userId, sendRequest]);

  const renderPost = useCallback(
    ({ item }: { item: Post }) => <PostItem post={item} onLike={handleLike} />,
    [handleLike],
  );

  const keyExtractor = useCallback((item: Post) => item.id, []);

  if (profileLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const username = profile?.username ?? 'Randonneur';
  const avatarUrl = profile?.avatar_url;

  const ListHeader = (
    <View style={styles.header}>
      {avatarUrl ? (
        <Image source={{ uri: avatarUrl }} style={styles.avatar} />
      ) : (
        <View style={styles.avatarPlaceholder}>
          <Ionicons name="person" size={40} color={COLORS.textMuted} />
        </View>
      )}
      <Text style={styles.username}>{username}</Text>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats?.completed ?? 0}</Text>
          <Text style={styles.statLabel}>sentiers</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats?.progress ?? 0}%</Text>
          <Text style={styles.statLabel}>explore</Text>
        </View>
      </View>

      {/* Add friend button */}
      {!isMe && !isFriend && (
        <Pressable
          style={styles.addFriendButton}
          onPress={handleAddFriend}
          accessibilityLabel={`Ajouter ${username} en ami`}
        >
          <Ionicons name="person-add" size={18} color={COLORS.white} />
          <Text style={styles.addFriendText}>Ajouter en ami</Text>
        </Pressable>
      )}
      {!isMe && isFriend && (
        <View style={styles.friendBadge}>
          <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
          <Text style={styles.friendBadgeText}>Ami</Text>
        </View>
      )}

      <Text style={styles.sectionTitle}>Publications</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={keyExtractor}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          postsLoading ? (
            <ActivityIndicator
              size="small"
              color={COLORS.primary}
              style={styles.loader}
            />
          ) : (
            <View style={styles.empty}>
              <Ionicons
                name="newspaper-outline"
                size={36}
                color={COLORS.textMuted}
              />
              <Text style={styles.emptyText}>Aucun post public</Text>
            </View>
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  header: { alignItems: 'center', paddingTop: SPACING.lg, paddingBottom: SPACING.md },
  avatar: { width: 80, height: 80, borderRadius: 40 },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  username: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: SPACING.sm,
  },
  statsRow: {
    flexDirection: 'row',
    gap: SPACING.xl,
    marginTop: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
  },
  statItem: { alignItems: 'center' },
  statValue: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  statLabel: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted },
  addFriendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    marginTop: SPACING.md,
    minHeight: 48,
  },
  addFriendText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.white,
  },
  friendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginTop: SPACING.md,
    backgroundColor: COLORS.success + '20',
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
  },
  friendBadgeText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.success,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    alignSelf: 'flex-start',
    marginTop: SPACING.lg,
    marginLeft: SPACING.md,
  },
  list: { paddingBottom: SPACING.xxl },
  postCard: {
    backgroundColor: COLORS.card,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.sm,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
  },
  postContent: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textPrimary,
    lineHeight: 22,
    marginBottom: SPACING.sm,
  },
  postImage: {
    width: '100%',
    height: 200,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.sm,
  },
  postFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: SPACING.sm,
  },
  postTime: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    minWidth: 48,
    minHeight: 48,
    justifyContent: 'center',
  },
  likeCount: { fontSize: FONT_SIZE.sm, color: COLORS.textMuted },
  loader: { marginTop: SPACING.xl },
  empty: {
    alignItems: 'center',
    gap: SPACING.sm,
    paddingTop: SPACING.xl,
  },
  emptyText: { fontSize: FONT_SIZE.md, color: COLORS.textMuted },
});
