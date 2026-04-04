import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT_SIZE, SPACING, BORDER_RADIUS } from '@/constants';

interface StreakBadgeProps {
  currentStreak: number;
  bestStreak: number;
}

const StreakBadge = React.memo(function StreakBadge({
  currentStreak,
  bestStreak,
}: StreakBadgeProps) {
  const isActive = currentStreak > 0;
  const streakColor = isActive ? COLORS.warm : COLORS.textMuted;

  return (
    <View style={styles.streakContainer}>
      <View style={[styles.streakIconCircle, { backgroundColor: streakColor + '20' }]}>
        <Ionicons
          name={isActive ? 'flame' : 'flame-outline'}
          size={28}
          color={streakColor}
        />
      </View>
      <View style={styles.streakTextContainer}>
        <Text style={[styles.streakNumber, { color: streakColor }]}>
          {currentStreak}
        </Text>
        <Text style={styles.streakLabel}>
          {currentStreak === 1 ? 'semaine' : 'semaines'}
        </Text>
      </View>
      {bestStreak > currentStreak && (
        <Text style={styles.streakBest} accessibilityLabel={`Record: ${bestStreak} semaines`}>
          Record: {bestStreak}
        </Text>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  streakContainer: {
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    minWidth: 72,
  },
  streakIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  streakTextContainer: {
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  streakNumber: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '800',
  },
  streakLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
  },
  streakBest: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
    marginTop: 2,
  },
});

export default StreakBadge;
