import React from 'react';
import {
  StyleSheet,
  Modal,
  View,
  Pressable,
  Text,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT_SIZE, SPACING, BORDER_RADIUS } from '@/constants';

interface ReviewModalProps {
  visible: boolean;
  rating: number;
  comment: string;
  onRatingChange: (rating: number) => void;
  onCommentChange: (comment: string) => void;
  onClose: () => void;
  onSubmit: () => void;
  isLoading?: boolean;
}

export default function ReviewModal({
  visible,
  rating,
  comment,
  onRatingChange,
  onCommentChange,
  onClose,
  onSubmit,
  isLoading = false,
}: ReviewModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.reviewModalOverlay}>
        <View style={styles.reviewModalContent}>
          <Text style={styles.reviewModalTitle}>Ton avis</Text>

          <View style={styles.reviewStarsSelect}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Pressable
                key={star}
                onPress={() => onRatingChange(star)}
                accessibilityLabel={`Note ${star} sur 5`}
              >
                <Ionicons
                  name={star <= rating ? 'star' : 'star-outline'}
                  size={36}
                  color={star <= rating ? COLORS.warm : COLORS.textMuted}
                />
              </Pressable>
            ))}
          </View>

          <TextInput
            style={styles.reviewInput}
            placeholder="Ton commentaire (optionnel)"
            placeholderTextColor={COLORS.textMuted}
            value={comment}
            onChangeText={onCommentChange}
            multiline
            numberOfLines={4}
            maxLength={500}
            accessibilityLabel="Commentaire"
          />

          <View style={styles.reviewModalButtons}>
            <Pressable
              style={styles.reviewCancelButton}
              onPress={onClose}
              accessibilityLabel="Annuler"
            >
              <Text style={styles.reviewCancelText}>Annuler</Text>
            </Pressable>
            <Pressable
              style={[
                styles.reviewSubmitButton,
                rating === 0 && styles.reviewSubmitDisabled,
                isLoading && { opacity: 0.5 },
              ]}
              onPress={onSubmit}
              disabled={rating === 0 || isLoading}
              accessibilityLabel="Publier l'avis"
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={COLORS.black} />
              ) : (
                <Text style={styles.reviewSubmitText}>Publier</Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  reviewModalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlayDark,
    justifyContent: 'flex-end',
  },
  reviewModalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  reviewModalTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  reviewStarsSelect: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  reviewInput: {
    backgroundColor: COLORS.surfaceLight,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.md,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: SPACING.lg,
  },
  reviewModalButtons: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  reviewCancelButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  reviewCancelText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  reviewSubmitButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.primaryLight,
  },
  reviewSubmitDisabled: {
    opacity: 0.4,
  },
  reviewSubmitText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
    color: COLORS.black,
  },
});
