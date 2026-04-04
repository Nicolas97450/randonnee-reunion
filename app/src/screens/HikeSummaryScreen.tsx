import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Dimensions, Platform, ScrollView, Share, StyleSheet, Text, View, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import Mapbox from '@rnmapbox/maps';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import BaseMap from '@/components/BaseMap';
import ElevationProfile from '@/components/ElevationProfile';
import { COLORS, FONT_SIZE, SPACING, BORDER_RADIUS } from '@/constants';
import { useAuth } from '@/hooks/useAuth';
import { useCreatePost } from '@/hooks/useFeed';
import { useProgressStore } from '@/stores/progressStore';
import { supabase } from '@/lib/supabase';
import { formatDuration, formatDistance, formatElevation } from '@/lib/formatters';
import { traceToGpx } from '@/lib/gpxExport';
import type { TrailStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<TrailStackParamList, 'HikeSummary'>;

const CONFETTI_COLORS = [
  COLORS.primaryLight, COLORS.warm, COLORS.info,
  COLORS.danger, COLORS.success, COLORS.expert, COLORS.warm,
];
const CONFETTI_COUNT = 25;
const SCREEN_WIDTH = Dimensions.get('window').width;

interface ConfettiPieceProps {
  index: number;
  onFinish: () => void;
}

function ConfettiPiece({ index, onFinish }: ConfettiPieceProps) {
  const translateY = useSharedValue(-20);
  const translateX = useSharedValue(Math.random() * SCREEN_WIDTH);
  const rotation = useSharedValue(Math.random() * 360);
  const opacity = useSharedValue(1);

  const color = CONFETTI_COLORS[index % CONFETTI_COLORS.length];
  const size = 8 + Math.random() * 8;
  const delay = Math.random() * 400;
  const drift = (Math.random() - 0.5) * 100;

  useEffect(() => {
    const duration = 1600 + Math.random() * 600;
    translateY.value = withDelay(
      delay,
      withTiming(Dimensions.get('window').height + 40, {
        duration,
        easing: Easing.in(Easing.quad),
      }),
    );
    translateX.value = withDelay(
      delay,
      withTiming(translateX.value + drift, { duration }),
    );
    rotation.value = withDelay(
      delay,
      withTiming(rotation.value + 360 + Math.random() * 720, { duration }),
    );
    opacity.value = withDelay(
      delay + duration * 0.7,
      withTiming(0, { duration: duration * 0.3 }, (finished) => {
        if (finished && index === 0) {
          runOnJS(onFinish)();
        }
      }),
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: `${rotation.value}deg` },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          top: 0,
          left: 0,
          width: size,
          height: size * 0.6,
          backgroundColor: color,
          borderRadius: 2,
        },
        animatedStyle,
      ]}
    />
  );
}

function ConfettiOverlay() {
  const [visible, setVisible] = useState(true);
  const handleFinish = useCallback(() => setVisible(false), []);

  if (!visible) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {Array.from({ length: CONFETTI_COUNT }).map((_, i) => (
        <ConfettiPiece key={i} index={i} onFinish={handleFinish} />
      ))}
    </View>
  );
}

