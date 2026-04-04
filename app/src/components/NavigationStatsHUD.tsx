import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS, FONT_SIZE, SPACING, BORDER_RADIUS } from '@/constants';
import { formatDuration } from '@/lib/formatters';

type NavigationStatsHUDProps = {
  isTracking: boolean;
  distanceKm: number;
  trailDistanceKm?: number;
  formattedTime: string;
  speedKmH: number;
  currentAltitude: number | null;
  cumulativeElevationGain: number;
  formattedPace: string;
  progressPercent: number;
  estimatedTimeRemaining: number | null;
};

export default function NavigationStatsHUD({
  isTracking,
  distanceKm,
  trailDistanceKm,
  formattedTime,
  speedKmH,
  currentAltitude,
  cumulativeElevationGain,
  formattedPace,
  progressPercent,
  estimatedTimeRemaining,
}: NavigationStatsHUDProps) {
  return (
    <>
      {/* Row 1: Distance | Duree | Vitesse */}
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>
            {isTracking ? distanceKm.toFixed(1) : (trailDistanceKm ?? 0).toFixed(1)}
          </Text>
          <Text style={styles.statLabel}>KM</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{formattedTime}</Text>
          <Text style={styles.statLabel}>DUREE</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{speedKmH.toFixed(1)}</Text>
          <Text style={styles.statLabel}>KM/H</Text>
        </View>
      </View>

      {/* Row 2: Altitude | D+ | Pace (visible during tracking) */}
      {isTracking && (
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>
              {currentAltitude !== null ? `${currentAltitude}` : '--'}
            </Text>
            <Text style={styles.statLabel}>ALT. M</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{cumulativeElevationGain}</Text>
            <Text style={styles.statLabel}>D+ M</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{formattedPace}</Text>
            <Text style={styles.statLabel}>MIN/KM</Text>
          </View>
        </View>
      )}

      {/* Progress bar + remaining time (visible during tracking) */}
      {isTracking && (
        <View style={styles.progressSection}>
          <View style={styles.progressBarBackground}>
            <View style={[styles.progressBarFill, { width: `${Math.min(100, progressPercent)}%` }]} />
          </View>
          <View style={styles.progressInfoRow}>
            <Text style={styles.progressPercentText}>{Math.round(progressPercent)}%</Text>
            {estimatedTimeRemaining !== null && estimatedTimeRemaining > 0 && (
              <Text style={styles.estimatedTimeText}>
                ~{formatDuration(estimatedTimeRemaining)} restantes
              </Text>
            )}
          </View>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  statLabel: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
    color: COLORS.textMuted,
    marginTop: 2,
  },
  progressSection: {
    gap: SPACING.xs,
  },
  progressBarBackground: {
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 4,
    backgroundColor: COLORS.success,
    borderRadius: 2,
  },
  progressInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressPercentText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  estimatedTimeText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
});
