import { useCallback, useMemo } from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useGPSTracking } from '@/hooks/useGPSTracking';
import { COLORS, FONT_SIZE, SPACING, BORDER_RADIUS } from '@/constants';
import { MOCK_TRAILS } from '@/lib/mockTrails';
import { formatDuration, formatDistance } from '@/lib/formatters';
import type { TrailStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<TrailStackParamList, 'Navigation'>;

export default function NavigationScreen({ route }: Props) {
  const { trailId } = route.params;
  const { currentPosition, track, isTracking, error, startTracking, stopTracking } =
    useGPSTracking();

  const trail = useMemo(() => MOCK_TRAILS.find((t) => t.slug === trailId), [trailId]);

  const elapsedMin = useMemo(() => {
    if (track.length < 2) return 0;
    return Math.round((track[track.length - 1].timestamp - track[0].timestamp) / 60000);
  }, [track]);

  const distanceKm = useMemo(() => {
    let total = 0;
    for (let i = 1; i < track.length; i++) {
      const dx = track[i].longitude - track[i - 1].longitude;
      const dy = track[i].latitude - track[i - 1].latitude;
      total += Math.sqrt((dx * 94.5) ** 2 + (dy * 111.0) ** 2);
    }
    return total;
  }, [track]);

  const handleToggleTracking = useCallback(() => {
    if (isTracking) stopTracking();
    else startTracking();
  }, [isTracking, startTracking, stopTracking]);

  return (
    <View style={styles.container}>
      {/* Map placeholder */}
      <View style={styles.mapPlaceholder}>
        <Ionicons name="navigate" size={64} color={COLORS.primary + '40'} />
        <Text style={styles.trailName}>{trail?.name ?? 'Navigation'}</Text>
        {currentPosition && (
          <Text style={styles.coords}>
            {currentPosition.latitude.toFixed(5)}, {currentPosition.longitude.toFixed(5)}
          </Text>
        )}
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{formatDistance(distanceKm)}</Text>
          <Text style={styles.statLabel}>Distance</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{formatDuration(elapsedMin)}</Text>
          <Text style={styles.statLabel}>Duree</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{track.length}</Text>
          <Text style={styles.statLabel}>Points GPS</Text>
        </View>
      </View>

      {error && (
        <View style={styles.errorBanner}>
          <Ionicons name="warning" size={16} color={COLORS.warning} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Start/Stop */}
      <View style={styles.bottomBar}>
        <Pressable
          style={[styles.trackingButton, isTracking && styles.trackingButtonStop]}
          onPress={handleToggleTracking}
        >
          <Ionicons name={isTracking ? 'stop' : 'navigate'} size={24} color={COLORS.white} />
          <Text style={styles.trackingButtonText}>
            {isTracking ? 'Arreter' : 'Demarrer la rando'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    gap: SPACING.sm,
  },
  trailName: { fontSize: FONT_SIZE.xl, fontWeight: '700', color: COLORS.textPrimary },
  coords: { fontSize: FONT_SIZE.sm, color: COLORS.textMuted },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: COLORS.card,
    paddingVertical: SPACING.md,
  },
  statBox: { alignItems: 'center' },
  statValue: { fontSize: FONT_SIZE.xl, fontWeight: '700', color: COLORS.textPrimary },
  statLabel: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.warning + '20',
    padding: SPACING.sm,
    marginHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginTop: SPACING.sm,
  },
  errorText: { fontSize: FONT_SIZE.sm, color: COLORS.warning, flex: 1 },
  bottomBar: { padding: SPACING.xl },
  trackingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.xl,
    paddingVertical: SPACING.md,
  },
  trackingButtonStop: { backgroundColor: COLORS.danger },
  trackingButtonText: { fontSize: FONT_SIZE.lg, fontWeight: '700', color: COLORS.white },
});
