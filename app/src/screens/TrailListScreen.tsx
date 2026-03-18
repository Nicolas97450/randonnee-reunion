import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useSupabaseTrails } from '@/hooks/useSupabaseTrails';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Pressable,
  ScrollView,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { COLORS, FONT_SIZE, SPACING, BORDER_RADIUS } from '@/constants';
import type { TrailStackParamList } from '@/navigation/types';
import type { Difficulty, Trail } from '@/types';
import TrailCard from '@/components/TrailCard';

type TrailItem = Omit<Trail, 'id' | 'created_at' | 'updated_at'> & { id?: string };

const DIFFICULTIES: Difficulty[] = ['facile', 'moyen', 'difficile', 'expert'];

export default function TrailListScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<TrailStackParamList>>();
  const { trails } = useSupabaseTrails();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    debounceRef.current = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(debounceRef.current);
  }, [search]);

  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);

  const REGIONS = useMemo(() => [...new Set(trails.map((t) => t.region))].sort(), [trails]);

  const filteredTrails = useMemo(() => {
    const q = debouncedSearch.toLowerCase();
    return trails.filter((trail) => {
      const matchesSearch =
        q === '' ||
        trail.name.toLowerCase().includes(q) ||
        trail.region.toLowerCase().includes(q);
      const matchesDifficulty = !selectedDifficulty || trail.difficulty === selectedDifficulty;
      const matchesRegion = !selectedRegion || trail.region === selectedRegion;
      return matchesSearch && matchesDifficulty && matchesRegion;
    });
  }, [trails, debouncedSearch, selectedDifficulty, selectedRegion]);

  const handleTrailPress = useCallback(
    (trail: TrailItem) => {
      navigation.navigate('TrailDetail', { trailId: trail.slug });
    },
    [navigation],
  );

  const renderTrailItem = useCallback(
    ({ item }: { item: TrailItem }) => (
      <TrailCard trail={item} onPress={() => handleTrailPress(item)} />
    ),
    [handleTrailPress],
  );

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color={COLORS.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher un sentier..."
          placeholderTextColor={COLORS.textMuted}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <Pressable onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
          </Pressable>
        )}
      </View>

      {/* Difficulty Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterRow}
        contentContainerStyle={styles.filterContent}
      >
        <FilterChip
          label="Tous"
          active={selectedDifficulty === null}
          onPress={() => setSelectedDifficulty(null)}
        />
        {DIFFICULTIES.map((d) => (
          <FilterChip
            key={d}
            label={d.charAt(0).toUpperCase() + d.slice(1)}
            active={selectedDifficulty === d}
            onPress={() => setSelectedDifficulty(selectedDifficulty === d ? null : d)}
          />
        ))}
      </ScrollView>

      {/* Region Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterRow}
        contentContainerStyle={styles.filterContent}
      >
        <FilterChip
          label="Toutes regions"
          active={selectedRegion === null}
          onPress={() => setSelectedRegion(null)}
        />
        {REGIONS.map((r) => (
          <FilterChip
            key={r}
            label={r}
            active={selectedRegion === r}
            onPress={() => setSelectedRegion(selectedRegion === r ? null : r)}
          />
        ))}
      </ScrollView>

      {/* Results count */}
      <Text style={styles.resultCount}>
        {filteredTrails.length} sentier{filteredTrails.length > 1 ? 's' : ''}
      </Text>

      {/* Trail List */}
      <FlashList
        data={filteredTrails}
        renderItem={renderTrailItem}
        keyExtractor={(item) => item.slug}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

function FilterChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[styles.chip, active && styles.chipActive]}
      onPress={onPress}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.sm,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.md,
    height: 44,
    gap: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: FONT_SIZE.md,
    color: COLORS.textPrimary,
  },
  filterRow: {
    maxHeight: 40,
    marginTop: SPACING.sm,
  },
  filterContent: {
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
  },
  chip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipActive: {
    backgroundColor: COLORS.primary + '20',
    borderColor: COLORS.primary,
  },
  chipText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
  },
  chipTextActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  resultCount: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textMuted,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  listContent: {
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.xxl,
  },
});
