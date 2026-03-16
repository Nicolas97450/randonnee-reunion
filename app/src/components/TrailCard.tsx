import { StyleSheet, Text, View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT_SIZE, SPACING, BORDER_RADIUS } from '@/constants';
import type { Trail } from '@/types';
import DifficultyBadge from './DifficultyBadge';
import { formatDuration, formatDistance, formatElevation } from '@/lib/formatters';

interface Props {
  trail: Omit<Trail, 'id' | 'created_at' | 'updated_at'> & { id?: string };
  onPress?: () => void;
}

export default function TrailCard({ trail, onPress }: Props) {
  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={onPress}
    >
      <View style={styles.header}>
        <Text style={styles.name} numberOfLines={1}>
          {trail.name}
        </Text>
        <DifficultyBadge difficulty={trail.difficulty} />
      </View>

      <Text style={styles.region}>{trail.region}</Text>

      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Ionicons name="walk-outline" size={14} color={COLORS.textSecondary} />
          <Text style={styles.statText}>{formatDistance(trail.distance_km)}</Text>
        </View>
        <View style={styles.stat}>
          <Ionicons name="trending-up-outline" size={14} color={COLORS.textSecondary} />
          <Text style={styles.statText}>{formatElevation(trail.elevation_gain_m)}</Text>
        </View>
        <View style={styles.stat}>
          <Ionicons name="time-outline" size={14} color={COLORS.textSecondary} />
          <Text style={styles.statText}>{formatDuration(trail.duration_min)}</Text>
        </View>
        <View style={styles.stat}>
          <Ionicons name="swap-horizontal-outline" size={14} color={COLORS.textSecondary} />
          <Text style={styles.statText}>{trail.trail_type}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  cardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  name: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
    flex: 1,
    marginRight: SPACING.sm,
  },
  region: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textMuted,
    marginBottom: SPACING.sm,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
  },
});
