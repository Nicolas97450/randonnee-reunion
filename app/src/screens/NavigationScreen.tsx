import { useCallback, useMemo, useState } from 'react';
import { StyleSheet, Text, View, Pressable, Modal } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import MapLibreGL from '@maplibre/maplibre-react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import BaseMap from '@/components/BaseMap';
import SOSButton from '@/components/SOSButton';
import ReportForm from '@/components/ReportForm';
import { useGPSTracking } from '@/hooks/useGPSTracking';
import { COLORS, FONT_SIZE, SPACING, BORDER_RADIUS, TRAIL_ZOOM } from '@/constants';
import { useSupabaseTrails } from '@/hooks/useSupabaseTrails';
import { formatDuration, formatDistance } from '@/lib/formatters';
import type { TrailStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<TrailStackParamList, 'Navigation'>;

export default function NavigationScreen({ route }: Props) {
  const { trailId } = route.params;
  const { currentPosition, track, isTracking, error, startTracking, stopTracking } =
    useGPSTracking();
  const [showReportForm, setShowReportForm] = useState(false);
  const trackingScale = useSharedValue(1);
  const trackingAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: trackingScale.value }],
  }));

  const { trails } = useSupabaseTrails();
  const trail = useMemo(() => trails.find((t) => t.slug === trailId), [trails, trailId]);

  const trackGeoJson = useMemo(() => {
    if (track.length < 2) return null;
    return {
      type: 'Feature' as const,
      geometry: {
        type: 'LineString' as const,
        coordinates: track.map((p) => [p.longitude, p.latitude]),
      },
      properties: {},
    };
  }, [track]);

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

  const center: [number, number] = currentPosition
    ? [currentPosition.longitude, currentPosition.latitude]
    : trail
      ? [trail.start_point.longitude, trail.start_point.latitude]
      : [55.5364, -21.1151];

  const handleToggleTracking = useCallback(() => {
    if (isTracking) stopTracking();
    else startTracking();
  }, [isTracking, startTracking, stopTracking]);

  return (
    <GestureHandlerRootView style={styles.container}>
      <BaseMap centerCoordinate={center} zoomLevel={TRAIL_ZOOM} showUserLocation>
        {trackGeoJson && (
          <MapLibreGL.ShapeSource id="user-track" shape={trackGeoJson}>
            <MapLibreGL.LineLayer
              id="user-track-line"
              style={{ lineColor: '#22c55e', lineWidth: 5, lineOpacity: 0.8 }}
            />
          </MapLibreGL.ShapeSource>
        )}
      </BaseMap>

      <View style={styles.statsOverlay}>
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
          <Text style={styles.statLabel}>Points</Text>
        </View>
      </View>

      {error && (
        <View style={styles.errorBanner}>
          <Ionicons name="warning" size={16} color={COLORS.warning} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* SOS + Signaler */}
      <View style={styles.actionButtons}>
        <SOSButton compact />
        <Pressable style={styles.reportButton} onPress={() => setShowReportForm(true)}>
          <Ionicons name="warning" size={20} color={COLORS.white} />
        </Pressable>
      </View>

      <Animated.View style={[styles.bottomBar, trackingAnimStyle]}>
        <Pressable
          style={[styles.trackingButton, isTracking && styles.trackingButtonStop]}
          onPress={handleToggleTracking}
          onPressIn={() => { trackingScale.value = withSpring(0.97, { damping: 15, stiffness: 150 }); }}
          onPressOut={() => { trackingScale.value = withSpring(1, { damping: 15, stiffness: 150 }); }}
        >
          <Ionicons name={isTracking ? 'stop' : 'navigate'} size={24} color={COLORS.white} />
          <Text style={styles.trackingButtonText}>
            {isTracking ? 'Arreter' : 'Demarrer la rando'}
          </Text>
        </Pressable>
      </Animated.View>

      {/* Modal signalement */}
      <Modal visible={showReportForm} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ReportForm
              trailId={trail?.slug ?? ''}
              latitude={currentPosition?.latitude ?? -21.1151}
              longitude={currentPosition?.longitude ?? 55.5364}
              onClose={() => setShowReportForm(false)}
            />
          </View>
        </View>
      </Modal>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  statsOverlay: {
    position: 'absolute', top: SPACING.md, left: SPACING.md, right: SPACING.md,
    flexDirection: 'row', justifyContent: 'space-around',
    backgroundColor: COLORS.surface + 'E6', borderRadius: BORDER_RADIUS.lg, paddingVertical: SPACING.sm,
  },
  statBox: { alignItems: 'center' },
  statValue: { fontSize: FONT_SIZE.lg, fontWeight: '700', color: COLORS.textPrimary },
  statLabel: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted },
  errorBanner: {
    position: 'absolute', top: 80, left: SPACING.md, right: SPACING.md,
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    backgroundColor: COLORS.warning + '20', borderRadius: BORDER_RADIUS.md, padding: SPACING.sm,
  },
  errorText: { fontSize: FONT_SIZE.sm, color: COLORS.warning, flex: 1 },
  actionButtons: {
    position: 'absolute', top: 80, right: SPACING.md,
    gap: SPACING.sm,
  },
  reportButton: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.warning,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: COLORS.warning, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.4, shadowRadius: 4, elevation: 4,
  },
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.background, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  bottomBar: { position: 'absolute', bottom: SPACING.xl, left: SPACING.xl, right: SPACING.xl },
  trackingButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm,
    backgroundColor: COLORS.primary, borderRadius: BORDER_RADIUS.xl, paddingVertical: SPACING.md,
    shadowColor: COLORS.black, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8,
  },
  trackingButtonStop: { backgroundColor: COLORS.danger },
  trackingButtonText: { fontSize: FONT_SIZE.lg, fontWeight: '700', color: COLORS.white },
});
