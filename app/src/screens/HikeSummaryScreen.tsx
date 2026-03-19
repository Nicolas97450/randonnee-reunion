import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MapLibreGL from '@maplibre/maplibre-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import BaseMap from '@/components/BaseMap';
import { COLORS, FONT_SIZE, SPACING, BORDER_RADIUS } from '@/constants';
import { useAuth } from '@/hooks/useAuth';
import { useCreatePost } from '@/hooks/useFeed';
import { useProgressStore } from '@/stores/progressStore';
import { supabase } from '@/lib/supabase';
import { formatDuration, formatDistance, formatElevation } from '@/lib/formatters';
import { traceToGpx } from '@/lib/gpxExport';
import type { TrailStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<TrailStackParamList, 'HikeSummary'>;

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

  const handleShare = useCallback(() => {
    Alert.alert(
      'Partager',
      'La capture d\'ecran sera disponible dans une prochaine mise a jour.',
    );
  }, []);

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
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Title */}
      <Text style={styles.title} accessibilityLabel="Bravo, randonnee terminee">Bravo !</Text>
      <Text style={styles.trailName} numberOfLines={2}>{trailName}</Text>

      {/* Map with trace */}
      {traceFeature && (
        <View style={styles.mapWrapper}>
          <BaseMap centerCoordinate={centerCoord} zoomLevel={13}>
            <MapLibreGL.ShapeSource id="summary-trace" shape={traceFeature}>
              <MapLibreGL.LineLayer
                id="summary-trace-line"
                style={{
                  lineColor: COLORS.success,
                  lineWidth: 4,
                  lineOpacity: 0.9,
                }}
              />
            </MapLibreGL.ShapeSource>
          </BaseMap>
        </View>
      )}

      {/* Stats */}
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
          <Text style={styles.statLabel}>Denivele</Text>
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
