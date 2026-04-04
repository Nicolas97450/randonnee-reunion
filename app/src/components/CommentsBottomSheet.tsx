import React, { useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import BottomSheet, { BottomSheetFlatList } from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT_SIZE, SPACING, BORDER_RADIUS } from '@/constants';
import CommentItem from '@/components/CommentItem';
import type { Comment } from '@/hooks/useFeed';

interface CommentsBottomSheetProps {
  ref: React.RefObject<BottomSheet>;
  snapPoints: string[];
  onClose: () => void;
  comments: Comment[];
  commentsLoading: boolean;
  commentText: string;
  onCommentTextChange: (text: string) => void;
  onSendComment: () => void;
  isSending: boolean;
}

const CommentsBottomSheet = React.forwardRef<
  BottomSheet,
  CommentsBottomSheetProps
>(
  (
    {
      snapPoints,
      onClose,
      comments,
      commentsLoading,
      commentText,
      onCommentTextChange,
      onSendComment,
      isSending,
    },
    ref,
  ) => {
    const renderComment = useCallback(
      ({ item }: { item: Comment }) => <CommentItem comment={item} />,
      [],
    );

    const commentKeyExtractor = useCallback((item: Comment) => item.id, []);

    return (
      <BottomSheet
        ref={ref}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose
        onClose={onClose}
        backgroundStyle={styles.sheetBackground}
        handleIndicatorStyle={styles.sheetHandle}
      >
        <View style={styles.sheetHeader}>
          <Text style={styles.sheetTitle}>Commentaires</Text>
        </View>

        {commentsLoading ? (
          <View style={styles.sheetLoading}>
            <ActivityIndicator size="small" color={COLORS.primary} />
          </View>
        ) : (
          <BottomSheetFlatList
            data={comments}
            renderItem={renderComment}
            keyExtractor={commentKeyExtractor}
            contentContainerStyle={styles.commentsList}
            initialNumToRender={10}
            maxToRenderPerBatch={15}
            removeClippedSubviews={true}
            ListEmptyComponent={
              <View style={styles.commentsEmpty}>
                <Text style={styles.commentsEmptyText}>
                  Aucun commentaire. Sois le premier !
                </Text>
              </View>
            }
          />
        )}

        <View style={styles.commentInputRow}>
          <TextInput
            style={styles.commentInput}
            placeholder="Ecrire un commentaire..."
            placeholderTextColor={COLORS.textMuted}
            value={commentText}
            onChangeText={onCommentTextChange}
            maxLength={1000}
            accessibilityLabel="Ecrire un commentaire"
          />
          <Pressable
            style={[
              styles.sendCommentButton,
              !commentText.trim() && styles.sendCommentButtonDisabled,
              isSending && { opacity: 0.5 },
            ]}
            onPress={onSendComment}
            disabled={!commentText.trim() || isSending}
            accessibilityLabel="Envoyer le commentaire"
          >
            {isSending ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <Ionicons name="send" size={18} color={COLORS.white} />
            )}
          </Pressable>
        </View>
      </BottomSheet>
    );
  },
);

CommentsBottomSheet.displayName = 'CommentsBottomSheet';

const styles = StyleSheet.create({
  sheetBackground: {
    backgroundColor: COLORS.surface,
  },
  sheetHandle: {
    backgroundColor: COLORS.textMuted,
    width: 40,
  },
  sheetHeader: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  sheetTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  sheetLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: SPACING.xl,
  },
  commentsList: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.md,
  },
  commentsEmpty: {
    paddingTop: SPACING.xl,
    alignItems: 'center',
  },
  commentsEmptyText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textMuted,
  },
  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  commentInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 80,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: FONT_SIZE.sm,
    color: COLORS.textPrimary,
  },
  sendCommentButton: {
    width: SPACING.xxl,
    height: SPACING.xxl,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendCommentButtonDisabled: {
    opacity: 0.4,
  },
});

export default CommentsBottomSheet;
