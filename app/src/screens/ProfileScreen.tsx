import React, { useEffect, useMemo, useCallback, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable, Image, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { COLORS, FONT_SIZE, SPACING, BORDER_RADIUS } from '@/constants';
import { useAuth } from '@/hooks/useAuth';
import { useProgressStore } from '@/stores/progressStore';
import { useAvatar } from '@/hooks/useAvatar';
import { useCreatePost } from '@/hooks/useFeed';
import IslandProgressMap from '@/components/IslandProgressMap';
import { useCommunityChallenge } from '@/hooks/useCommunityChallenge';
import type { CommunityChallenge } from '@/hooks/useCommunityChallenge';
import {
  getHikerLevel,
  getNextLevel,
  getLevelProgress,
  getEarnedBadges,
  BADGES,
  type UserStats,
} from '@/lib/badges';
import type { ProfileStackParamList } from '@/navigation/types';

// --- Memoized sub-components ---

const StatCard = React.memo(function StatCard({
  icon,
  value,
  label,
  color,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  value: string;
  label: string;
  color: string;
}) {
  return (
    <View style={styles.statCard}>
      <Ionicons name={icon} size={24} color={color} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
});

const LevelBar = React.memo(function LevelBar({
  trailsCompleted,
}: {
  trailsCompleted: number;
}) {
  const level = getHikerLevel(trailsCompleted);
  const next = getNextLevel(trailsCompleted);
  const progress = getLevelProgress(trailsCompleted);

  return (
    <View style={styles.levelContainer}>
      <View style={styles.levelHeader}>
        <View style={[styles.levelBadgeCircle, { backgroundColor: level.color + '20', borderColor: level.color }]}>
          <Text style={[styles.levelNumber, { color: level.color }]}>{level.level}</Text>
        </View>
        <View style={styles.levelInfo}>
          <Text style={[styles.levelName, { color: level.color }]}>{level.name}</Text>
          {next ? (
            <Text style={styles.levelSubtitle}>
              {trailsCompleted}/{next.minTrails} sentiers pour {next.name}
            </Text>
          ) : (
            <Text style={styles.levelSubtitle}>Niveau maximum atteint</Text>
          )}
        </View>
      </View>
      <View style={styles.levelBarBg}>
        <View
          style={[
            styles.levelBarFill,
            {
              width: `${Math.round(progress * 100)}%`,
              backgroundColor: level.color,
            },
          ]}
        />
      </View>
    </View>
  );
});

const StreakBadge = React.memo(function StreakBadge({
  currentStreak,
  bestStreak,
}: {
  currentStreak: number;
  bestStreak: number;
}) {
  const isActive = currentStreak > 0;
  const streakColor = isActive ? COLORS.warm : COLORS.textMuted;

  return (
    <View style={styles.streakContainer}>
      <View style={[styles.streakIconCircle, { backgroundColor: streakColor + '20' }]}>
        <Ionicons
          name={isActive ? 'flame' : 'flame-outline'}
          size={28}
          color={streakColor}
        />
      </View>
      <View style={styles.streakTextContainer}>
        <Text style={[styles.streakNumber, { color: streakColor }]}>
          {currentStreak}
        </Text>
        <Text style={styles.streakLabel}>
          {currentStreak === 1 ? 'semaine' : 'semaines'}
        </Text>
      </View>
      {bestStreak > currentStreak && (
        <Text style={styles.streakBest} accessibilityLabel={`Record: ${bestStreak} semaines`}>
          Record: {bestStreak}
        </Text>
      )}
    </View>
  );
});

const XPDisplay = React.memo(function XPDisplay({
  totalXP,
}: {
  totalXP: number;
}) {
  const formatted = totalXP >= 1000
    ? `${(totalXP / 1000).toFixed(1)}k`
    : String(totalXP);

  return (
    <View style={styles.xpContainer}>
      <Ionicons name="star" size={20} color={COLORS.warm} />
      <Text style={styles.xpValue}>{formatted}</Text>
      <Text style={styles.xpLabel}>XP</Text>
    </View>
  );
});

const PeriodStats = React.memo(function PeriodStats({
  weekTrails,
  weekKm,
  weekElevation,
  monthTrails,
  monthKm,
  monthElevation,
}: {
  weekTrails: number;
  weekKm: number;
  weekElevation: number;
  monthTrails: number;
  monthKm: number;
  monthElevation: number;
}) {
  return (
    <View style={styles.periodContainer}>
      <Text style={styles.sectionTitle}>Stats</Text>
      <View style={styles.periodRow}>
        <View style={styles.periodColumn}>
          <Text style={styles.periodHeader}>Cette semaine</Text>
          <Text style={styles.periodValue}>{weekTrails} rando{weekTrails > 1 ? 's' : ''}</Text>
          <Text style={styles.periodDetail}>{weekKm} km | {weekElevation}m D+</Text>
        </View>
        <View style={styles.periodDivider} />
        <View style={styles.periodColumn}>
          <Text style={styles.periodHeader}>Ce mois</Text>
          <Text style={styles.periodValue}>{monthTrails} rando{monthTrails > 1 ? 's' : ''}</Text>
          <Text style={styles.periodDetail}>{monthKm} km | {monthElevation}m D+</Text>
        </View>
      </View>
    </View>
  );
});

const BadgeItem = React.memo(function BadgeItem({
  name,
  icon,
  color,
  earned,
  description,
}: {
  name: string;
  icon: string;
  color: string;
  earned: boolean;
  description: string;
}) {
  const displayColor = earned ? color : COLORS.textMuted;
  const opacity = earned ? 1 : 0.35;

  return (
    <View
      style={[styles.badgeItem, { opacity }]}
      accessibilityLabel={`${name}: ${earned ? 'debloque' : 'verrouille'}. ${description}`}
    >
      <View style={[styles.badgeIconCircle, { backgroundColor: displayColor + '20' }]}>
        <Ionicons
          name={icon as keyof typeof Ionicons.glyphMap}
          size={22}
          color={displayColor}
        />
      </View>
      <Text style={[styles.badgeName, { color: displayColor }]} numberOfLines={1}>
        {name}
      </Text>
    </View>
  );
});

const GOAL_STORAGE_KEY = '@rando_monthly_goal';
const DEFAULT_GOAL = 5;
const MIN_GOAL = 1;
const MAX_GOAL = 30;

const MonthlyGoal = React.memo(function MonthlyGoal({
  goal,
  monthTrails,
  onIncrement,
  onDecrement,
}: {
  goal: number;
  monthTrails: number;
  onIncrement: () => void;
  onDecrement: () => void;
}) {
  const pct = goal > 0 ? Math.min((monthTrails / goal) * 100, 100) : 0;
  const isCompleted = monthTrails >= goal;

  return (
    <View style={styles.goalContainer}>
      <Text style={styles.sectionTitle}>Mon objectif</Text>
      <View style={styles.goalCard}>
        <View style={styles.goalHeaderRow}>
          <Pressable
            style={[styles.goalButton, goal <= MIN_GOAL && styles.goalButtonDisabled]}
            onPress={onDecrement}
            disabled={goal <= MIN_GOAL}
            accessibilityLabel="Reduire objectif mensuel"
            accessibilityRole="button"
          >
            <Ionicons
              name="remove"
              size={20}
              color={goal <= MIN_GOAL ? COLORS.textMuted : COLORS.textPrimary}
            />
          </Pressable>
          <View style={styles.goalValueArea}>
            <Text style={styles.goalValue}>{goal}</Text>
            <Text style={styles.goalLabel}>sentiers ce mois</Text>
          </View>
          <Pressable
            style={[styles.goalButton, goal >= MAX_GOAL && styles.goalButtonDisabled]}
            onPress={onIncrement}
            disabled={goal >= MAX_GOAL}
            accessibilityLabel="Augmenter objectif mensuel"
            accessibilityRole="button"
          >
            <Ionicons
              name="add"
              size={20}
              color={goal >= MAX_GOAL ? COLORS.textMuted : COLORS.textPrimary}
            />
          </Pressable>
        </View>
        <View style={styles.goalProgressRow}>
          <View style={styles.goalBarBg}>
            <View
              style={[
                styles.goalBarFill,
                {
                  width: `${Math.round(pct)}%`,
                  backgroundColor: isCompleted ? COLORS.success : COLORS.primaryLight,
                },
              ]}
            />
          </View>
          <Text
            style={[
              styles.goalProgressText,
              isCompleted && { color: COLORS.success },
            ]}
          >
            {monthTrails}/{goal}
          </Text>
        </View>
        {isCompleted && (
          <View style={styles.goalCompletedRow}>
            <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
            <Text style={styles.goalCompletedText}>Objectif atteint</Text>
          </View>
        )}
      </View>
    </View>
  );
});

const ChallengeCard = React.memo(function ChallengeCard({
  challenge,
}: {
  challenge: CommunityChallenge;
}) {
  const progressWidth = `${Math.min(100, challenge.progressPercent)}%`;

  return (
    <View style={styles.challengeCard} accessibilityLabel={`Defi: ${challenge.title}, ${challenge.progressPercent}% complete`}>
      <View style={styles.challengeHeader}>
        <Ionicons name="people-circle-outline" size={22} color={COLORS.info} />
        <Text style={styles.challengeTitle} numberOfLines={1}>{challenge.title}</Text>
      </View>
      {challenge.description ? (
        <Text style={styles.challengeDescription} numberOfLines={2}>{challenge.description}</Text>
      ) : null}
      <View style={styles.challengeBarBg}>
        <View style={[styles.challengeBarFill, { width: progressWidth }]} />
      </View>
      <View style={styles.challengeStatsRow}>
        <Text style={styles.challengeProgress}>
          {challenge.current_km.toFixed(0)} / {challenge.target_km.toFixed(0)} km
        </Text>
        <Text style={styles.challengePercent}>{challenge.progressPercent}%</Text>
      </View>
    </View>
  );
});

const BadgesSection = React.memo(function BadgesSection({
  earnedIds,
}: {
  earnedIds: Set<string>;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>
        Badges ({earnedIds.size}/{BADGES.length})
      </Text>
      <View style={styles.badgesGrid}>
        {BADGES.map((badge) => (
          <BadgeItem
            key={badge.id}
            name={badge.name}
            icon={badge.icon}
            color={badge.color}
            earned={earnedIds.has(badge.id)}
            description={badge.description}
          />
        ))}
      </View>
    </View>
  );
});

export default function ProfileScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
  const { user, signOut } = useAuth();
  const {
    totalCompleted,
    totalTrails,
    overallProgress,
    zoneProgress,
    isLoading,
    loadProgress,
    currentStreak,
    bestStreak,
    totalXP,
    periodStats,
    regionsFullyCompleted,
    completionTimestamps,
  } = useProgressStore();

  const { avatarUrl, isUploading, pickAndUpload } = useAvatar(user?.id);

  // Monthly goal state
  const [monthlyGoal, setMonthlyGoal] = useState(DEFAULT_GOAL);

  useEffect(() => {
    if (user?.id) {
      loadProgress(user.id);
    }
  }, [user?.id, loadProgress]);

  // Load monthly goal from AsyncStorage
  useEffect(() => {
    AsyncStorage.getItem(GOAL_STORAGE_KEY).then((val) => {
      if (val) {
        const parsed = parseInt(val, 10);
        if (!isNaN(parsed) && parsed >= MIN_GOAL && parsed <= MAX_GOAL) {
          setMonthlyGoal(parsed);
        }
      }
    }).catch(() => {});
  }, []);

  const handleGoalIncrement = useCallback(() => {
    setMonthlyGoal((prev) => {
      const next = Math.min(prev + 1, MAX_GOAL);
      AsyncStorage.setItem(GOAL_STORAGE_KEY, String(next)).catch(() => {});
      return next;
    });
  }, []);

  const handleGoalDecrement = useCallback(() => {
    setMonthlyGoal((prev) => {
      const next = Math.max(prev - 1, MIN_GOAL);
      AsyncStorage.setItem(GOAL_STORAGE_KEY, String(next)).catch(() => {});
      return next;
    });
  }, []);

  const { challenges: communityChallenges } = useCommunityChallenge();
  const createPost = useCreatePost();

  const completedZones = zoneProgress.filter((z) => z.progress >= 1).length;
  const totalZones = zoneProgress.length;

  // Compute level
  const level = useMemo(() => getHikerLevel(totalCompleted), [totalCompleted]);

  // Build UserStats for badge evaluation
  const userStats: UserStats = useMemo(() => ({
    totalTrails: totalCompleted,
    totalKm: 0, // Filled from activities in a full implementation
    totalElevation: 0,
    zonesCompleted: completedZones,
    totalZones,
    regionsVisited: zoneProgress.filter((z) => z.completedTrails > 0).map((z) => z.zoneName),
    maxElevationTrail: 0,
    sorties_created: 0,
    reports_submitted: 0,
    regionsFullyCompleted: regionsFullyCompleted ?? [],
    completionTimestamps: completionTimestamps ?? [],
  }), [totalCompleted, completedZones, totalZones, zoneProgress, regionsFullyCompleted, completionTimestamps]);

  const earnedBadgeIds = useMemo(() => {
    const earned = getEarnedBadges(userStats);
    return new Set(earned.map((b) => b.id));
  }, [userStats]);

  const handleShareProgress = useCallback(() => {
    if (!user?.id) return;
    const pct = Math.round(overallProgress * 100);
    createPost.mutate({
      user_id: user.id,
      content: `[${level.name}] J'ai explore ${pct}% de La Reunion ! (${totalCompleted}/${totalTrails} sentiers)`,
      post_type: 'achievement',
      stats: { completed: totalCompleted, total: totalTrails, progress: pct, zones: completedZones, level: level.name },
      visibility: 'public',
    });
  }, [user?.id, overallProgress, totalCompleted, totalTrails, completedZones, level.name, createPost]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* User info + Level title */}
      <View style={styles.userSection}>
        <Pressable onPress={pickAndUpload} style={styles.avatarContainer} accessibilityLabel="Changer la photo de profil">
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatar}>
              <Ionicons name="person" size={32} color={COLORS.textPrimary} />
            </View>
          )}
          <View style={styles.avatarBadge}>
            {isUploading ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <Ionicons name="camera" size={14} color={COLORS.white} />
            )}
          </View>
        </Pressable>
        <Text style={styles.username}>
          {user?.user_metadata?.username ?? user?.email ?? 'Randonneur'}
        </Text>
        <Text style={[styles.levelTitle, { color: level.color }]} accessibilityLabel={`Niveau ${level.level}: ${level.name}`}>
          {level.name}
        </Text>
        <Text style={styles.email}>{user?.email}</Text>
      </View>

      {/* Level progress bar + Streak + XP row */}
      <View style={styles.gamificationRow}>
        <View style={styles.gamificationMain}>
          <LevelBar trailsCompleted={totalCompleted} />
        </View>
        <View style={styles.gamificationSide}>
          <StreakBadge currentStreak={currentStreak} bestStreak={bestStreak} />
          <XPDisplay totalXP={totalXP} />
        </View>
      </View>

      {/* Island progress map */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Ta carte de La Reunion</Text>
        {isLoading ? (
          <View style={styles.progressLoading}>
            <ActivityIndicator size="small" color={COLORS.primaryLight} />
            <Text style={styles.progressLoadingText}>Chargement de ta progression...</Text>
          </View>
        ) : (
          <IslandProgressMap height={250} />
        )}
      </View>

      {/* Stats grid */}
      <View style={styles.statsGrid}>
        <StatCard
          icon="trail-sign"
          value={`${totalCompleted}/${totalTrails}`}
          label="Sentiers"
          color={COLORS.primary}
        />
        <StatCard
          icon="map"
          value={`${completedZones}/${totalZones}`}
          label="Zones"
          color={COLORS.info}
        />
        <StatCard
          icon="trophy"
          value={`${Math.round(overallProgress * 100)}%`}
          label="Progression"
          color={COLORS.warm}
        />
      </View>

      {/* Weekly / Monthly stats */}
      <PeriodStats
        weekTrails={periodStats.weekTrails}
        weekKm={periodStats.weekKm}
        weekElevation={periodStats.weekElevation}
        monthTrails={periodStats.monthTrails}
        monthKm={periodStats.monthKm}
        monthElevation={periodStats.monthElevation}
      />

      {/* Monthly goal */}
      <MonthlyGoal
        goal={monthlyGoal}
        monthTrails={periodStats.monthTrails}
        onIncrement={handleGoalIncrement}
        onDecrement={handleGoalDecrement}
      />

      {/* Community challenges */}
      {communityChallenges.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Defis communautaires</Text>
          {communityChallenges.map((ch) => (
            <ChallengeCard key={ch.id} challenge={ch} />
          ))}
        </View>
      )}

      {/* Badges */}
      <BadgesSection earnedIds={earnedBadgeIds} />

      {/* Zone breakdown */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Progression par zone</Text>
        {zoneProgress
          .filter((z) => z.totalTrails > 0)
          .sort((a, b) => b.progress - a.progress)
          .map((zone) => (
            <View key={zone.zoneSlug} style={styles.zoneRow}>
              <View style={styles.zoneInfo}>
                <Text style={styles.zoneName}>{zone.zoneName}</Text>
                <Text style={styles.zoneCount}>
                  {zone.completedTrails}/{zone.totalTrails}
                </Text>
              </View>
              <View style={styles.progressBarBg}>
                <View
                  style={[
                    styles.progressBarFill,
                    { width: `${Math.round(zone.progress * 100)}%` },
                  ]}
                />
              </View>
            </View>
          ))}
      </View>

      {/* Share progress */}
      <Pressable
        style={styles.shareButton}
        onPress={handleShareProgress}
        disabled={createPost.isPending}
        accessibilityLabel="Partager ma progression"
      >
        <Ionicons name="share-social" size={18} color={COLORS.white} />
        <Text style={styles.shareText}>
          {createPost.isPending ? 'Publication...' : 'Partager ma progression'}
        </Text>
      </Pressable>

      {/* Mes randonnees */}
      <View style={styles.socialRow}>
        <Pressable
          style={styles.socialButtonLarge}
          onPress={() => navigation.navigate('MyHikes')}
          accessibilityLabel="Voir mes randonnees"
        >
          <View style={styles.socialIconCircle}>
            <Ionicons name="footsteps" size={24} color={COLORS.success} />
          </View>
          <View style={styles.socialButtonContent}>
            <Text style={styles.socialButtonTitle}>Mes randonnees</Text>
            <Text style={styles.socialButtonSubtitle}>Historique, traces et export GPX</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
        </Pressable>
      </View>

      {/* Mes defis */}
      <View style={styles.socialRow}>
        <Pressable
          style={styles.socialButtonLarge}
          onPress={() => navigation.navigate('Challenges')}
          accessibilityLabel="Voir mes defis"
        >
          <View style={styles.socialIconCircle}>
            <Ionicons name="ribbon" size={24} color={COLORS.warm} />
          </View>
          <View style={styles.socialButtonContent}>
            <Text style={styles.socialButtonTitle}>Mes defis</Text>
            <Text style={styles.socialButtonSubtitle}>8 defis thematiques a completer</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
        </Pressable>
      </View>

      {/* Social buttons */}
      <View style={styles.socialRow}>
        <Pressable
          style={styles.socialButtonLarge}
          onPress={() => navigation.navigate('Feed')}
          accessibilityLabel="Voir le feed communaute"
        >
          <View style={styles.socialIconCircle}>
            <Ionicons name="newspaper" size={24} color={COLORS.primaryLight} />
          </View>
          <View style={styles.socialButtonContent}>
            <Text style={styles.socialButtonTitle}>Communaute</Text>
            <Text style={styles.socialButtonSubtitle}>Posts, likes et partages</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
        </Pressable>
        <Pressable
          style={styles.socialButtonLarge}
          onPress={() => navigation.navigate('Friends')}
          accessibilityLabel="Voir mes amis"
        >
          <View style={styles.socialIconCircle}>
            <Ionicons name="people" size={24} color={COLORS.info} />
          </View>
          <View style={styles.socialButtonContent}>
            <Text style={styles.socialButtonTitle}>Mes amis</Text>
            <Text style={styles.socialButtonSubtitle}>Demandes et recherche</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
        </Pressable>
      </View>

      {/* Settings */}
      <Pressable
        style={styles.settingsButton}
        onPress={() => navigation.navigate('Settings')}
        accessibilityLabel="Parametres"
      >
        <Ionicons name="settings-outline" size={18} color={COLORS.textSecondary} />
        <Text style={styles.settingsText}>Parametres</Text>
        <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
      </Pressable>

      {/* Sign out */}
      <Pressable style={styles.signOutButton} onPress={signOut} accessibilityLabel="Se deconnecter">
        <Ionicons name="log-out-outline" size={18} color={COLORS.danger} />
        <Text style={styles.signOutText}>Se deconnecter</Text>
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
    paddingBottom: SPACING.xxl,
  },
  userSection: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  avatarContainer: {
    marginBottom: SPACING.sm,
    position: 'relative',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.background,
  },
  username: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  levelTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
    marginTop: SPACING.xs,
  },
  email: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textMuted,
    marginTop: SPACING.xs,
  },

  // Gamification row (level + streak + XP)
  gamificationRow: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    gap: SPACING.md,
    marginTop: SPACING.sm,
  },
  gamificationMain: {
    flex: 1,
  },
  gamificationSide: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
  },

  // Level bar
  levelContainer: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
  },
  levelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  levelBadgeCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  levelNumber: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '800',
  },
  levelInfo: {
    flex: 1,
  },
  levelName: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
  },
  levelSubtitle: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  levelBarBg: {
    height: 8,
    backgroundColor: COLORS.border,
    borderRadius: BORDER_RADIUS.full,
    overflow: 'hidden',
  },
  levelBarFill: {
    height: '100%',
    borderRadius: BORDER_RADIUS.full,
  },

  // Streak
  streakContainer: {
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    minWidth: 72,
  },
  streakIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  streakTextContainer: {
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  streakNumber: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '800',
  },
  streakLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
  },
  streakBest: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
    marginTop: 2,
  },

  // XP
  xpContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    minWidth: 72,
    justifyContent: 'center',
  },
  xpValue: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '800',
    color: COLORS.warm,
  },
  xpLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
  },

  // Period stats
  periodContainer: {
    paddingHorizontal: SPACING.md,
    marginTop: SPACING.lg,
  },
  periodRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
  },
  periodColumn: {
    flex: 1,
    alignItems: 'center',
  },
  periodDivider: {
    width: 1,
    backgroundColor: COLORS.border,
    marginHorizontal: SPACING.sm,
  },
  periodHeader: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: SPACING.xs,
  },
  periodValue: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  periodDetail: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },

  // Badges
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  badgeItem: {
    width: 72,
    alignItems: 'center',
    gap: SPACING.xs,
  },
  badgeIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeName: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
    textAlign: 'center',
  },

  // Existing styles
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
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: SPACING.md,
    marginTop: SPACING.lg,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginHorizontal: SPACING.xs,
    gap: SPACING.xs,
  },
  statValue: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  statLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
  },
  progressLoading: {
    height: 250,
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
  },
  progressLoadingText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textMuted,
  },
  zoneRow: {
    marginBottom: SPACING.md,
  },
  zoneInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  zoneName: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textPrimary,
  },
  zoneCount: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: COLORS.border,
    borderRadius: BORDER_RADIUS.full,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.full,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.lg,
    marginHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.xl,
    backgroundColor: COLORS.primary,
  },
  shareText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
    color: COLORS.white,
  },
  socialRow: {
    marginTop: SPACING.lg,
    marginHorizontal: SPACING.md,
    gap: SPACING.sm,
  },
  socialButtonLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  socialIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  socialButtonContent: {
    flex: 1,
  },
  socialButtonTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  socialButtonSubtitle: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  settingsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.xl,
    marginHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.card,
  },
  settingsText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textPrimary,
    flex: 1,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.xl,
    marginHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.danger + '40',
  },
  signOutText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.danger,
    fontWeight: '600',
  },

  // Community challenges
  challengeCard: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  challengeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  challengeTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
    color: COLORS.textPrimary,
    flex: 1,
  },
  challengeDescription: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  challengeBarBg: {
    height: 8,
    backgroundColor: COLORS.border,
    borderRadius: BORDER_RADIUS.full,
    overflow: 'hidden',
  },
  challengeBarFill: {
    height: '100%',
    backgroundColor: COLORS.info,
    borderRadius: BORDER_RADIUS.full,
  },
  challengeStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.xs,
  },
  challengeProgress: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  challengePercent: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.info,
    fontWeight: '700',
  },

  // Monthly goal
  goalContainer: {
    paddingHorizontal: SPACING.md,
    marginTop: SPACING.lg,
  },
  goalCard: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
  },
  goalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.lg,
    marginBottom: SPACING.md,
  },
  goalButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  goalButtonDisabled: {
    opacity: 0.4,
  },
  goalValueArea: {
    alignItems: 'center',
    minWidth: 120,
  },
  goalValue: {
    fontSize: FONT_SIZE.xxxl,
    fontWeight: '800',
    color: COLORS.primaryLight,
  },
  goalLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  goalProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  goalBarBg: {
    flex: 1,
    height: 8,
    backgroundColor: COLORS.border,
    borderRadius: BORDER_RADIUS.full,
    overflow: 'hidden',
  },
  goalBarFill: {
    height: '100%',
    borderRadius: BORDER_RADIUS.full,
  },
  goalProgressText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    color: COLORS.textSecondary,
    minWidth: 36,
    textAlign: 'right',
  },
  goalCompletedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    marginTop: SPACING.sm,
  },
  goalCompletedText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    color: COLORS.success,
  },
});
