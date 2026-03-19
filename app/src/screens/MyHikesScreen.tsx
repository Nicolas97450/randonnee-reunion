import React, { useCallback, useMemo } from 'react';
import { ActivityIndicator, Alert, FlatList, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { COLORS, FONT_SIZE, SPACING, BORDER_RADIUS } from '@/constants';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { formatDuration, formatDistance, formatElevation } from '@/lib/formatters';
import { traceToGpx } from '@/lib/gpxExport';
import type { ProfileStackParamList } from '@/navigation/types';

interface HikeActivity {
  id: string;
  trail_id: string;
  distance_km: number | null;
  duration_min: number | null;
  elevation_gain_m: number | null;
  average_speed_kmh: number | null;
  trace_geojson: Record<string, unknown> | null;
  completed_at: string;
  trail: { name: string; slug: string } | null;
}

function useMyHikes(userId: string | undefined) {
  return useQuery({
    queryKey: ['my-hikes', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('user_activities')
        .select('id, trail_id, distance_km, duration_min, elevation_gain_m, average_speed_kmh, trace_geojson, completed_at, trail:trails!trail_id(name, slug)')
        .eq('user_id', userId)
        .order('completed_at', { ascending: false });

      if (error) throw error;
      return (data ?? []) as unknown as HikeActivity[];
    },
    enabled: !!userId,
  });
}

const HikeItem = React.memo(function HikeItem({
  item,
  onExport,
  onReplay,
}: {
  item: HikeActivity;
  onExport: (item: HikeActivity) => void;
  onReplay: (item: HikeActivity) => void;
}) {
  const date = new Date(item.completed_at);
  const dateStr = date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <View style={styles.hikeCard}>
      <View style={styles.hikeHeader}>
        <View style={styles.hikeInfo}>
          <Text style={styles.hikeName} numberOfLines={1}>
            {item.trail?.name ?? 'Sentier inconnu'}
          </Text>
          <Text style={styles.hikeDate}>{dateStr}</Text>
        </View>
        <Pressable
          style={styles.replayIconButton}
          onPress={() => onReplay(item)}
          accessibilityLabel={`Rejouer ${item.trail?.name ?? 'cette randonnee'}`}
        >
          <Ionicons name="play-circle-outline" size={20} color={COLORS.primaryLight} />
        </Pressable>
        <Pressable
          style={styles.exportIconButton}
          onPress={() => onExport(item)}
          accessibilityLabel={`Exporter ${item.trail?.name ?? 'cette randonnee'} en GPX`}
        >
          <Ionicons name="download-outline" size={20} color={COLORS.primaryLight} />
        </Pressable>
      </View>
      <View style={styles.hikeStats}>
        {item.distance_km !== null && (
          <View style={styles.hikeStat}>
            <Ionicons name="walk-outline" size={14} color={COLORS.primaryLight} />
            <Text style={styles.hikeStatText}>{formatDistance(item.distance_km)}</Text>
          </View>
        )}
        {item.elevation_gain_m !== null && item.elevation_gain_m > 0 && (
          <View style={styles.hikeStat}>
            <Ionicons name="trending-up" size={14} color={COLORS.warm} />
            <Text style={styles.hikeStatText}>{formatElevation(item.elevation_gain_m)}</Text>
          </View>
        )}
        {item.duration_min !== null && (
          <View style={styles.hikeStat}>
            <Ionicons name="time-outline" size={14} color={COLORS.info} />
            <Text style={styles.hikeStatText}>{formatDuration(item.duration_min)}</Text>
          </View>
        )}
        {item.average_speed_kmh !== null && (
          <View style={styles.hikeStat}>
            <Ionicons name="speedometer-outline" size={14} color={COLORS.success} />
            <Text style={styles.hikeStatText}>{item.average_speed_kmh.toFixed(1)} km/h</Text>
          </View>
        )}
      </View>
    </View>
  );
});

type MyHikesNavProp = NativeStackNavigationProp<ProfileStackParamList>;

export default function MyHikesScreen() {
  const { user } = useAuth();
  const navigation = useNavigation<MyHikesNavProp>();
  const { data: hikes = [], isLoading } = useMyHikes(user?.id);

  const handleReplay = useCallback((item: HikeActivity) => {
    const trace = item.trace_geojson as { coordinates?: number[][] } | null;
    if (!trace?.coordinates || trace.coordinates.length < 2) {
      Alert.alert('Erreur', 'Pas de trace GPS pour rejouer cette randonnee.');
      return;
    }
    navigation.navigate('TrailReplay', {
      traceGeoJson: JSON.stringify(item.trace_geojson),
      distanceKm: item.distance_km ?? 0,
      durationMin: item.duration_min ?? 60,
      trailName: item.trail?.name ?? 'Randonnee',
    });
  }, [navigation]);

  const handleExport = useCallback(async (item: HikeActivity) => {
    const trace = item.trace_geojson as { coordinates?: number[][] } | null;
    if (!trace?.coordinates) {
      Alert.alert('Erreur', 'Pas de trace GPS pour cette randonnee.');
      return;
    }
    try {
      const gpxContent = traceToGpx(
        trace.coordinates,
        item.trail?.name ?? 'Randonnee',
        item.completed_at,
      );
      const slug = item.trail?.slug ?? 'rando';
      const dateStr = new Date(item.completed_at).toISOString().slice(0, 10);
      const filename = `${slug}-${dateStr}.gpx`;
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
        Alert.alert('Erreur', 'Le partage n\'est pas disponible.');
      }
    } catch {
      Alert.alert('Erreur', 'Impossible d\'exporter le fichier GPX.');
    }
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: HikeActivity }) => (
      <HikeItem item={item} onExport={handleExport} onReplay={handleReplay} />
    ),
    [handleExport, handleReplay],
  );

  const keyExtractor = useCallback((item: HikeActivity) => item.id, []);

  const ListEmptyComponent = useMemo(() => (
    <View style={styles.emptyContainer}>
      <Ionicons name="footsteps-outline" size={64} color={COLORS.textMuted} />
      <Text style={styles.emptyTitle}>Aucune randonnee</Text>
      <Text style={styles.emptyText}>
        Lance une rando depuis la fiche d'un sentier pour voir ton historique ici.
      </Text>
    </View>
  ), []);

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={hikes.length === 0 ? styles.emptyContent : styles.listContent}
      data={hikes}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      ListEmptyComponent={isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primaryLight} />
          <Text style={styles.loadingText}>Chargement de l'historique...</Text>
        </View>
      ) : ListEmptyComponent}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  listContent: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xxl,
    gap: SPACING.sm,
  },
  emptyContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  emptyContainer: {
    alignItems: 'center',
    gap: SPACING.md,
  },
  emptyTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  emptyText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  hikeCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  hikeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  hikeInfo: {
    flex: 1,
  },
  hikeName: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  hikeDate: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  replayIconButton: {
    width: SPACING.xxl,
    height: SPACING.xxl,
    borderRadius: 24,
    backgroundColor: COLORS.primaryLight + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  exportIconButton: {
    width: SPACING.xxl,
    height: SPACING.xxl,
    borderRadius: 24,
    backgroundColor: COLORS.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hikeStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  hikeStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  hikeStatText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.md,
    paddingTop: SPACING.xxl,
  },
  loadingText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textMuted,
  },
});
