import React, { useMemo, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { COLORS, FONT_SIZE, SPACING, BORDER_RADIUS } from '@/constants';
import { useProgressStore } from '@/stores/progressStore';
import { useSupabaseTrails } from '@/hooks/useSupabaseTrails';
import { CHALLENGES, type Challenge, type ChallengeProgress, type ChallengeTrail } from '@/lib/challenges';

// --- Types ---

interface ChallengeWithProgress {
  challenge: Challenge;
  progress: ChallengeProgress;
}

// --- Memoized sub-components ---

const ProgressBar = React.memo(function ProgressBar({
  current,
  target,
  color,
  completed,
}: {
  current: number;
  target: number;
  color: string;
  completed: boolean;
}) {
  const pct = target > 0 ? Math.min((current / target) * 100, 100) : 0;
  const barColor = completed ? COLORS.success : color;

  return (
    <View style={styles.progressBarContainer}>
      <View style={styles.progressBarBg}>
        <View
          style={[
            styles.progressBarFill,
            { width: `${Math.round(pct)}%`, backgroundColor: barColor },
          ]}
        />
      </View>
      <Text style={[styles.progressText, completed && { color: COLORS.success }]}>
        {current}/{target}
      </Text>
    </View>
  );
});

const ChallengeCard = React.memo(function ChallengeCard({
  item,
  onPress,
}: {
  item: ChallengeWithProgress;
  onPress: (item: ChallengeWithProgress) => void;
}) {
  const { challenge, progress } = item;
  const iconName = challenge.icon as keyof typeof Ionicons.glyphMap;
  const cardBorderColor = progress.completed ? COLORS.success : COLORS.border;

  const handlePress = useCallback(() => {
    onPress(item);
  }, [item, onPress]);

  return (
    <Pressable
      style={[styles.card, { borderColor: cardBorderColor }]}
      onPress={handlePress}
      accessibilityLabel={`Defi ${challenge.name}: ${progress.current} sur ${progress.target}${progress.completed ? ', termine' : ''}`}
      accessibilityRole="button"
    >
      <View style={styles.cardHeader}>
        <View style={[styles.iconCircle, { backgroundColor: challenge.color + '20' }]}>
          <Ionicons name={iconName} size={24} color={challenge.color} />
        </View>
        <View style={styles.cardTitleArea}>
          <View style={styles.cardTitleRow}>
            <Text style={styles.cardTitle} numberOfLines={1}>
              {challenge.name}
            </Text>
            {progress.completed && (
              <View style={styles.completedBadge}>
                <Ionicons name="checkmark-circle" size={18} color={COLORS.success} />
                <Text style={styles.completedText}>Termine</Text>
              </View>
            )}
          </View>
          <Text style={styles.cardDescription} numberOfLines={2}>
            {challenge.description}
          </Text>
        </View>
      </View>
      <ProgressBar
        current={progress.current}
        target={progress.target}
        color={challenge.color}
        completed={progress.completed}
      />
      {progress.matchingSlugs.length > 0 && (
        <Text style={styles.trailHint}>
          {progress.matchingSlugs.length} sentier{progress.matchingSlugs.length > 1 ? 's' : ''} concerne{progress.matchingSlugs.length > 1 ? 's' : ''}
        </Text>
      )}
    </Pressable>
  );
});

// --- Main screen ---

export default function ChallengesScreen() {
  const navigation = useNavigation();
  const {
    completedTrailSlugs,
    completionTimestamps,
    periodStats,
    isLoading,
  } = useProgressStore();

  const { trails, isLoading: trailsLoading } = useSupabaseTrails();

  // Compute total km from completed trails
  const totalKm = useMemo((): number => {
    if (!trails || trails.length === 0) return 0;
    const completedSet = new Set(completedTrailSlugs);
    return trails
      .filter((t) => completedSet.has(t.slug))
      .reduce((sum: number, t) => sum + (t.distance_km ?? 0), 0);
  }, [trails, completedTrailSlugs]);

  const challengesWithProgress = useMemo<ChallengeWithProgress[]>(() => {
    if (!trails || trails.length === 0) return [];
    const trailData: ChallengeTrail[] = trails;
    return CHALLENGES.map((challenge) => ({
      challenge,
      progress: challenge.getProgress(
        completedTrailSlugs,
        trailData,
        completionTimestamps,
        totalKm,
      ),
    }));
  }, [completedTrailSlugs, trails, completionTimestamps, totalKm]);

  // Sort: in-progress first, then completed, then not-started
  const sortedChallenges = useMemo(() => {
    return [...challengesWithProgress].sort((a, b) => {
      if (a.progress.completed !== b.progress.completed) {
        return a.progress.completed ? 1 : -1;
      }
      const aPct = a.progress.target > 0 ? a.progress.current / a.progress.target : 0;
      const bPct = b.progress.target > 0 ? b.progress.current / b.progress.target : 0;
      return bPct - aPct;
    });
  }, [challengesWithProgress]);

  const completedCount = useMemo(
    () => challengesWithProgress.filter((c) => c.progress.completed).length,
    [challengesWithProgress],
  );

  const handleChallengePress = useCallback(
    (item: ChallengeWithProgress) => {
      if (item.progress.matchingSlugs.length > 0) {
        // Navigate to the first matching trail
        const slug = item.progress.matchingSlugs[0];
        const trail = trails?.find((t: ChallengeTrail) => t.slug === slug);
        if (trail) {
          navigation.navigate('TrailsTab', {
            screen: 'TrailDetail',
            params: { trailId: trail.slug, trailName: trail.name },
          });
        }
      }
    },
    [trails, navigation],
  );

  const renderItem = useCallback(
    ({ item }: { item: ChallengeWithProgress }) => (
      <ChallengeCard item={item} onPress={handleChallengePress} />
    ),
    [handleChallengePress],
  );

  const keyExtractor = useCallback(
    (item: ChallengeWithProgress) => item.challenge.id,
    [],
  );

  if (isLoading || trailsLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primaryLight} />
        <Text style={styles.loadingText}>Chargement des defis...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Summary header */}
      <View style={styles.summaryHeader}>
        <View style={styles.summaryIconCircle}>
          <Ionicons name="ribbon" size={28} color={COLORS.warm} />
        </View>
        <View style={styles.summaryTextArea}>
          <Text style={styles.summaryTitle}>
            {completedCount}/{CHALLENGES.length} defis termines
          </Text>
          <Text style={styles.summarySubtitle}>
            Completez des defis pour debloquer des badges
          </Text>
        </View>
      </View>

      <FlatList
        data={sortedChallenges}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        initialNumToRender={10}
        maxToRenderPerBatch={15}
        removeClippedSubviews={true}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.md,
  },
  loadingText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textMuted,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  summaryIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.warm + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryTextArea: {
    flex: 1,
  },
  summaryTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  summarySubtitle: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textMuted,
    marginTop: SPACING.xs,
  },
  listContent: {
    padding: SPACING.md,
    paddingBottom: SPACING.xxl,
    gap: SPACING.md,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  iconCircle: {
    width: SPACING.xxl,
    height: SPACING.xxl,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitleArea: {
    flex: 1,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.sm,
  },
  cardTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    color: COLORS.textPrimary,
    flex: 1,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: COLORS.success + '20',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
  },
  completedText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
    color: COLORS.success,
  },
  cardDescription: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  progressBarBg: {
    flex: 1,
    height: 8,
    backgroundColor: COLORS.border,
    borderRadius: BORDER_RADIUS.full,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: BORDER_RADIUS.full,
  },
  progressText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    color: COLORS.textSecondary,
    minWidth: 40,
    textAlign: 'right',
  },
  trailHint: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
    marginTop: SPACING.sm,
  },
});
