import React, { useCallback, useState, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { COLORS, FONT_SIZE, SPACING, BORDER_RADIUS } from '@/constants';
import { useAllSorties, useFriendsSorties, useMyUpcomingSorties } from '@/hooks/useAllSorties';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/lib/supabase';
import type { SortiesStackParamList } from '@/navigation/types';
import type { Sortie } from '@/types';

type FilterTab = 'toutes' | 'mes-sorties' | 'amis';

const TABS: { key: FilterTab; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'toutes', label: 'Toutes', icon: 'globe-outline' },
  { key: 'mes-sorties', label: 'Mes sorties', icon: 'person-outline' },
  { key: 'amis', label: 'Amis', icon: 'people-outline' },
];

/** Count pending participants for all sorties the user organises */
function usePendingCounts(userId: string | undefined) {
  return useQuery({
    queryKey: ['sorties', 'pending-counts', userId],
    queryFn: async () => {
      if (!userId) return {};
      const { data, error } = await supabase
        .from('sortie_participants')
        .select('sortie_id, sorties!sortie_id(organisateur_id)')
        .eq('statut', 'en_attente');
      if (error) throw error;
      const counts: Record<string, number> = {};
      for (const row of data ?? []) {
        const sortie = row.sorties as unknown as { organisateur_id: string } | null;
        if (sortie?.organisateur_id === userId) {
          counts[row.sortie_id] = (counts[row.sortie_id] ?? 0) + 1;
        }
      }
      return counts;
    },
    enabled: !!userId,
    staleTime: 30 * 1000,
  });
}

export default function SortiesScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<SortiesStackParamList>>();
  const userId = useAuthStore((s) => s.user?.id);
  const [activeTab, setActiveTab] = useState<FilterTab>('toutes');

  const { data: allSorties, isLoading: allLoading, error: allError } = useAllSorties();
  const { data: mySorties, isLoading: myLoading } = useMyUpcomingSorties(userId);
  const { data: friendsSorties, isLoading: friendsLoading } = useFriendsSorties(userId);
  const { data: pendingCounts = {} } = usePendingCounts(userId);

  const currentData = useMemo(() => {
    switch (activeTab) {
      case 'toutes':
        return allSorties ?? [];
      case 'mes-sorties':
        return mySorties ?? [];
      case 'amis':
        return friendsSorties ?? [];
      default:
        return [];
    }
  }, [activeTab, allSorties, mySorties, friendsSorties]);

  const isLoading = activeTab === 'toutes' ? allLoading : activeTab === 'mes-sorties' ? myLoading : friendsLoading;

  const handlePress = useCallback(
    (sortie: Sortie) => {
      navigation.navigate('SortieDetailFromSorties', { sortie });
    },
    [navigation],
  );

  const renderItem = useCallback(
    ({ item }: { item: Sortie }) => (
      <SortieCard
        sortie={item}
        onPress={() => handlePress(item)}
        pendingCount={pendingCounts[item.id] ?? 0}
      />
    ),
    [handlePress, pendingCounts],
  );

  const keyExtractor = useCallback((item: Sortie) => item.id, []);

  const renderContent = () => {
    if (isLoading) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.primaryLight} />
          <Text style={styles.loadingText}>Chargement des sorties...</Text>
        </View>
      );
    }

    if (activeTab === 'toutes' && allError) {
      return (
        <View style={styles.centered}>
          <Ionicons name="alert-circle" size={48} color={COLORS.danger} />
          <Text style={styles.errorText}>Impossible de charger les sorties</Text>
        </View>
      );
    }

    if (currentData.length === 0) {
      const emptyMessages: Record<FilterTab, { title: string; subtitle: string }> = {
        'toutes': {
          title: 'Aucune sortie prevue',
          subtitle: 'Choisis un sentier et organise la premiere sortie de groupe !',
        },
        'mes-sorties': {
          title: 'Aucune sortie a venir',
          subtitle: userId
            ? 'Tu n\'as pas encore organise ou rejoint de sortie.'
            : 'Connecte-toi pour voir tes sorties.',
        },
        'amis': {
          title: 'Aucune sortie d\'amis',
          subtitle: userId
            ? 'Tes amis n\'ont pas de sorties prevues pour le moment.'
            : 'Connecte-toi pour voir les sorties de tes amis.',
        },
      };
      const msg = emptyMessages[activeTab];
      return (
        <View style={styles.centered}>
          <Ionicons name="people-outline" size={64} color={COLORS.textMuted} />
          <Text style={styles.emptyTitle}>{msg.title}</Text>
          <Text style={styles.emptySubtitle}>{msg.subtitle}</Text>
          <Pressable
            style={styles.emptyCTA}
            onPress={() => navigation.getParent()?.navigate('TrailsTab', { screen: 'TrailList' })}
            accessibilityLabel="Voir les sentiers pour organiser une sortie"
          >
            <Ionicons name="trail-sign" size={18} color={COLORS.white} />
            <Text style={styles.emptyCTAText}>Voir les sentiers</Text>
          </Pressable>
        </View>
      );
    }

    return (
      <View style={styles.listContainer}>
        <Text style={styles.countHeader}>
          {currentData.length} sortie{currentData.length > 1 ? 's' : ''} a venir
        </Text>
        <FlashList
          data={currentData}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          estimatedItemSize={120}
        />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Filter tabs */}
      <View style={styles.tabBar}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <Pressable
              key={tab.key}
              style={[styles.tab, isActive && styles.tabActive]}
              onPress={() => setActiveTab(tab.key)}
              accessibilityLabel={`Filtre ${tab.label}`}
              accessibilityState={{ selected: isActive }}
            >
              <Ionicons
                name={tab.icon}
                size={16}
                color={isActive ? COLORS.primaryLight : COLORS.textMuted}
              />
              <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {renderContent()}
    </View>
  );
}

