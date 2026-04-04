import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS, FONT_SIZE, SPACING, BORDER_RADIUS } from '@/constants';

interface PeriodStatsProps {
  weekTrails: number;
  weekKm: number;
  weekElevation: number;
  monthTrails: number;
  monthKm: number;
  monthElevation: number;
}

const PeriodStats = React.memo(function PeriodStats({
  weekTrails,
  weekKm,
  weekElevation,
  monthTrails,
  monthKm,
  monthElevation,
}: PeriodStatsProps) {
  return (
    <View style={styles.periodContainer}>
      <Text style={styles.sectionTitle}>Stats</Text>
      <View style={styles.periodRow}>
        <View style={styles.periodColumn}>
          <Text style={styles.periodHeader}>Cette semaine</Text>
          <Text style={styles.periodValue}>{weekTrails} rando{weekTrails > 1 ? 's' : ''}</Text>
          <Text style={styles.periodDetail}>{weekKm} km | {weekElevation}m D+</Text>
        </View>
        <View style={styles.periodDivider} />
        <View style={styles.periodColumn}>
          <Text style={styles.periodHeader}>Ce mois</Text>
          <Text style={styles.periodValue}>{monthTrails} rando{monthTrails > 1 ? 's' : ''}</Text>
          <Text style={styles.periodDetail}>{monthKm} km | {monthElevation}m D+</Text>
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  periodContainer: {
    paddingHorizontal: SPACING.md,
    marginTop: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  periodRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
  },
  periodColumn: {
    flex: 1,
    alignItems: 'center',
  },
  periodDivider: {
    width: 1,
    backgroundColor: COLORS.border,
    marginHorizontal: SPACING.sm,
  },
  periodHeader: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: SPACING.xs,
  },
  periodValue: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  periodDetail: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
});

export default PeriodStats;
