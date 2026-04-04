import React, { useEffect, useMemo, useCallback, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable, Image, ActivityIndicator, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { COLORS, SPACING, BORDER_RADIUS } from '@/constants';
import GradientHeader from '@/components/GradientHeader';
import { useAuth } from '@/hooks/useAuth';
import { useFriendRequests } from '@/hooks/useFriends';
import { useProgressStore } from '@/stores/progressStore';
import { useAvatar } from '@/hooks/useAvatar';
import { useCreatePost } from '@/hooks/useFeed';
import IslandProgressMap from '@/components/IslandProgressMap';
import Skeleton from '@/components/Skeleton';
import { useCommunityChallenge } from '@/hooks/useCommunityChallenge';
import StatCard from '@/components/StatCard';
import LevelBar from '@/components/LevelBar';
import StreakBadge from '@/components/StreakBadge';
import XPDisplay from '@/components/XPDisplay';
import PeriodStats from '@/components/PeriodStats';
import BadgeMedal from '@/components/BadgeMedal';
import ZoneProgressRing from '@/components/ZoneProgressRing';
import MonthlyGoal from '@/components/MonthlyGoal';
import ChallengeCard from '@/components/ChallengeCard';
import BadgesSection from '@/components/BadgesSection';
import {
  getHikerLevel,
  getEarnedBadges,
  type UserStats,
} from '@/lib/badges';
import type { ProfileStackParamList } from '@/navigation/types';

const GOAL_STORAGE_KEY = '@rando_monthly_goal';
const DEFAULT_GOAL = 5;
const MIN_GOAL = 1;
const MAX_GOAL = 30;

export default function ProfileScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
  const { user, signOut } = useAuth();
  const { data: pendingRequests = [] } = useFriendRequests(user?.id);
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
    createPost.mutate(
      {
        user_id: user.id,
        content: `[${level.name}] J'ai explore ${pct}% de La Reunion ! (${totalCompleted}/${totalTrails} sentiers)`,
        post_type: 'achievement',
        stats: { completed: totalCompleted, total: totalTrails, progress: pct, zones: completedZones, level: level.name },
        visibility: 'public',
      },
      {
        onError: () => Alert.alert('Erreur', 'Impossible de partager ta progression.'),
      },
    );
  }, [user?.id, overallProgress, totalCompleted, totalTrails, completedZones, level.name, createPost]);

  return (
    <View style={styles.container}>
      <GradientHeader />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
      {/* User info + Level title */}
      <View style={styles.userSection}>
        <Pressable onPress={pickAndUpload} style={styles.avatarContainer} accessibilityLabel="Changer la photo de profil">
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatar}>
              <Ionicons name="person-circle-outline" size={40} color={COLORS.textMuted} />
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
            <Skeleton width="100%" height={200} borderRadius={BORDER_RADIUS.lg} />
          </View>
        ) : (
          <IslandProgressMap height={280} interactive />
        )}
      </View>

      {/* Stats grid */}
      <View style={styles.statsGrid}>
        <StatCard
          icon="trail-sign"
          value={`${totalCompleted}/${totalTrails}`}
          label="Sentiers"
          color={COLORS.primary}
          animateNumeric={totalCompleted}
        />
        <StatCard
          icon="map"
          value={`${completedZones}/${totalZones}`}
          label="Zones"
          color={COLORS.info}
          animateNumeric={completedZones}
        />
        <StatCard
          icon="trophy"
          value={`${Math.round(overallProgress * 100)}%`}
          label="Progression"
          color={COLORS.warm}
          animateNumeric={Math.round(overallProgress * 100)}
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

      {/* Zone breakdown — circular progress rings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Progression par zone</Text>
        <View style={styles.zoneRingsGrid}>
          {zoneProgress
            .filter((z) => z.totalTrails > 0)
            .sort((a, b) => b.progress - a.progress)
            .map((zone) => (
              <ZoneProgressRing
                key={zone.zoneSlug}
                zoneName={zone.zoneName}
                completed={zone.completedTrails}
                total={zone.totalTrails}
                progress={zone.progress}
              />
            ))}
        </View>
      </View>

      {/* Share progress */}
      <Pressable
        style={[styles.shareButton, createPost.isPending && { opacity: 0.5 }]}
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
          {pendingRequests.length > 0 && (
            <View style={styles.notifBadge}>
              <Text style={styles.notifBadgeText}>{pendingRequests.length}</Text>
            </View>
          )}
          <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
        </Pressable>
        <Pressable
          style={styles.socialButtonLarge}
          onPress={() => navigation.navigate('Inbox')}
          accessibilityLabel="Voir mes messages"
        >
          <View style={styles.socialIconCircle}>
            <Ionicons name="chatbubbles" size={24} color={COLORS.primaryLight} />
          </View>
          <View style={styles.socialButtonContent}>
            <Text style={styles.socialButtonTitle}>Messages</Text>
            <Text style={styles.socialButtonSubtitle}>Discussions privees</Text>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
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
    fontSize: SPACING.xl,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  levelTitle: {
    fontSize: SPACING.md,
    fontWeight: '700',
    marginTop: SPACING.xs,
  },
  email: {
    fontSize: SPACING.sm,
    color: COLORS.textMuted,
    marginTop: SPACING.xs,
  },
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
  section: {
    paddingHorizontal: SPACING.md,
    marginTop: SPACING.lg,
  },
  sectionTitle: {
    fontSize: SPACING.lg,
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
  progressLoading: {
    height: 250,
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
  },
  zoneRingsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    gap: SPACING.md,
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
    fontSize: SPACING.md,
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
    fontSize: SPACING.lg,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  socialButtonSubtitle: {
    fontSize: SPACING.xs,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  notifBadge: {
    backgroundColor: COLORS.danger,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
    marginRight: SPACING.xs,
  },
  notifBadgeText: {
    color: COLORS.white,
    fontSize: SPACING.xs,
    fontWeight: '700',
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
    fontSize: SPACING.md,
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
    fontSize: SPACING.md,
    color: COLORS.danger,
    fontWeight: '600',
  },
});
