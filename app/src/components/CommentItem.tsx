import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT_SIZE, SPACING } from '@/constants';
import { timeAgo } from '@/lib/dateUtils';
import type { Comment } from '@/hooks/useFeed';

interface CommentItemProps {
  comment: Comment;
}

const CommentItem = React.memo(function CommentItem({ comment }: CommentItemProps) {
  const username = comment.user?.username?.trim() || 'Randonneur';
  const avatarUrl = comment.user?.avatar_url;

  return (
    <View style={styles.commentItem}>
      {avatarUrl ? (
        <Image source={{ uri: avatarUrl }} style={styles.commentAvatar} />
      ) : (
        <View style={styles.commentAvatarPlaceholder}>
          <Ionicons name="person-circle-outline" size={24} color={COLORS.textMuted} />
        </View>
      )}
      <View style={styles.commentBody}>
        <Text style={styles.commentUsername}>{username}</Text>
        <Text style={styles.commentText}>{comment.content}</Text>
        <Text style={styles.commentTime}>{timeAgo(comment.created_at)}</Text>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  commentItem: {
    flexDirection: 'row',
    gap: SPACING.sm,
    paddingVertical: SPACING.sm,
  },
  commentAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  commentAvatarPlaceholder: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  commentBody: {
    flex: 1,
    gap: 2,
  },
  commentUsername: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  commentText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textPrimary,
    lineHeight: 18,
  },
  commentTime: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
  },
});

export default CommentItem;
