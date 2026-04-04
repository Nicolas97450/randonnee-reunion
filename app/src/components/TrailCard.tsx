import React from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT_SIZE, SPACING, BORDER_RADIUS } from '@/constants';
import type { Trail, TrailType } from '@/types';
import DifficultyBadge from './DifficultyBadge';
import { formatDuration, formatDistance, formatElevation } from '@/lib/formatters';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const SPRING_CONFIG = { damping: 15, stiffness: 150 };

const TRAIL_TYPE_ICON: Record<TrailType, keyof typeof Ionicons.glyphMap> = {
  'boucle': 'repeat-outline',
  'aller-retour': 'swap-horizontal-outline',
  'point-a-point': 'arrow-forward-outline',
};

const TRAIL_TYPE_LABEL: Record<TrailType, string> = {
  'boucle': 'Boucle',
  'aller-retour': 'Aller-retour',
  'point-a-point': 'Point a point',
};

interface Props {
  trail: Omit<Trail, 'id' | 'created_at' | 'updated_at'> & { id?: string };
  onPress?: () => void;
}

const TrailCard = React.memo(function TrailCard({ trail, onPress }: Props) {
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
      android_ripple={{ color: COLORS.primary + '1A' }}
      accessibilityLabel={`Sentier ${trail.name}, ${trail.difficulty}, ${trail.region}`}
    >
      <View style={styles.header}>
        <Text style={styles.name} numberOfLines={1}>
          {trail.name}
        </Text>
        <DifficultyBadge difficulty={trail.difficulty} />
      </View>

      <View style={styles.subtitleRow}>
        <Text style={styles.region} numberOfLines={1}>{trail.region}</Text>
        <View style={styles.subtitleDot} />
        <Ionicons
          name={TRAIL_TYPE_ICON[trail.trail_type]}
          size={12}
          color={COLORS.textMuted}
        />
        <Text style={styles.trailTypeText}>{TRAIL_TYPE_LABEL[trail.trail_type]}</Text>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Ionicons name="walk-outline" size={14} color={COLORS.textSecondary} />
          <Text style={styles.statText}>{formatDistance(trail.distance_km)}</Text>
        </View>
        <View style={styles.statSeparator} />
        <View style={styles.stat}>
          <Ionicons name="trending-up-outline" size={14} color={COLORS.textSecondary} />
          <Text style={styles.statText}>{formatElevation(trail.elevation_gain_m)}</Text>
        </View>
        <View style={styles.statSeparator} />
        <View style={styles.stat}>
          <Ionicons name="time-outline" size={14} color={COLORS.textSecondary} />
          <Text style={styles.statText}>{formatDuration(trail.duration_min)}</Text>
        </View>
      </View>
    </AnimatedPressable>
  );
});

export default TrailCard;

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
    minHeight: SPACING.xxl,
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
    marginBottom: 2,
  },
  name: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
    flex: 1,
    marginRight: SPACING.sm,
  },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    gap: SPACING.xs,
  },
  region: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textMuted,
    flexShrink: 1,
  },
  subtitleDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: COLORS.textMuted,
  },
  trailTypeText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textMuted,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  statSeparator: {
    width: 1,
    height: 14,
    backgroundColor: COLORS.border,
    marginHorizontal: SPACING.sm,
  },
  statText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
  },
});
