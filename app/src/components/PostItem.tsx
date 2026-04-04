import React, { useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  Image,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT_SIZE, SPACING, BORDER_RADIUS } from '@/constants';
import { timeAgo } from '@/lib/dateUtils';
import type { Post } from '@/hooks/useFeed';

interface PostItemProps {
  post: Post;
  onLike: (post: Post) => void;
  onComment: (post: Post) => void;
  onUserPress: (userId: string, username: string | null) => void;
}

const PostItem = React.memo(function PostItem({
  post,
  onLike,
  onComment,
  onUserPress,
}: PostItemProps) {
  const username = post.user?.username?.trim() || 'Randonneur';
  const avatarUrl = post.user?.avatar_url;
  const stats = post.stats as Record<string, number> | null;

  const heartScale = useSharedValue(1);
  const heartAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartScale.value }],
  }));

  const handleLikePress = useCallback(() => {
    heartScale.value = withSequence(
      withSpring(1.3, { damping: 6, stiffness: 200 }),
      withSpring(1, { damping: 8, stiffness: 150 }),
    );
    onLike(post);
  }, [onLike, post, heartScale]);

  return (
    <View style={styles.postCard}>
      <Pressable
        style={styles.postHeader}
        onPress={() => onUserPress(post.user_id, post.user?.username ?? null)}
        accessibilityLabel={`Voir le profil de ${username}`}
      >
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={styles.postAvatar} />
        ) : (
          <View style={styles.postAvatarPlaceholder}>
            <Ionicons name="person-circle-outline" size={24} color={COLORS.textMuted} />
          </View>
        )}
        <View style={styles.postHeaderText}>
          <Text style={styles.postUsername}>{username}</Text>
          <Text style={styles.postTime}>{timeAgo(post.created_at)}</Text>
        </View>
        {post.post_type === 'achievement' && (
          <View style={styles.achievementBadge}>
            <Ionicons name="trophy" size={12} color={COLORS.warm} />
          </View>
        )}
      </Pressable>

      {post.content && <Text style={styles.postContent}>{post.content}</Text>}

      {post.trail && (
        <View style={styles.trailBadge}>
          <Ionicons name="trail-sign" size={12} color={COLORS.primary} />
          <Text style={styles.trailBadgeText} numberOfLines={1}>
            {post.trail.name}
          </Text>
        </View>
      )}

      {post.post_type === 'achievement' && stats && (
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.completed ?? 0}</Text>
            <Text style={styles.statLabel}>sentiers</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.progress ?? 0}%</Text>
            <Text style={styles.statLabel}>explore</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.zones ?? 0}</Text>
            <Text style={styles.statLabel}>zones</Text>
          </View>
        </View>
      )}

      {post.image_url && (
        <Image
          source={{ uri: post.image_url }}
          style={styles.postImage}
          resizeMode="cover"
        />
      )}

      <View style={styles.postActions}>
        <Pressable
          style={styles.likeButton}
          onPress={handleLikePress}
          accessibilityLabel="Aimer ce post"
        >
          <Animated.View style={heartAnimatedStyle}>
            <Ionicons
              name={post.liked_by_me ? 'heart' : 'heart-outline'}
              size={20}
              color={post.liked_by_me ? COLORS.danger : COLORS.textMuted}
            />
          </Animated.View>
          <Text style={[styles.likeCount, post.liked_by_me && { color: COLORS.danger }]}>
            {post.like_count ?? 0}
          </Text>
        </Pressable>
        <Pressable
          style={styles.commentButton}
          onPress={() => onComment(post)}
          accessibilityLabel="Commenter ce post"
        >
          <Ionicons name="chatbubble-outline" size={18} color={COLORS.textMuted} />
          <Text style={styles.commentCount}>{post.comment_count ?? 0}</Text>
        </Pressable>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  postCard: {
    backgroundColor: COLORS.card,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    minHeight: SPACING.xxl,
  },
  postAvatar: { width: 36, height: 36, borderRadius: 18 },
  postAvatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  postHeaderText: { flex: 1, marginLeft: SPACING.sm },
  postUsername: { fontSize: FONT_SIZE.md, fontWeight: '600', color: COLORS.textPrimary },
  postTime: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted },
  achievementBadge: {
    backgroundColor: COLORS.warm + '20',
    padding: 6,
    borderRadius: BORDER_RADIUS.md,
  },
  postContent: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textPrimary,
    lineHeight: 22,
    marginBottom: SPACING.sm,
  },
  trailBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: COLORS.primary + '15',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
    alignSelf: 'flex-start',
    marginBottom: SPACING.sm,
  },
  trailBadgeText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.primary,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: FONT_SIZE.lg, fontWeight: '700', color: COLORS.textPrimary },
  statLabel: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted },
  postImage: { width: '100%', height: 200, borderRadius: BORDER_RADIUS.md, marginBottom: SPACING.sm },
  postActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: SPACING.sm,
    gap: SPACING.lg,
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    minWidth: SPACING.xxl,
    minHeight: SPACING.xxl,
  },
  likeCount: { fontSize: FONT_SIZE.sm, color: COLORS.textMuted },
  commentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    minWidth: SPACING.xxl,
    minHeight: SPACING.xxl,
  },
  commentCount: { fontSize: FONT_SIZE.sm, color: COLORS.textMuted },
});

export default PostItem;
