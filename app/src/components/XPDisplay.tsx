import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT_SIZE, SPACING, BORDER_RADIUS } from '@/constants';

interface XPDisplayProps {
  totalXP: number;
}

const XPDisplay = React.memo(function XPDisplay({
  totalXP,
}: XPDisplayProps) {
  const formatted = totalXP >= 1000
    ? `${(totalXP / 1000).toFixed(1)}k`
    : String(totalXP);

  return (
    <View style={styles.xpContainer}>
      <Ionicons name="star" size={20} color={COLORS.warm} />
      <Text style={styles.xpValue}>{formatted}</Text>
      <Text style={styles.xpLabel}>XP</Text>
    </View>
  );
});

const styles = StyleSheet.create({
  xpContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    minWidth: 72,
    justifyContent: 'center',
  },
  xpValue: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '800',
    color: COLORS.warm,
  },
  xpLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
  },
});

export default XPDisplay;
