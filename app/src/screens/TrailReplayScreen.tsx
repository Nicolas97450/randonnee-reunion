import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { type GestureResponderEvent, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Mapbox, { type CameraRef } from '@rnmapbox/maps';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import BaseMap from '@/components/BaseMap';
import { COLORS, FONT_SIZE, SPACING, BORDER_RADIUS } from '@/constants';
import { formatDistance } from '@/lib/formatters';
import type { TrailStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<TrailStackParamList, 'TrailReplay'>;

/** Compute distance between two [lng, lat] points in km using Haversine */
function haversineKm(a: number[], b: number[]): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(b[1] - a[1]);
  const dLon = toRad(b[0] - a[0]);
  const lat1 = toRad(a[1]);
  const lat2 = toRad(b[1]);
  const h =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

/** Precompute cumulative distances for each coordinate */
function computeCumulativeDistances(coords: number[][]): number[] {
  const dists: number[] = [0];
  for (let i = 1; i < coords.length; i++) {
    dists.push(dists[i - 1] + haversineKm(coords[i - 1], coords[i]));
  }
  return dists;
}

/** Interpolate a position along the coordinates at a given fraction (0-1) */
function interpolatePosition(
  coords: number[][],
  cumDists: number[],
  fraction: number,
): { position: number[]; distanceKm: number; altitude: number } {
  const totalDist = cumDists[cumDists.length - 1];
  const targetDist = fraction * totalDist;

  if (fraction <= 0) {
    return {
      position: coords[0],
      distanceKm: 0,
      altitude: coords[0][2] ?? 0,
    };
  }
  if (fraction >= 1) {
    const last = coords[coords.length - 1];
    return {
      position: last,
      distanceKm: totalDist,
      altitude: last[2] ?? 0,
    };
  }

  // Find the segment
  let segIdx = 0;
  for (let i = 1; i < cumDists.length; i++) {
    if (cumDists[i] >= targetDist) {
      segIdx = i - 1;
      break;
    }
  }

  const segStart = cumDists[segIdx];
  const segEnd = cumDists[segIdx + 1];
  const segLen = segEnd - segStart;
  const t = segLen > 0 ? (targetDist - segStart) / segLen : 0;

  const a = coords[segIdx];
  const b = coords[segIdx + 1];
  const lng = a[0] + t * (b[0] - a[0]);
  const lat = a[1] + t * (b[1] - a[1]);
  const alt = (a[2] ?? 0) + t * ((b[2] ?? 0) - (a[2] ?? 0));

  return {
    position: [lng, lat, alt],
    distanceKm: targetDist,
    altitude: alt,
  };
}

/** Compute bearing in degrees from point a to point b ([lng, lat]) */
function computeBearing(a: number[], b: number[]): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const toDeg = (r: number) => (r * 180) / Math.PI;
  const dLng = toRad(b[0] - a[0]);
  const lat1 = toRad(a[1]);
  const lat2 = toRad(b[1]);
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

type PlaybackSpeed = 1 | 2 | 5;
const SPEED_OPTIONS: PlaybackSpeed[] = [1, 2, 5];
const TICK_MS = 50; // animation frame interval

const TrailReplayScreen = React.memo(function TrailReplayScreen({ route, navigation }: Props) {
  const { traceGeoJson, distanceKm, durationMin, trailName } = route.params;

  const coords = useMemo(() => {
    try {
      const parsed = JSON.parse(traceGeoJson) as { coordinates: number[][] };
      return parsed.coordinates;
    } catch {
      return [];
    }
  }, [traceGeoJson]);

  const cumDists = useMemo(() => computeCumulativeDistances(coords), [coords]);
  const totalDistKm = cumDists.length > 0 ? cumDists[cumDists.length - 1] : distanceKm;

  const centerCoord = useMemo((): [number, number] => {
    if (coords.length === 0) return [55.5, -21.1];
    const mid = Math.floor(coords.length / 2);
    return [coords[mid][0], coords[mid][1]];
  }, [coords]);

  const traceFeature = useMemo((): GeoJSON.Feature<GeoJSON.LineString> | null => {
    if (coords.length < 2) return null;
    return {
      type: 'Feature',
      geometry: { type: 'LineString', coordinates: coords },
      properties: {},
    };
  }, [coords]);

  const [fraction, setFraction] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState<PlaybackSpeed>(1);
  const [is3d, setIs3d] = useState(false);
  const replayCameraRef = useRef<CameraRef>(null);

  const fractionRef = useRef(fraction);
  fractionRef.current = fraction;
  const isPlayingRef = useRef(isPlaying);
  isPlayingRef.current = isPlaying;
  const speedRef = useRef(speed);
  speedRef.current = speed;
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Total real time of the hike in seconds
  const totalSeconds = durationMin * 60;

  const startPlayback = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = setInterval(() => {
      if (!isPlayingRef.current) return;

      const increment = (TICK_MS / 1000 / totalSeconds) * speedRef.current;
      const next = Math.min(fractionRef.current + increment, 1);
      setFraction(next);

      if (next >= 1) {
        setIsPlaying(false);
        if (intervalRef.current) clearInterval(intervalRef.current);
      }
    }, TICK_MS);
  }, [totalSeconds]);

  useEffect(() => {
    if (isPlaying) {
      startPlayback();
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, startPlayback]);

  const handlePlayPause = useCallback(() => {
    if (fraction >= 1) {
      setFraction(0);
      setIsPlaying(true);
    } else {
      setIsPlaying((prev) => !prev);
    }
  }, [fraction]);

  const handleSpeedChange = useCallback(() => {
    setSpeed((prev) => {
      const idx = SPEED_OPTIONS.indexOf(prev);
      return SPEED_OPTIONS[(idx + 1) % SPEED_OPTIONS.length];
    });
  }, []);

  const handleSliderPress = useCallback(
    (event: GestureResponderEvent, width: number) => {
      const x = event.nativeEvent.locationX;
      const newFraction = Math.max(0, Math.min(1, x / width));
      setFraction(newFraction);
    },
    [],
  );

  const [sliderWidth, setSliderWidth] = useState(300);

  // Current interpolated state
  const current = useMemo(
    () => interpolatePosition(coords, cumDists, fraction),
    [coords, cumDists, fraction],
  );

  // Bearing toward next point for 3D flyover camera heading
  const currentBearing = useMemo(() => {
    if (coords.length < 2) return 0;
    const totalDist = cumDists[cumDists.length - 1];
    const targetDist = fraction * totalDist;

    // Find the current segment index
    let segIdx = 0;
    for (let i = 1; i < cumDists.length; i++) {
      if (cumDists[i] >= targetDist) {
        segIdx = i - 1;
        break;
      }
      if (i === cumDists.length - 1) {
        segIdx = i - 1;
      }
    }

    const nextIdx = Math.min(segIdx + 1, coords.length - 1);
    if (segIdx === nextIdx) return 0;
    return computeBearing(coords[segIdx], coords[nextIdx]);
  }, [coords, cumDists, fraction]);

  // In 3D mode, animate the camera to follow the marker with pitch and bearing
  useEffect(() => {
    if (!is3d || !replayCameraRef.current) return;
    replayCameraRef.current.setCamera({
      centerCoordinate: [current.position[0], current.position[1]],
      zoomLevel: 15,
      pitch: 60,
      heading: currentBearing,
      animationDuration: isPlaying ? TICK_MS * 2 : 500,
      animationMode: 'easeTo',
    });
  }, [is3d, current.position, currentBearing, isPlaying]);

  const elapsedMin = fraction * durationMin;
  const elapsedSpeed =
    elapsedMin > 0 ? current.distanceKm / (elapsedMin / 60) : 0;

  const markerFeature = useMemo(
    (): GeoJSON.Feature<GeoJSON.Point> => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [current.position[0], current.position[1]],
      },
      properties: {},
    }),
    [current.position],
  );

  // Partial trace up to the current marker
  const partialTraceFeature = useMemo((): GeoJSON.Feature<GeoJSON.LineString> | null => {
    if (coords.length < 2 || fraction <= 0) return null;

    const targetDist = fraction * totalDistKm;
    const partialCoords: number[][] = [coords[0]];

    for (let i = 1; i < coords.length; i++) {
      if (cumDists[i] >= targetDist) {
        // Interpolate the final point
        const segStart = cumDists[i - 1];
        const segLen = cumDists[i] - segStart;
        const t = segLen > 0 ? (targetDist - segStart) / segLen : 0;
        const a = coords[i - 1];
        const b = coords[i];
        partialCoords.push([
          a[0] + t * (b[0] - a[0]),
          a[1] + t * (b[1] - a[1]),
        ]);
        break;
      }
      partialCoords.push(coords[i]);
    }

    if (partialCoords.length < 2) return null;

    return {
      type: 'Feature',
      geometry: { type: 'LineString', coordinates: partialCoords },
      properties: {},
    };
  }, [coords, cumDists, fraction, totalDistKm]);

  // Format elapsed time
  const formatElapsed = useCallback((mins: number): string => {
    const h = Math.floor(mins / 60);
    const m = Math.round(mins % 60);
    if (h === 0) return `${m}min`;
    return `${h}h${m.toString().padStart(2, '0')}`;
  }, []);

  if (coords.length < 2) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="alert-circle-outline" size={48} color={COLORS.textMuted} />
        <Text style={styles.emptyText}>Pas de trace GPS disponible pour le replay.</Text>
        <Pressable
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          accessibilityLabel="Retour"
        >
          <Text style={styles.backButtonText}>Retour</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Map */}
      <View style={styles.mapContainer}>
        <BaseMap centerCoordinate={centerCoord} zoomLevel={13} terrain3d={is3d} pitch={is3d ? 60 : 0}>
          {/* 3D flyover camera — controlled imperatively in useEffect */}
          {is3d && (
            <Mapbox.Camera
              ref={replayCameraRef}
              centerCoordinate={[current.position[0], current.position[1]]}
              zoomLevel={15}
              pitch={60}
              heading={currentBearing}
              animationMode="easeTo"
              animationDuration={500}
            />
          )}

          {/* Full trace (ghost) */}
          {traceFeature && (
            <Mapbox.ShapeSource id="replay-full-trace" shape={traceFeature}>
              <Mapbox.LineLayer
                id="replay-full-trace-line"
                style={{
                  lineColor: COLORS.textMuted,
                  lineWidth: 3,
                  lineOpacity: 0.3,
                }}
              />
            </Mapbox.ShapeSource>
          )}

          {/* Partial trace (animated progress) */}
          {partialTraceFeature && (
            <Mapbox.ShapeSource id="replay-partial-trace" shape={partialTraceFeature}>
              <Mapbox.LineLayer
                id="replay-partial-trace-line"
                style={{
                  lineColor: COLORS.primaryLight,
                  lineWidth: 4,
                  lineOpacity: 0.9,
                }}
              />
            </Mapbox.ShapeSource>
          )}

          {/* Marker */}
          <Mapbox.ShapeSource id="replay-marker" shape={markerFeature}>
            <Mapbox.CircleLayer
              id="replay-marker-halo"
              style={{
                circleRadius: 14,
                circleColor: COLORS.primaryLight,
                circleOpacity: 0.2,
              }}
            />
            <Mapbox.CircleLayer
              id="replay-marker-dot"
              style={{
                circleRadius: 7,
                circleColor: COLORS.primaryLight,
                circleStrokeWidth: 2,
                circleStrokeColor: COLORS.white,
              }}
            />
          </Mapbox.ShapeSource>
        </BaseMap>

        {/* 2D / 3D toggle */}
        <Pressable
          style={styles.toggleButton}
          onPress={() => setIs3d((prev) => !prev)}
          accessibilityLabel={is3d ? 'Passer en vue 2D' : 'Passer en vue 3D'}
        >
          <Ionicons name={is3d ? 'map-outline' : 'cube-outline'} size={20} color={COLORS.white} />
          <Text style={styles.toggleButtonText}>{is3d ? '2D' : '3D'}</Text>
        </Pressable>
      </View>

      {/* Controls overlay */}
      <View style={styles.controlsPanel}>
        {/* Trail name */}
        <Text style={styles.trailName} numberOfLines={1}>
          {trailName}
        </Text>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{formatDistance(current.distanceKm)}</Text>
            <Text style={styles.statLabel}>Distance</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{Math.round(current.altitude)}m</Text>
            <Text style={styles.statLabel}>Altitude</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {elapsedSpeed > 0 ? elapsedSpeed.toFixed(1) : '0.0'} km/h
            </Text>
            <Text style={styles.statLabel}>Vitesse</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{formatElapsed(elapsedMin)}</Text>
            <Text style={styles.statLabel}>Temps</Text>
          </View>
        </View>

        {/* Slider */}
        <Pressable
          style={styles.sliderTrack}
          onLayout={(e) => setSliderWidth(e.nativeEvent.layout.width)}
          onPress={(e) => handleSliderPress(e, sliderWidth)}
          accessibilityLabel="Progression du replay"
          accessibilityRole="adjustable"
        >
          <View
            style={[styles.sliderFill, { width: `${fraction * 100}%` }]}
          />
          <View
            style={[
              styles.sliderThumb,
              { left: fraction * sliderWidth - 8 },
            ]}
          />
        </Pressable>

        {/* Buttons row */}
        <View style={styles.buttonsRow}>
          <Pressable
            style={styles.speedButton}
            onPress={handleSpeedChange}
            accessibilityLabel={`Vitesse de lecture x${speed}`}
          >
            <Text style={styles.speedButtonText}>x{speed}</Text>
          </Pressable>

          <Pressable
            style={styles.playButton}
            onPress={handlePlayPause}
            accessibilityLabel={isPlaying ? 'Pause' : 'Lire le replay'}
          >
            <Ionicons
              name={isPlaying ? 'pause' : 'play'}
              size={28}
              color={COLORS.white}
            />
          </Pressable>

          <View style={styles.percentageContainer}>
            <Text style={styles.percentageText}>
              {Math.round(fraction * 100)}%
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
});

export default TrailReplayScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  mapContainer: {
    flex: 1,
  },
  toggleButton: {
    position: 'absolute',
    top: SPACING.md,
    right: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    elevation: 4,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  toggleButtonText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
    color: COLORS.white,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    gap: SPACING.md,
    padding: SPACING.xl,
  },
  emptyText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  backButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.sm,
    minHeight: 48,
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.white,
  },
  controlsPanel: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: Platform.OS === 'android' ? SPACING.lg : SPACING.xl,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    gap: SPACING.sm,
  },
  trailName: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceLight,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.xs,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  statValue: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  statLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: COLORS.border,
  },
  sliderTrack: {
    height: 28,
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
  },
  sliderFill: {
    position: 'absolute',
    left: 0,
    top: 11,
    height: 6,
    backgroundColor: COLORS.primaryLight,
    borderRadius: BORDER_RADIUS.full,
  },
  sliderThumb: {
    position: 'absolute',
    top: 6,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.primaryLight,
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  buttonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xl,
  },
  speedButton: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  speedButtonText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  playButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  percentageContainer: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  percentageText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
});