const SortieCard = React.memo(function SortieCard({ sortie, onPress, pendingCount = 0 }: { sortie: Sortie; onPress: () => void; pendingCount?: number }) {
  const trailName = sortie.trail?.name ?? 'Sentier inconnu';
  const trailRegion = sortie.trail?.region ?? null;
  const trailDifficulty = sortie.trail?.difficulty ?? null;

  const difficultyColor =
    trailDifficulty === 'facile'
      ? COLORS.easy
      : trailDifficulty === 'moyen'
        ? COLORS.medium
        : trailDifficulty === 'difficile'
          ? COLORS.hard
          : trailDifficulty === 'expert'
            ? COLORS.expert
            : COLORS.textMuted;

  return (
    <Pressable
      style={styles.card}
      onPress={onPress}
      accessibilityLabel={`Sortie ${sortie.titre}${pendingCount > 0 ? `, ${pendingCount} demande${pendingCount > 1 ? 's' : ''} en attente` : ''}`}
    >
      {pendingCount > 0 && (
        <View style={styles.pendingBadge}>
          <Text style={styles.pendingBadgeText}>{pendingCount}</Text>
        </View>
      )}
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle} numberOfLines={1}>
          {sortie.titre}
        </Text>
        {trailDifficulty && (
          <View style={[styles.diffBadge, { backgroundColor: difficultyColor + '20' }]}>
            <Text style={[styles.diffText, { color: difficultyColor }]}>
              {trailDifficulty.charAt(0).toUpperCase() + trailDifficulty.slice(1)}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.cardRow}>
        <Ionicons name="trail-sign" size={14} color={COLORS.textSecondary} />
        <Text style={styles.cardMeta} numberOfLines={1}>
          {trailName}
        </Text>
        {trailRegion && (
          <Text style={styles.cardRegion}>({trailRegion})</Text>
        )}
      </View>

      <View style={styles.cardRow}>
        <Ionicons name="calendar" size={14} color={COLORS.textSecondary} />
        <Text style={styles.cardMeta}>{sortie.date_sortie}</Text>
        <Ionicons name="time" size={14} color={COLORS.textSecondary} />
        <Text style={styles.cardMeta}>{sortie.heure_depart}</Text>
      </View>

      <View style={styles.cardRow}>
        <Ionicons name="people" size={14} color={COLORS.textSecondary} />
        <Text style={styles.cardMeta}>{sortie.places_max} places</Text>
        {sortie.organisateur?.username && (
          <>
            <Ionicons name="person" size={14} color={COLORS.textSecondary} />
            <Text style={styles.cardMeta}>{sortie.organisateur.username}</Text>
          </>
        )}
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
    gap: SPACING.sm,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.surface,
    minHeight: SPACING.xxl,
  },
  tabActive: {
    backgroundColor: COLORS.primaryLight + '20',
    borderWidth: 1,
    borderColor: COLORS.primaryLight + '50',
  },
  tabText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  tabTextActive: {
    color: COLORS.primaryLight,
  },
  centered: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.md,
    padding: SPACING.lg,
  },
  loadingText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textMuted,
  },
  errorText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.danger,
    textAlign: 'center',
  },
  emptyTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  emptySubtitle: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },
  emptyCTA: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.md,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.xl,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
  },
  emptyCTAText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.white,
  },
  listContainer: {
    flex: 1,
  },
  countHeader: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    color: COLORS.textPrimary,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.sm,
  },
  listContent: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    gap: SPACING.sm,
    position: 'relative' as const,
  },
  pendingBadge: {
    position: 'absolute' as const,
    top: -6,
    right: -4,
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.danger,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 6,
    zIndex: 1,
  },
  pendingBadgeText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700' as const,
    color: COLORS.white,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    color: COLORS.textPrimary,
    flex: 1,
    marginRight: SPACING.sm,
  },
  diffBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.full,
  },
  diffText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  cardMeta: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginRight: SPACING.sm,
  },
  cardRegion: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textMuted,
  },
});
