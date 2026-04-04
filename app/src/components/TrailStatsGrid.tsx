import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT_SIZE, SPACING, BORDER_RADIUS } from '@/constants';

interface StatItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}

function StatItem({ icon, label, value }: StatItemProps) {
  return (
    <View style={styles.statItem}>
      <Ionicons name={icon} size={20} color={COLORS.primary} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

interface TrailStatsGridProps {
  distance: string;
  elevation: string;
  duration: string;
  type: string;
}

export default function TrailStatsGrid({
  distance,
  elevation,
  duration,
  type,
}: TrailStatsGridProps) {
  return (
    <View style={styles.statsGrid}>
      <StatItem icon="walk-outline" label="Distance" value={distance} />
      <StatItem icon="trending-up-outline" label="Denivele" value={elevation} />
      <StatItem icon="time-outline" label="Duree" value={duration} />
      <StatItem icon="swap-horizontal-outline" label="Type" value={type} />
    </View>
  );
}

const styles = StyleSheet.create({
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  statItem: {
    alignItems: 'center',
    gap: SPACING.xs,
  },
  statValue: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  statLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
  },
});
