import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  FlatList,
  Pressable,
  ActivityIndicator,
  SectionList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { COLORS, FONT_SIZE, SPACING, BORDER_RADIUS } from '@/constants';
import { useSupabaseTrails } from '@/hooks/useSupabaseTrails';
import { supabase } from '@/lib/supabase';
import type { ProfileStackParamList } from '@/navigation/types';

type SearchNavProp = NativeStackNavigationProp<ProfileStackParamList>;

interface UserResult {
  id: string;
  username: string | null;
  avatar_url: string | null;
}

interface SectionData {
  title: string;
  data: Array<TrailResult | UserResult>;
}

interface TrailResult {
  slug: string;
  name: string;
  difficulty: string;
  region: string;
  distance_km: number;
}

function isTrailResult(item: TrailResult | UserResult): item is TrailResult {
  return 'slug' in item;
}

const TrailResultItem = React.memo(function TrailResultItem({
  item,
  onPress,
}: {
  item: TrailResult;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={styles.resultItem}
      onPress={onPress}
      accessibilityLabel={`Sentier ${item.name}`}
      accessibilityRole="button"
    >
      <View style={styles.resultIconCircle}>
        <Ionicons name="trail-sign" size={20} color={COLORS.primaryLight} />
      </View>
      <View style={styles.resultContent}>
        <Text style={styles.resultTitle} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.resultSubtitle} numberOfLines={1}>
          {item.region} - {item.distance_km} km
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
    </Pressable>
  );
});

const UserResultItem = React.memo(function UserResultItem({
  item,
  onPress,
}: {
  item: UserResult;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={styles.resultItem}
      onPress={onPress}
      accessibilityLabel={`Profil de ${item.username ?? 'utilisateur'}`}
      accessibilityRole="button"
    >
      <View style={styles.resultIconCircle}>
        <Ionicons name="person" size={20} color={COLORS.info} />
      </View>
      <View style={styles.resultContent}>
        <Text style={styles.resultTitle} numberOfLines={1}>
          {item.username ?? 'Utilisateur'}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
    </Pressable>
  );
});

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

