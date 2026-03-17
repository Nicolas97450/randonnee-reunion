import { StyleSheet, Text, View, Pressable } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT_SIZE, SPACING, BORDER_RADIUS } from '@/constants';
import type { Trail } from '@/types';
import DifficultyBadge from './DifficultyBadge';
import { formatDuration, formatDistance, formatElevation } from '@/lib/formatters';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const SPRING_CONFIG = { damping: 15, stiffness: 150 };

interface Props {
  trail: Omit<Trail, 'id' | 'created_at' | 'updated_at'> & { id?: string };
  onPress?: () => void;
}

export default function TrailCard({ trail, onPress }: Props) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      style={[styles.card, animatedStyle]}
      onPress={onPress}
      onPressIn={() => { scale.value = withSpring(0.97, SPRING_CONFIG); }}
      onPressOut={() => { scale.value = withSpring(1, SPRING_CONFIG); }}
      android_ripple={{ color: 'rgba(20, 83, 45, 0.1)' }}
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
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
    minHeight: 44,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
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