export default function HikeSummaryScreen({ route, navigation }: Props) {
  const {
    trailId,
    trailName,
    trailSlug,
    distanceKm,
    durationMin,
    elevationGainM,
    averageSpeedKmh,
    traceGeoJson,
    completedAt,
  } = route.params;

  const { user } = useAuth();
  const { totalCompleted, totalTrails } = useProgressStore();
  const createPost = useCreatePost();

  const [percentile, setPercentile] = useState<number | null>(null);
  const [personalRecord, setPersonalRecord] = useState<string | null>(null);
  const [autoPosted, setAutoPosted] = useState(false);

  const trace = useMemo(() => {
    try {
      return JSON.parse(traceGeoJson) as { type: string; coordinates: number[][] };
    } catch {
      return null;
    }
  }, [traceGeoJson]);

  const traceFeature = useMemo((): GeoJSON.Feature<GeoJSON.LineString> | null => {
    if (!trace) return null;
    return {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: trace.coordinates,
      },
      properties: {},
    };
  }, [trace]);

  const centerCoord = useMemo((): [number, number] => {
    if (!trace || trace.coordinates.length === 0) return [55.5, -21.1];
    const mid = Math.floor(trace.coordinates.length / 2);
    return [trace.coordinates[mid][0], trace.coordinates[mid][1]];
  }, [trace]);

  // Enriched stats from trace coordinates
  const { altitudeMax, altitudeMin, elevationLoss } = useMemo(() => {
    if (!trace || trace.coordinates.length === 0) {
      return { altitudeMax: null, altitudeMin: null, elevationLoss: 0 };
    }
    let maxAlt = -Infinity;
    let minAlt = Infinity;
    let loss = 0;
    for (let i = 0; i < trace.coordinates.length; i++) {
      const alt = trace.coordinates[i][2]; // 3rd element is altitude
      if (alt !== undefined && alt !== null) {
        if (alt > maxAlt) maxAlt = alt;
        if (alt < minAlt) minAlt = alt;
        if (i > 0) {
          const prevAlt = trace.coordinates[i - 1][2];
          if (prevAlt !== undefined && prevAlt !== null && alt < prevAlt) {
            loss += prevAlt - alt;
          }
        }
      }
    }
    return {
      altitudeMax: maxAlt === -Infinity ? null : Math.round(maxAlt),
      altitudeMin: minAlt === Infinity ? null : Math.round(minAlt),
      elevationLoss: Math.round(loss),
    };
  }, [trace]);

  // Pace moyen in min:sec/km format
  const formattedPace = useMemo(() => {
    if (durationMin < 1 || distanceKm < 0.01) return '--:--';
    const pace = durationMin / distanceKm;
    if (!isFinite(pace) || pace > 99) return '--:--';
    const mins = Math.floor(pace);
    const secs = Math.round((pace - mins) * 60);
    return `${mins}:${String(secs).padStart(2, '0')}`;
  }, [durationMin, distanceKm]);

  // Build elevation data for ElevationProfile component (from trace)
  const elevationData = useMemo(() => {
    if (!trace || trace.coordinates.length === 0) return undefined;
    const elevations = trace.coordinates
      .filter((c: number[]) => c[2] !== undefined && c[2] !== null)
      .map((c: number[]) => Math.round(c[2]));
    if (elevations.length < 2) return undefined;
    let minElev = Infinity;
    let maxElev = -Infinity;
    let totalAscent = 0;
    let totalDescent = 0;
    for (let i = 0; i < elevations.length; i++) {
      if (elevations[i] < minElev) minElev = elevations[i];
      if (elevations[i] > maxElev) maxElev = elevations[i];
      if (i > 0) {
        const diff = elevations[i] - elevations[i - 1];
        if (diff > 0) totalAscent += diff;
        else totalDescent += Math.abs(diff);
      }
    }
    // Subsample to ~50 points for the chart
    const step = Math.max(1, Math.floor(elevations.length / 50));
    const sampled = elevations.filter((_: number, i: number) => i % step === 0);
    return {
      elevations: sampled,
      minElev: minElev === Infinity ? 0 : minElev,
      maxElev: maxElev === -Infinity ? 0 : maxElev,
      totalAscent: Math.round(totalAscent),
      totalDescent: Math.round(totalDescent),
    };
  }, [trace]);

  // Calculate percentile (faster than X% of hikers on this trail)
  useEffect(() => {
    async function fetchPercentile() {
      if (!trailId) return;
      const { data } = await supabase
        .from('user_activities')
        .select('duration_min')
        .eq('trail_id', trailId)
        .not('duration_min', 'is', null);

      if (!data || data.length < 2) return;

      const durations = data
        .map((a: Record<string, unknown>) => a.duration_min as number)
        .filter((d: number) => d > 0)
        .sort((a: number, b: number) => a - b);

      if (durations.length < 2) return;

      const fasterCount = durations.filter((d: number) => d > durationMin).length;
      const pct = Math.round((fasterCount / durations.length) * 100);
      setPercentile(pct);
    }
    fetchPercentile();
  }, [trailId, durationMin]);

  // Detect personal records
  useEffect(() => {
    async function checkRecords() {
      if (!user?.id) return;
      const { data } = await supabase
        .from('user_activities')
        .select('distance_km, elevation_gain_m, duration_min')
        .eq('user_id', user.id)
        .not('distance_km', 'is', null);

      if (!data || data.length === 0) return;

      const maxElevation = Math.max(
        ...data.map((a: Record<string, unknown>) => (a.elevation_gain_m as number) ?? 0),
      );
      const maxDistance = Math.max(
        ...data.map((a: Record<string, unknown>) => (a.distance_km as number) ?? 0),
      );

      if (elevationGainM >= maxElevation && elevationGainM > 0) {
        setPersonalRecord('Record perso D+ !');
      } else if (distanceKm >= maxDistance && distanceKm > 0) {
        setPersonalRecord('Record perso distance !');
      }
    }
    checkRecords();
  }, [user?.id, elevationGainM, distanceKm]);

  // Auto-post achievement to feed
  useEffect(() => {
    if (autoPosted || !user?.id) return;
    setAutoPosted(true);

    const hours = Math.floor(durationMin / 60);
    const mins = durationMin % 60;
    const durationStr = hours > 0 ? `${hours}h${mins > 0 ? mins.toString().padStart(2, '0') : ''}` : `${mins}min`;

    createPost.mutate({
      user_id: user.id,
      content: `J'ai complete ${trailName} ! ${formatDistance(distanceKm)}, ${elevationGainM}m D+, en ${durationStr}`,
      post_type: 'achievement',
      stats: {
        distance: distanceKm,
        elevation: elevationGainM,
        duration: durationMin,
        trail_slug: trailSlug,
        average_speed: averageSpeedKmh,
      },
      visibility: 'public',
    });
  }, [user?.id, autoPosted, trailName, distanceKm, elevationGainM, durationMin, trailSlug, averageSpeedKmh, createPost]);

  const handleShare = useCallback(async () => {
    const hours = Math.floor(durationMin / 60);
    const mins = durationMin % 60;
    const durationStr = hours > 0 ? `${hours}h${mins > 0 ? mins.toString().padStart(2, '0') : ''}` : `${mins}min`;
    const message = `J'ai termine ${trailName} ! \u{1F97E} ${formatDistance(distanceKm)}, D+ ${elevationGainM}m en ${durationStr}. #RandonneeReunion`;
    try {
      await Share.share({ message });
    } catch {
      // User cancelled or error — ignore
    }
  }, [trailName, distanceKm, elevationGainM, durationMin]);

  const handleExportGpx = useCallback(async () => {
    if (!trace) {
      Alert.alert('Erreur', 'Pas de trace GPS a exporter.');
      return;
    }
    try {
      const gpxContent = traceToGpx(trace.coordinates, trailName, completedAt);
      const filename = `${trailSlug}-${new Date(completedAt).toISOString().slice(0, 10)}.gpx`;
      const filePath = `${FileSystem.cacheDirectory}${filename}`;
      await FileSystem.writeAsStringAsync(filePath, gpxContent, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(filePath, {
          mimeType: 'application/gpx+xml',
          dialogTitle: 'Exporter la trace GPX',
        });
      } else {
        Alert.alert('Erreur', 'Le partage n\'est pas disponible sur cet appareil.');
      }
    } catch {
      Alert.alert('Erreur', 'Impossible d\'exporter le fichier GPX.');
    }
  }, [trace, trailName, trailSlug, completedAt]);

  const handleReplay = useCallback(() => {
    navigation.navigate('TrailReplay', {
      traceGeoJson,
      distanceKm,
      durationMin,
      trailName,
    });
  }, [navigation, traceGeoJson, distanceKm, durationMin, trailName]);

  const handleGoHome = useCallback(() => {
    navigation.popToTop();
  }, [navigation]);

  const progressPct = totalTrails > 0 ? Math.round((totalCompleted / totalTrails) * 100) : 0;

  return (
    <View style={{ flex: 1 }}>
    <ConfettiOverlay />
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Title */}
      <Text style={styles.title} accessibilityLabel="Bravo, randonnee terminee">Bravo !</Text>
      <Text style={styles.trailName} numberOfLines={2}>{trailName}</Text>

      {/* Map with trace */}
      {traceFeature && (
        <View style={styles.mapWrapper}>
          <BaseMap centerCoordinate={centerCoord} zoomLevel={13}>
            <Mapbox.ShapeSource id="summary-trace" shape={traceFeature}>
              <Mapbox.LineLayer
                id="summary-trace-line"
                style={{
                  lineColor: COLORS.success,
                  lineWidth: 4,
                  lineOpacity: 0.9,
                }}
              />
            </Mapbox.ShapeSource>
          </BaseMap>
        </View>
      )}

      {/* Stats Row 1 */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Ionicons name="walk-outline" size={20} color={COLORS.primaryLight} />
          <Text style={styles.statValue}>{formatDistance(distanceKm)}</Text>
          <Text style={styles.statLabel}>Distance</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Ionicons name="trending-up" size={20} color={COLORS.warm} />
          <Text style={styles.statValue}>{formatElevation(elevationGainM)}</Text>
          <Text style={styles.statLabel}>D+</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Ionicons name="time-outline" size={20} color={COLORS.info} />
          <Text style={styles.statValue}>{formatDuration(durationMin)}</Text>
          <Text style={styles.statLabel}>Duree</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Ionicons name="speedometer-outline" size={20} color={COLORS.success} />
          <Text style={styles.statValue}>{averageSpeedKmh.toFixed(1)}</Text>
          <Text style={styles.statLabel}>km/h</Text>
        </View>
      </View>

      {/* Stats Row 2: Pace, Altitude, D- */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Ionicons name="footsteps-outline" size={20} color={COLORS.primaryLight} />
          <Text style={styles.statValue}>{formattedPace}</Text>
          <Text style={styles.statLabel}>Pace moy.</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Ionicons name="arrow-up-outline" size={20} color={COLORS.warm} />
          <Text style={styles.statValue}>
            {altitudeMax !== null ? `${altitudeMax}m` : '--'}
          </Text>
          <Text style={styles.statLabel}>Alt. max</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Ionicons name="arrow-down-outline" size={20} color={COLORS.info} />
          <Text style={styles.statValue}>
            {altitudeMin !== null ? `${altitudeMin}m` : '--'}
          </Text>
          <Text style={styles.statLabel}>Alt. min</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Ionicons name="trending-down" size={20} color={COLORS.danger} />
          <Text style={styles.statValue}>{elevationLoss}m</Text>
          <Text style={styles.statLabel}>D-</Text>
        </View>
      </View>

      {/* [C7] Elevation Profile — with fallback if no altitude data */}
      {elevationData ? (
        <View style={styles.elevationProfileWrapper}>
          <ElevationProfile data={elevationData} isLoading={false} />
        </View>
      ) : trace && trace.coordinates.length > 0 ? (
        <View style={[styles.elevationProfileWrapper, { alignItems: 'center', paddingVertical: SPACING.md }]}>
          <Ionicons name="analytics-outline" size={24} color={COLORS.textSecondary} />
          <Text style={{ color: COLORS.textSecondary, fontSize: FONT_SIZE.sm, marginTop: SPACING.xs }}>
            Donnees d'altitude non disponibles pour cette trace
          </Text>
        </View>
      ) : null}

      {/* Percentile */}
      {percentile !== null && percentile > 0 && (
        <View style={styles.badge}>
          <Ionicons name="trophy" size={18} color={COLORS.warm} />
          <Text style={styles.badgeText}>
            Plus rapide que {percentile}% des randonneurs
          </Text>
        </View>
      )}

      {/* Personal record */}
      {personalRecord && (
        <View style={[styles.badge, styles.recordBadge]}>
          <Ionicons name="ribbon" size={18} color={COLORS.primaryLight} />
          <Text style={[styles.badgeText, styles.recordText]}>{personalRecord}</Text>
        </View>
      )}

      {/* Progression */}
      <View style={styles.progressCard}>
        <Text style={styles.progressTitle}>Progression</Text>
        <Text style={styles.progressValue}>
          {totalCompleted}/{totalTrails} sentiers ({progressPct}%)
        </Text>
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${progressPct}%` }]} />
        </View>
      </View>

      {/* Action buttons */}
      <View style={styles.buttonsRow}>
        <Pressable
          style={[styles.actionButton, styles.shareButton]}
          onPress={handleShare}
          accessibilityLabel="Partager la randonnee"
        >
          <Ionicons name="share-social" size={20} color={COLORS.white} />
          <Text style={styles.actionButtonText}>Partager</Text>
        </Pressable>
        <Pressable
          style={[styles.actionButton, styles.exportButton]}
          onPress={handleExportGpx}
          accessibilityLabel="Exporter la trace au format GPX"
        >
          <Ionicons name="download-outline" size={20} color={COLORS.white} />
          <Text style={styles.actionButtonText}>Export GPX</Text>
        </Pressable>
      </View>

      <Pressable
        style={styles.replayButton}
        onPress={handleReplay}
        accessibilityLabel="Rejouer la randonnee"
      >
        <Ionicons name="play-circle-outline" size={20} color={COLORS.primaryLight} />
        <Text style={styles.replayButtonText}>Rejouer</Text>
      </Pressable>

      <Pressable
        style={styles.homeButton}
        onPress={handleGoHome}
        accessibilityLabel="Retour a l'accueil des sentiers"
      >
        <Ionicons name="home-outline" size={20} color={COLORS.primaryLight} />
        <Text style={styles.homeButtonText}>Accueil</Text>
      </Pressable>
    </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    paddingTop: Platform.OS === 'android' ? SPACING.xxl : SPACING.xl,
    paddingBottom: SPACING.xxl,
    paddingHorizontal: SPACING.md,
    alignItems: 'center',
  },
  title: {
    fontSize: FONT_SIZE.xxxl,
    fontWeight: '800',
    color: COLORS.primaryLight,
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  trailName: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '600',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  mapWrapper: {
    width: '100%',
    height: 220,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    marginBottom: SPACING.lg,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
    width: '100%',
    marginBottom: SPACING.md,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: SPACING.xs,
  },
  statValue: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  statLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
  },
  statDivider: {
    width: 1,
    height: 36,
    backgroundColor: COLORS.border,
  },
  elevationProfileWrapper: {
    width: '100%',
    marginBottom: SPACING.md,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.warm + '20',
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    width: '100%',
    marginBottom: SPACING.sm,
  },
  badgeText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.warm,
    flex: 1,
  },
  recordBadge: {
    backgroundColor: COLORS.primaryLight + '20',
  },
  recordText: {
    color: COLORS.primaryLight,
  },
  progressCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    width: '100%',
    marginBottom: SPACING.lg,
    gap: SPACING.sm,
  },
  progressTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  progressValue: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    color: COLORS.primaryLight,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: COLORS.border,
    borderRadius: BORDER_RADIUS.full,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.primaryLight,
    borderRadius: BORDER_RADIUS.full,
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    width: '100%',
    marginBottom: SPACING.sm,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    borderRadius: BORDER_RADIUS.xl,
    minHeight: 52,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  shareButton: {
    backgroundColor: COLORS.info,
  },
  exportButton: {
    backgroundColor: COLORS.primary,
  },
  actionButtonText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
    color: COLORS.white,
  },
  replayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    width: '100%',
    minHeight: 52,
    borderRadius: BORDER_RADIUS.xl,
    backgroundColor: COLORS.primaryLight + '15',
    marginTop: SPACING.xs,
  },
  replayButtonText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.primaryLight,
  },
  homeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    width: '100%',
    minHeight: 52,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.primaryLight + '40',
    marginTop: SPACING.xs,
  },
  homeButtonText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.primaryLight,
  },
});