export default function SearchScreen() {
  const navigation = useNavigation<SearchNavProp>();
  const inputRef = useRef<TextInput>(null);
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query.trim(), 300);
  const [users, setUsers] = useState<UserResult[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);

  const { trails, isLoading: trailsLoading } = useSupabaseTrails();

  // Auto-focus on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Filter trails locally
  const filteredTrails: TrailResult[] = useMemo(() => {
    if (!debouncedQuery || debouncedQuery.length < 2) return [];
    const lower = debouncedQuery.toLowerCase();
    return trails
      .filter(
        (t) =>
          t.name.toLowerCase().includes(lower) ||
          t.region.toLowerCase().includes(lower),
      )
      .slice(0, 10)
      .map((t) => ({
        slug: t.slug,
        name: t.name,
        difficulty: t.difficulty,
        region: t.region,
        distance_km: t.distance_km,
      }));
  }, [trails, debouncedQuery]);

  // Search users from Supabase
  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.length < 2) {
      setUsers([]);
      return;
    }

    let cancelled = false;
    setUsersLoading(true);

    supabase
      .from('user_profiles')
      .select('id, username, avatar_url')
      .ilike('username', `%${debouncedQuery}%`)
      .limit(10)
      .then(({ data, error }) => {
        if (cancelled) return;
        setUsersLoading(false);
        if (error) {
          setUsers([]);
          return;
        }
        setUsers(
          (data ?? []).map((u: Record<string, unknown>) => ({
            id: u.id as string,
            username: u.username as string | null,
            avatar_url: u.avatar_url as string | null,
          })),
        );
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedQuery]);

  const handleTrailPress = useCallback(
    (trail: TrailResult) => {
      // Navigate to TrailDetail via the parent navigator
      navigation
        .getParent()
        ?.navigate('TrailsTab', {
          screen: 'TrailDetail',
          params: { trailId: trail.slug, trailName: trail.name },
        });
    },
    [navigation],
  );

  const handleUserPress = useCallback(
    (user: UserResult) => {
      navigation.navigate('UserProfile', {
        userId: user.id,
        username: user.username ?? undefined,
      });
    },
    [navigation],
  );

  const sections: SectionData[] = useMemo(() => {
    const result: SectionData[] = [];
    if (filteredTrails.length > 0) {
      result.push({ title: 'Sentiers', data: filteredTrails });
    }
    if (users.length > 0) {
      result.push({ title: 'Utilisateurs', data: users });
    }
    return result;
  }, [filteredTrails, users]);

  const isSearching = trailsLoading || usersLoading;
  const hasQuery = debouncedQuery.length >= 2;
  const noResults = hasQuery && !isSearching && sections.length === 0;

  const renderItem = useCallback(
    ({ item }: { item: TrailResult | UserResult }) => {
      if (isTrailResult(item)) {
        return (
          <TrailResultItem
            item={item}
            onPress={() => handleTrailPress(item)}
          />
        );
      }
      return (
        <UserResultItem
          item={item}
          onPress={() => handleUserPress(item)}
        />
      );
    },
    [handleTrailPress, handleUserPress],
  );

  const renderSectionHeader = useCallback(
    ({ section }: { section: SectionData }) => (
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{section.title}</Text>
      </View>
    ),
    [],
  );

  const keyExtractor = useCallback(
    (item: TrailResult | UserResult, index: number) =>
      isTrailResult(item) ? `trail-${item.slug}` : `user-${item.id}`,
    [],
  );

  return (
    <View style={styles.container}>
      {/* Search bar */}
      <View style={styles.searchBarContainer}>
        <Ionicons name="search" size={20} color={COLORS.textMuted} />
        <TextInput
          ref={inputRef}
          style={styles.searchInput}
          placeholder="Rechercher un sentier ou un utilisateur..."
          placeholderTextColor={COLORS.textMuted}
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          accessibilityLabel="Barre de recherche"
        />
        {query.length > 0 && (
          <Pressable
            onPress={() => setQuery('')}
            style={styles.clearButton}
            accessibilityLabel="Effacer la recherche"
            accessibilityRole="button"
          >
            <Ionicons name="close-circle" size={20} color={COLORS.textMuted} />
          </Pressable>
        )}
      </View>

      {/* Loading indicator */}
      {isSearching && hasQuery && (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color={COLORS.primaryLight} />
          <Text style={styles.loadingText}>Recherche en cours...</Text>
        </View>
      )}

      {/* No results */}
      {noResults && (
        <View style={styles.emptyContainer}>
          <Ionicons name="search-outline" size={48} color={COLORS.textMuted} />
          <Text style={styles.emptyText}>Aucun resultat</Text>
          <Text style={styles.emptySubtext}>
            Essaie avec un autre terme de recherche.
          </Text>
        </View>
      )}

      {/* Hint when no query */}
      {!hasQuery && !isSearching && (
        <View style={styles.emptyContainer}>
          <Ionicons name="compass-outline" size={48} color={COLORS.textMuted} />
          <Text style={styles.emptyText}>Explore La Reunion</Text>
          <Text style={styles.emptySubtext}>
            Tape au moins 2 caracteres pour rechercher un sentier ou un
            randonneur.
          </Text>
        </View>
      )}

      {/* Results */}
      {sections.length > 0 && (
        <SectionList
          sections={sections}
          renderItem={renderItem}
          renderSectionHeader={renderSectionHeader}
          keyExtractor={keyExtractor}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          stickySectionHeadersEnabled={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: SPACING.md,
    marginTop: SPACING.sm,
    marginBottom: SPACING.sm,
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    minHeight: SPACING.xxl,
    gap: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: FONT_SIZE.md,
    color: COLORS.textPrimary,
    paddingVertical: SPACING.sm,
  },
  clearButton: {
    width: SPACING.xxl,
    height: SPACING.xxl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
  },
  loadingText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textMuted,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.xl,
  },
  emptyText: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  emptySubtext: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  sectionHeader: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xs,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  listContent: {
    paddingBottom: SPACING.xxl,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    minHeight: SPACING.xxl,
  },
  resultIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultContent: {
    flex: 1,
  },
  resultTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  resultSubtitle: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
});
