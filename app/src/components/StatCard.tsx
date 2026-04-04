import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT_SIZE, SPACING, BORDER_RADIUS } from '@/constants';
import { useAnimatedCounter } from '@/hooks/useAnimatedCounter';

interface StatCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  value: string;
  label: string;
  color: string;
  animateNumeric?: number;
}

const StatCard = React.memo(function StatCard({
  icon,
  value,
  label,
  color,
  animateNumeric,
}: StatCardProps) {
  const animatedNum = useAnimatedCounter(animateNumeric ?? 0);

  const displayValue = animateNumeric !== undefined
    ? value.replace(String(animateNumeric), String(animatedNum))
    : value;

  return (
    <View style={styles.statCard}>
      <Ionicons name={icon} size={24} color={color} />
      <Text style={styles.statValue}>{displayValue}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
});

const styles = StyleSheet.create({
  statCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginHorizontal: SPACING.xs,
    gap: SPACING.xs,
  },
  statValue: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  statLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
  },
});

export default StatCard;
