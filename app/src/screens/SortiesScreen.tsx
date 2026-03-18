import { useCallback } from 'react';
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
import { COLORS, FONT_SIZE, SPACING, BORDER_RADIUS } from '@/constants';
import { useAllSorties } from '@/hooks/useAllSorties';
import type { SortiesStackParamList } from '@/navigation/types';
import type { Sortie } from '@/types';

export default function SortiesScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<SortiesStackParamList>>();
  const { data: sorties, isLoading, error } = useAllSorties();

  const handlePress = useCallback(
    (sortie: Sortie) => {
      navigation.navigate('SortieDetailFromSorties', { sortie });
    },
    [navigation],
  );

  const renderItem = useCallback(
    ({ item }: { item: Sortie }) => <SortieCard sortie={item} onPress={() => handlePress(item)} />,
    [handlePress],
  );

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primaryLight} />
        <Text style={styles.loadingText}>Chargement des sorties...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Ionicons name="alert-circle" size={48} color={COLORS.danger} />
        <Text style={styles.errorText}>Impossible de charger les sorties</Text>
      </View>
    );
  }

  if (!sorties || sorties.length === 0) {
    return (
      <View style={styles.centered}>
        <Ionicons name="people-outline" size={64} color={COLORS.textMuted} />
        <Text style={styles.emptyTitle}>Aucune sortie prevue</Text>
        <Text style={styles.emptySubtitle}>Organise la premiere !</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>
        {sorties.length} sortie{sorties.length > 1 ? 's' : ''} a venir
      </Text>
      <FlashList
        data={sorties}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

function SortieCard({ sortie, onPress }: { sortie: Sortie; onPress: () => void }) {
  const difficultyColor =
    sortie.trail?.difficulty === 'facile'
      ? COLORS.easy
      : sortie.trail?.difficulty === 'moyen'
        ? COLORS.medium
        : sortie.trail?.difficulty === 'difficile'
          ? COLORS.hard
          : sortie.trail?.difficulty === 'expert'
            ? COLORS.expert
            : COLORS.textMuted;

  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle} numberOfLines={1}>
          {sortie.titre}
        </Text>
        {sortie.trail?.difficulty && (
          <View style={[styles.diffBadge, { backgroundColor: difficultyColor + '20' }]}>
            <Text style={[styles.diffText, { color: difficultyColor }]}>
              {sortie.trail.difficulty.charAt(0).toUpperCase() + sortie.trail.difficulty.slice(1)}
            </Text>
          </View>
        )}
      </View>

      {sortie.trail?.name && (
        <View style={styles.cardRow}>
          <Ionicons name="trail-sign" size={14} color={COLORS.textSecondary} />
          <Text style={styles.cardMeta} numberOfLines={1}>
            {sortie.trail.name}
          </Text>
          {sortie.trail.region && (
            <Text style={styles.cardRegion}>({sortie.trail.region})</Text>
          )}
        </View>
      )}

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
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
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
  },
  header: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    color: COLORS.textPrimary,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
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
