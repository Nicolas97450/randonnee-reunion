import React from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT_SIZE, SPACING, BORDER_RADIUS } from '@/constants';

interface MonthlyGoalProps {
  goal: number;
  monthTrails: number;
  onIncrement: () => void;
  onDecrement: () => void;
}

const MIN_GOAL = 1;
const MAX_GOAL = 30;

const MonthlyGoal = React.memo(function MonthlyGoal({
  goal,
  monthTrails,
  onIncrement,
  onDecrement,
}: MonthlyGoalProps) {
  const pct = goal > 0 ? Math.min((monthTrails / goal) * 100, 100) : 0;
  const isCompleted = monthTrails >= goal;

  return (
    <View style={styles.goalContainer}>
      <Text style={styles.sectionTitle}>Mon objectif</Text>
      <View style={styles.goalCard}>
        <View style={styles.goalHeaderRow}>
          <Pressable
            style={[styles.goalButton, goal <= MIN_GOAL && styles.goalButtonDisabled]}
            onPress={onDecrement}
            disabled={goal <= MIN_GOAL}
            accessibilityLabel="Reduire objectif mensuel"
            accessibilityRole="button"
          >
            <Ionicons
              name="remove"
              size={20}
              color={goal <= MIN_GOAL ? COLORS.textMuted : COLORS.textPrimary}
            />
          </Pressable>
          <View style={styles.goalValueArea}>
            <Text style={styles.goalValue}>{goal}</Text>
            <Text style={styles.goalLabel}>sentiers ce mois</Text>
          </View>
          <Pressable
            style={[styles.goalButton, goal >= MAX_GOAL && styles.goalButtonDisabled]}
            onPress={onIncrement}
            disabled={goal >= MAX_GOAL}
            accessibilityLabel="Augmenter objectif mensuel"
            accessibilityRole="button"
          >
            <Ionicons
              name="add"
              size={20}
              color={goal >= MAX_GOAL ? COLORS.textMuted : COLORS.textPrimary}
            />
          </Pressable>
        </View>
        <View style={styles.goalProgressRow}>
          <View style={styles.goalBarBg}>
            <View
              style={[
                styles.goalBarFill,
                {
                  width: `${Math.round(pct)}%`,
                  backgroundColor: isCompleted ? COLORS.success : COLORS.primaryLight,
                },
              ]}
            />
          </View>
          <Text
            style={[
              styles.goalProgressText,
              isCompleted && { color: COLORS.success },
            ]}
          >
            {monthTrails}/{goal}
          </Text>
        </View>
        {isCompleted && (
          <View style={styles.goalCompletedRow}>
            <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
            <Text style={styles.goalCompletedText}>Objectif atteint</Text>
          </View>
        )}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  goalContainer: {
    paddingHorizontal: SPACING.md,
    marginTop: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  goalCard: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
  },
  goalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.lg,
    marginBottom: SPACING.md,
  },
  goalButton: {
    width: SPACING.xxl,
    height: SPACING.xxl,
    borderRadius: 24,
    backgroundColor: COLORS.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  goalButtonDisabled: {
    opacity: 0.4,
  },
  goalValueArea: {
    alignItems: 'center',
    minWidth: 120,
  },
  goalValue: {
    fontSize: FONT_SIZE.xxxl,
    fontWeight: '800',
    color: COLORS.primaryLight,
  },
  goalLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  goalProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  goalBarBg: {
    flex: 1,
    height: 8,
    backgroundColor: COLORS.border,
    borderRadius: BORDER_RADIUS.full,
    overflow: 'hidden',
  },
  goalBarFill: {
    height: '100%',
    borderRadius: BORDER_RADIUS.full,
  },
  goalProgressText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    color: COLORS.textSecondary,
    minWidth: 36,
    textAlign: 'right',
  },
  goalCompletedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    marginTop: SPACING.sm,
  },
  goalCompletedText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    color: COLORS.success,
  },
});

export default MonthlyGoal;
