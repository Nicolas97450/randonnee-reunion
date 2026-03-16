import { useMemo } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { COLORS, FONT_SIZE, SPACING, BORDER_RADIUS, TRAIL_ZOOM } from '@/constants';
import type { TrailStackParamList } from '@/navigation/types';
import DifficultyBadge from '@/components/DifficultyBadge';
import DownloadButton from '@/components/DownloadButton';
import BaseMap from '@/components/BaseMap';
import { MOCK_TRAILS } from '@/lib/mockTrails';
import { formatDuration, formatDistance, formatElevation } from '@/lib/formatters';

type Props = NativeStackScreenProps<TrailStackParamList, 'TrailDetail'>;

export default function TrailDetailScreen({ route }: Props) {
  const { trailId } = route.params;
  const navigation = useNavigation<NativeStackNavigationProp<TrailStackParamList>>();

  const trail = useMemo(() => {
    return MOCK_TRAILS.find((t) => t.slug === trailId);
  }, [trailId]);

  if (!trail) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Sentier introuvable</Text>
      </View>
    );
  }

  const center: [number, number] = [trail.start_point.longitude, trail.start_point.latitude];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Mini carte */}
      <View style={styles.mapContainer}>
        <BaseMap centerCoordinate={center} zoomLevel={TRAIL_ZOOM} />
      </View>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.name}>{trail.name}</Text>
        <DifficultyBadge difficulty={trail.difficulty} />
      </View>

      <Text style={styles.region}>{trail.region}</Text>

      {/* Stats */}
      <View style={styles.statsGrid}>
        <StatItem icon="walk-outline" label="Distance" value={formatDistance(trail.distance_km)} />
        <StatItem
          icon="trending-up-outline"
          label="Denivele"
          value={formatElevation(trail.elevation_gain_m)}
        />
        <StatItem icon="time-outline" label="Duree" value={formatDuration(trail.duration_min)} />
        <StatItem icon="swap-horizontal-outline" label="Type" value={trail.trail_type} />
      </View>

      {/* Download */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Carte offline</Text>
        <DownloadButton
          trailSlug={trail.slug}
          tilesSizeMb={trail.tiles_size_mb}
          tilesUrl={trail.tiles_url}
        />
      </View>

      {/* Description */}
      {trail.description && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>{trail.description}</Text>
        </View>
      )}

      {/* Start button */}
      <View style={styles.startSection}>
        <Pressable
          style={styles.startButton}
          onPress={() => navigation.navigate('Navigation', { trailId: trail.slug })}
        >
          <Ionicons name="navigate" size={20} color={COLORS.white} />
          <Text style={styles.startButtonText}>Commencer la rando</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

function StatItem({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.statItem}>
      <Ionicons name={icon} size={20} color={COLORS.primary} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    paddingBottom: SPACING.xxl,
  },
  mapContainer: {
    height: 200,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
  },
  name: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
    color: COLORS.textPrimary,
    flex: 1,
    marginRight: SPACING.sm,
  },
  region: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textMuted,
    paddingHorizontal: SPACING.md,
    marginTop: SPACING.xs,
  },
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
    gap: 4,
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
  section: {
    paddingHorizontal: SPACING.md,
    marginTop: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  description: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  errorText: {
    fontSize: FONT_SIZE.lg,
    color: COLORS.danger,
    textAlign: 'center',
    marginTop: SPACING.xxl,
  },
  startSection: {
    paddingHorizontal: SPACING.md,
    marginTop: SPACING.xl,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.xl,
    paddingVertical: SPACING.md,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  startButtonText: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    color: COLORS.white,
  },
});
