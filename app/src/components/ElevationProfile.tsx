import { StyleSheet, Text, View } from 'react-native';
import { COLORS, FONT_SIZE, SPACING, BORDER_RADIUS } from '@/constants';
import type { ElevationResult } from '@/hooks/useElevation';

interface Props {
  data: ElevationResult | undefined;
  isLoading: boolean;
}

function interpolateColor(ratio: number): string {
  // From COLORS.primaryLight (green #22c55e) to COLORS.warm (orange #d97706)
  const r = Math.round(0x22 + (0xd9 - 0x22) * ratio);
  const g = Math.round(0xc5 + (0x77 - 0xc5) * ratio);
  const b = Math.round(0x5e + (0x06 - 0x5e) * ratio);
  return `rgb(${r}, ${g}, ${b})`;
}

export default function ElevationProfile({ data, isLoading }: Props) {
  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.skeleton} />
      </View>
    );
  }

  if (!data || data.elevations.length === 0) {
    return null;
  }

  const { elevations, minElev, maxElev } = data;
  const range = maxElev - minElev || 1;
  const barWidth = 100 / elevations.length;

  // Compute steepness for color: compare consecutive elevation changes
  const steepness: number[] = elevations.map((elev, i) => {
    if (i === 0) return 0;
    return Math.abs(elev - elevations[i - 1]);
  });
  const maxSteep = Math.max(...steepness, 1);

  return (
    <View style={styles.container}>
      <View style={styles.chartArea}>
        {/* Max altitude label */}
        <Text style={styles.labelMax}>{maxElev}m</Text>

        {/* Bar chart */}
        <View style={styles.barsContainer}>
          {elevations.map((elev, i) => {
            const heightPct = ((elev - minElev) / range) * 100;
            const steepRatio = steepness[i] / maxSteep;
            return (
              <View
                key={i}
                style={[
                  styles.bar,
                  {
                    width: `${barWidth}%`,
                    height: `${Math.max(heightPct, 2)}%`,
                    backgroundColor: interpolateColor(steepRatio),
                  },
                ]}
              />
            );
          })}
        </View>

        {/* Min altitude label */}
        <Text style={styles.labelMin}>{minElev}m</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: SPACING.xs,
  },
  skeleton: {
    height: 120,
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
  },
  chartArea: {
    height: 120,
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.sm,
    position: 'relative',
  },
  barsContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  bar: {
    borderTopLeftRadius: 1,
    borderTopRightRadius: 1,
  },
  labelMax: {
    position: 'absolute',
    top: SPACING.xs,
    right: SPACING.sm,
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  labelMin: {
    position: 'absolute',
    bottom: SPACING.xs,
    right: SPACING.sm,
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
});
