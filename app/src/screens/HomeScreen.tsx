import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { COLORS, FONT_SIZE, SPACING, BORDER_RADIUS } from '@/constants';
import { useAuthStore } from '@/stores/authStore';
import { useProgressStore } from '@/stores/progressStore';
import { useWeather } from '@/hooks/useWeather';
import { useFeed, type Post } from '@/hooks/useFeed';
import { useSupabaseTrails } from '@/hooks/useSupabaseTrails';
import GradientHeader from '@/components/GradientHeader';
import type { Trail, Difficulty } from '@/types';
import type { RootTabParamList } from '@/navigation/types';
import type { UserLevel } from './OnboardingScreen';

const USER_LEVEL_KEY = '@rando_user_level';

// Centre de La Reunion pour la meteo par defaut
const REUNION_CENTER = { lat: -21.115, lng: 55.536 };

// Mapping niveau utilisateur vers difficultes acceptees
const LEVEL_DIFFICULTIES: Record<UserLevel, Difficulty[]> = {
  debutant: ['facile'],
  confirme: ['facile', 'moyen'],
  expert: ['facile', 'moyen', 'difficile', 'expert'],
};

type HomeNavProp = BottomTabNavigationProp<RootTabParamList>;

function pickSuggestion(
  trails: Array<Omit<Trail, 'id' | 'created_at' | 'updated_at'>>,
  completedSlugs: string[],
  userLevel: UserLevel,
  isRainy: boolean,
): Omit<Trail, 'id' | 'created_at' | 'updated_at'> | null {
  if (trails.length === 0) return null;

  const completedSet = new Set(completedSlugs);
  const allowedDifficulties = LEVEL_DIFFICULTIES[userLevel];

  // Filter: not completed + matching difficulty
  let candidates = trails.filter(
    (t) =>
      !completedSet.has(t.slug) &&
      allowedDifficulties.includes(t.difficulty),
  );

  // Weather-based filtering
  if (isRainy) {
    // Prefer short trails when rainy
    const shortTrails = candidates.filter((t) => t.duration_min <= 120);
    if (shortTrails.length > 0) candidates = shortTrails;
  } else {
    // Good weather: prefer trails with elevation
    const highTrails = candidates.filter((t) => t.elevation_gain_m >= 500);
    if (highTrails.length > 0) candidates = highTrails;
  }

  // If no candidates after filtering, fallback to all uncompleted trails
  if (candidates.length === 0) {
    candidates = trails.filter((t) => !completedSet.has(t.slug));
  }

  // If still nothing, pick from all trails
  if (candidates.length === 0) {
    candidates = trails;
  }

  // Pick a random trail (seeded by day so it stays stable)
  const today = new Date();
  const daySeed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
  const index = daySeed % candidates.length;
  return candidates[index];
}

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h}h`;
  return `${h}h${String(m).padStart(2, '0')}`;
}

function difficultyLabel(d: Difficulty): string {
  const map: Record<Difficulty, string> = {
    facile: 'Facile',
    moyen: 'Moyen',
    difficile: 'Difficile',
    expert: 'Expert',
  };
  return map[d];
}

function difficultyColor(d: Difficulty): string {
  const map: Record<Difficulty, string> = {
    facile: COLORS.easy,
    moyen: COLORS.medium,
    difficile: COLORS.hard,
    expert: COLORS.expert,
  };
  return map[d];
}

const SuggestionCard = React.memo(function SuggestionCard({
  trail,
  weatherDesc,
  onPress,
}: {
  trail: Omit<Trail, 'id' | 'created_at' | 'updated_at'>;
  weatherDesc: string;
  onPress: () => void;
}) {
  return (
    <View style={styles.suggestionCard}>
      <Text style={styles.sectionLabel}>PARFAIT POUR AUJOURD'HUI</Text>
      <Text style={styles.trailName}>{trail.name}</Text>
      <View style={styles.trailMeta}>
        <View style={[styles.diffBadge, { backgroundColor: difficultyColor(trail.difficulty) + '20' }]}>
          <Text style={[styles.diffBadgeText, { color: difficultyColor(trail.difficulty) }]}>
            {difficultyLabel(trail.difficulty)}
          </Text>
        </View>
        <Text style={styles.metaText}>{formatDuration(trail.duration_min)}</Text>
        <Text style={styles.metaDot}>-</Text>
        <Text style={styles.metaText}>{trail.distance_km} km</Text>
      </View>
      {weatherDesc ? (
        <View style={styles.reasonRow}>
          <Ionicons name="partly-sunny" size={16} color={COLORS.textSecondary} />
          <Text style={styles.reasonText}>{weatherDesc}</Text>
        </View>
      ) : null}
      <View style={styles.reasonRow}>
        <Ionicons name="checkmark-circle-outline" size={16} color={COLORS.textSecondary} />
        <Text style={styles.reasonText}>Adapte a ton niveau</Text>
      </View>
      <Pressable
        style={styles.seeTrailButton}
        onPress={onPress}
        accessibilityLabel={`Voir le sentier ${trail.name}`}
        accessibilityRole="button"
      >
        <Text style={styles.seeTrailText}>Voir le sentier</Text>
        <Ionicons name="arrow-forward" size={18} color={COLORS.white} />
      </Pressable>
    </View>
  );
});

const StatsCard = React.memo(function StatsCard({
  totalCompleted,
  weekKm,
  currentStreak,
}: {
  totalCompleted: number;
  weekKm: number;
  currentStreak: number;
}) {
  return (
    <View style={styles.statsCard}>
      <Text style={styles.sectionLabel}>STATS RAPIDES</Text>
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{totalCompleted}</Text>
          <Text style={styles.statLabel}>sentiers</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{weekKm}</Text>
          <Text style={styles.statLabel}>km cette semaine</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{currentStreak}</Text>
          <Text style={styles.statLabel}>
            {currentStreak <= 1 ? 'semaine' : 'semaines'}
          </Text>
        </View>
      </View>
    </View>
  );
});

const ChallengesCard = React.memo(function ChallengesCard() {
  return (
    <View style={styles.challengesCard}>
      <Text style={styles.sectionLabel}>DEFIS EN COURS</Text>
      <View style={styles.comingSoon}>
        <Ionicons name="trophy-outline" size={32} color={COLORS.textMuted} />
        <Text style={styles.comingSoonText}>Bientot disponible</Text>
        <Text style={styles.comingSoonSub}>
          Des defis thematiques pour explorer La Reunion autrement.
        </Text>
      </View>
    </View>
  );
});

const FriendActivityCard = React.memo(function FriendActivityCard({
  post,
}: {
  post: Post | null;
}) {
  if (!post) {
    return (
      <View style={styles.friendCard}>
        <Text style={styles.sectionLabel}>ACTIVITE AMIS</Text>
        <Text style={styles.noActivityText}>
          Aucune activite recente. Ajoute des amis pour voir leur progression.
        </Text>
      </View>
    );
  }

  const username = post.user?.username ?? 'Randonneur';
  const trailName = post.trail?.name;
  const content = post.content;

  return (
    <View style={styles.friendCard}>
      <Text style={styles.sectionLabel}>ACTIVITE AMIS</Text>
      <View style={styles.friendPostRow}>
        <Ionicons name="person-circle" size={32} color={COLORS.textMuted} />
        <View style={styles.friendPostContent}>
          <Text style={styles.friendUsername}>{username}</Text>
          {trailName ? (
            <Text style={styles.friendPostText} numberOfLines={2}>
              {content ?? `A fait le sentier ${trailName}`}
            </Text>
          ) : (
            <Text style={styles.friendPostText} numberOfLines={2}>
              {content ?? 'A partage une activite'}
            </Text>
          )}
        </View>
        {post.like_count != null && post.like_count > 0 && (
          <View style={styles.likesBadge}>
            <Ionicons name="heart" size={14} color={COLORS.danger} />
            <Text style={styles.likesCount}>{post.like_count}</Text>
          </View>
        )}
      </View>
    </View>
  );
});

function HomeScreen(): React.JSX.Element {
  const navigation = useNavigation<HomeNavProp>();
  const user = useAuthStore((s) => s.user);
  const {
    totalCompleted,
    completedTrailSlugs,
    currentStreak,
    periodStats,
  } = useProgressStore();

  const [userLevel, setUserLevel] = useState<UserLevel>('confirme');
  const [refreshing, setRefreshing] = useState(false);

  // Load user level from AsyncStorage
  useEffect(() => {
    AsyncStorage.getItem(USER_LEVEL_KEY)
      .then((stored) => {
        if (stored === 'debutant' || stored === 'confirme' || stored === 'expert') {
          setUserLevel(stored);
        }
      })
      .catch(() => {});
  }, []);

  // Load progress if user logged in
  useEffect(() => {
    if (user?.id) {
      useProgressStore.getState().loadProgress(user.id);
    }
  }, [user?.id]);

  // Weather for La Reunion center
  const { data: weatherData } = useWeather(REUNION_CENTER.lat, REUNION_CENTER.lng);
  const todayForecast = weatherData?.forecasts?.[0] ?? null;
  const isRainy = (todayForecast?.precipitation_mm ?? 0) > 5;
  const weatherDesc = todayForecast?.description ?? '';

  // Trails
  const { data: trails, isLoading: trailsLoading, refetch: refetchTrails } = useSupabaseTrails();

  // Feed (friends)
  const { data: feedPosts, refetch: refetchFeed } = useFeed('friends');
  const latestPost = feedPosts && feedPosts.length > 0 ? feedPosts[0] : null;

  // Username
  const username = useMemo(() => {
    return user?.user_metadata?.username ?? user?.email?.split('@')[0] ?? 'Randonneur';
  }, [user?.user_metadata?.username, user?.email]);

  // Suggestion
  const suggestedTrail = useMemo(() => {
    if (!trails || trails.length === 0) return null;
    return pickSuggestion(trails, completedTrailSlugs, userLevel, isRainy);
  }, [trails, completedTrailSlugs, userLevel, isRainy]);

  const handleSeeTrail = useCallback(() => {
    if (!suggestedTrail) return;
    navigation.navigate('TrailsTab', {
      screen: 'TrailDetail',
      params: { trailId: suggestedTrail.slug, trailName: suggestedTrail.name },
    });
  }, [navigation, suggestedTrail]);

  const handleSeeMap = useCallback(() => {
    navigation.navigate('MapTab');
  }, [navigation]);

  const handleSearch = useCallback(() => {
    navigation.navigate('ProfileTab', { screen: 'Search' });
  }, [navigation]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    const promises: Promise<unknown>[] = [refetchTrails(), refetchFeed()];
    if (user?.id) {
      promises.push(useProgressStore.getState().loadProgress(user.id));
    }
    await Promise.all(promises);
    setRefreshing(false);
  }, [refetchTrails, refetchFeed, user?.id]);

  if (trailsLoading && !trails) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primaryLight} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <GradientHeader />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primaryLight}
            colors={[COLORS.primaryLight]}
          />
        }
      >
      {/* Greeting + Search */}
      <View style={styles.greetingRow}>
        <Text style={styles.greeting}>Bonjour {username} !</Text>
        <Pressable
          style={styles.searchButton}
          onPress={handleSearch}
          accessibilityLabel="Rechercher un sentier ou un utilisateur"
          accessibilityRole="button"
        >
          <Ionicons name="search" size={22} color={COLORS.textPrimary} />
        </Pressable>
      </View>

      {/* Suggestion */}
      {suggestedTrail && (
        <SuggestionCard
          trail={suggestedTrail}
          weatherDesc={weatherDesc}
          onPress={handleSeeTrail}
        />
      )}

      {/* Stats */}
      <StatsCard
        totalCompleted={totalCompleted}
        weekKm={periodStats.weekKm}
        currentStreak={currentStreak}
      />

      {/* Challenges */}
      <ChallengesCard />

      {/* Friend activity */}
      <FriendActivityCard post={latestPost} />

      {/* Map button */}
      <Pressable
        style={styles.mapButton}
        onPress={handleSeeMap}
        accessibilityLabel="Voir la carte des sentiers"
        accessibilityRole="button"
      >
        <Ionicons name="map-outline" size={20} color={COLORS.white} />
        <Text style={styles.mapButtonText}>Voir la carte</Text>
      </Pressable>
    </ScrollView>
    </View>
  );
}

export default React.memo(HomeScreen);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xxl,
    paddingBottom: SPACING.xxl,
    gap: SPACING.lg,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  greeting: {
    fontSize: FONT_SIZE.xxxl,
    fontWeight: '700',
    color: COLORS.textPrimary,
    flex: 1,
  },
  searchButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Suggestion card
  suggestionCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    gap: SPACING.sm,
  },
  sectionLabel: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 1,
    marginBottom: SPACING.xs,
  },
  trailName: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  trailMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  diffBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  diffBadgeText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },
  metaText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
  },
  metaDot: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textMuted,
  },
  reasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  reasonText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
  },
  seeTrailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
    minHeight: 48,
    marginTop: SPACING.sm,
  },
  seeTrailText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.white,
  },
  // Stats card
  statsCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: '700',
    color: COLORS.primaryLight,
  },
  statLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: COLORS.border,
  },
  // Challenges card
  challengesCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
  },
  comingSoon: {
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
  },
  comingSoonText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  comingSoonSub: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  // Friend activity
  friendCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
  },
  noActivityText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textMuted,
  },
  friendPostRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  friendPostContent: {
    flex: 1,
  },
  friendUsername: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  friendPostText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  likesBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  likesCount: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
  },
  // Map button
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: BORDER_RADIUS.xl,
    paddingVertical: SPACING.md,
    minHeight: 48,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  mapButtonText: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    color: COLORS.white,
  },
});
