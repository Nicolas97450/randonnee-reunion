import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useSupabaseTrails } from '@/hooks/useSupabaseTrails';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Location from 'expo-location';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { COLORS, FONT_SIZE, SPACING, BORDER_RADIUS } from '@/constants';
import type { TrailStackParamList } from '@/navigation/types';
import type { Difficulty, Trail } from '@/types';
import TrailCard from '@/components/TrailCard';
import Skeleton from '@/components/Skeleton';
import { haversineDistance, formatDistanceToPoint } from '@/lib/geo';
import { useFavorites } from '@/hooks/useFavorites';

type TrailItem = Omit<Trail, 'id' | 'created_at' | 'updated_at'> & { id?: string };

const DIFFICULTIES: Difficulty[] = ['facile', 'moyen', 'difficile', 'expert'];

type SortKey = 'nom' | 'distance' | 'denivele' | 'duree';
type DurationFilter = '< 1h' | '1-3h' | '3-5h' | '> 5h';
type TypeFilter = 'boucle' | 'aller-retour';

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'nom', label: 'Nom' },
  { key: 'distance', label: 'Distance' },
  { key: 'denivele', label: 'D+' },
  { key: 'duree', label: 'Duree' },
];

const DURATION_FILTERS: DurationFilter[] = ['< 1h', '1-3h', '3-5h', '> 5h'];
const TYPE_FILTERS: TypeFilter[] = ['boucle', 'aller-retour'];

function matchesDurationFilter(durationMin: number, filter: DurationFilter): boolean {
  switch (filter) {
    case '< 1h':
      return durationMin < 60;
    case '1-3h':
      return durationMin >= 60 && durationMin < 180;
    case '3-5h':
      return durationMin >= 180 && durationMin < 300;
    case '> 5h':
      return durationMin >= 300;
  }
}

/* ------------------------------------------------------------------ */
/*  FilterChip — memoized for performance                             */
/* ------------------------------------------------------------------ */
const FilterChip = React.memo(function FilterChip({
  label,
  active,
  onPress,
  icon,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <Pressable
      style={[styles.chip, active && styles.chipActive]}
      onPress={onPress}
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
    >
      <View style={styles.chipInner}>
        {icon && (
          <Ionicons
            name={active ? icon : (`${icon}-outline` as keyof typeof Ionicons.glyphMap)}
            size={14}
            color={active ? COLORS.primaryLight : COLORS.textSecondary}
          />
        )}
        <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
      </View>
    </Pressable>
  );
});

/* ------------------------------------------------------------------ */
/*  SortChip — smaller variant for the sort row                       */
/* ------------------------------------------------------------------ */
const SortChip = React.memo(function SortChip({
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
      style={[styles.sortChip, active && styles.sortChipActive]}
      onPress={onPress}
      accessibilityLabel={`Trier par ${label}`}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
    >
      <Text style={[styles.sortChipText, active && styles.sortChipTextActive]}>{label}</Text>
    </Pressable>
  );
});

/* ------------------------------------------------------------------ */
/*  Section header inside the bottom sheet                            */
/* ------------------------------------------------------------------ */
const FilterSectionHeader = React.memo(function FilterSectionHeader({
  title,
}: {
  title: string;
}) {
  return <Text style={styles.sectionTitle}>{title}</Text>;
});

/* ------------------------------------------------------------------ */
/*  Main screen                                                       */
/* ------------------------------------------------------------------ */
export default function TrailListScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<TrailStackParamList>>();
  const { trails, isLoading } = useSupabaseTrails();
  const { favorites, isFavorite } = useFavorites();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    debounceRef.current = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(debounceRef.current);
  }, [search]);

  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<DurationFilter | null>(null);
  const [selectedType, setSelectedType] = useState<TypeFilter | null>(null);
  const [showFavorites, setShowFavorites] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>('nom');

  // Pres de moi
  const [nearbyActive, setNearbyActive] = useState(false);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);

  // Bottom sheet
  const filterSheetRef = useRef<BottomSheet>(null);
  const filterSnapPoints = useMemo(() => ['60%', '85%'], []);

  const openFilterSheet = useCallback(() => {
    filterSheetRef.current?.snapToIndex(0);
  }, []);

  const closeFilterSheet = useCallback(() => {
    filterSheetRef.current?.close();
  }, []);

  const handleNearbyToggle = useCallback(async () => {
    if (nearbyActive) {
      setNearbyActive(false);
      return;
    }
    setLocationLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission refusee',
          'Activez la localisation pour trier par proximite.',
        );
        setLocationLoading(false);
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setUserLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
      setNearbyActive(true);
    } catch {
      Alert.alert('Erreur', 'Impossible d\'obtenir votre position.');
    } finally {
      setLocationLoading(false);
    }
  }, [nearbyActive]);

  const REGIONS = useMemo(() => [...new Set(trails.map((t) => t.region))].sort(), [trails]);

  // Compute distances from user position
  const trailDistances = useMemo(() => {
    if (!userLocation) return new Map<string, number>();
    const map = new Map<string, number>();
    for (const trail of trails) {
      if (trail.start_point) {
        const dist = haversineDistance(
          userLocation.latitude,
          userLocation.longitude,
          trail.start_point.latitude,
          trail.start_point.longitude,
        );
        map.set(trail.slug, dist);
      }
    }
    return map;
  }, [trails, userLocation]);

  // Count active filters (not counting search or sort)
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedDifficulty) count++;
    if (selectedRegion) count++;
    if (selectedDuration) count++;
    if (selectedType) count++;
    if (showFavorites) count++;
    return count;
  }, [selectedDifficulty, selectedRegion, selectedDuration, selectedType, showFavorites]);

  const filteredTrails = useMemo(() => {
    const q = debouncedSearch.toLowerCase();
    let result = trails.filter((trail) => {
      const matchesSearch =
        q === '' ||
        trail.name.toLowerCase().includes(q) ||
        trail.region.toLowerCase().includes(q);
      const matchesDifficulty = !selectedDifficulty || trail.difficulty === selectedDifficulty;
      const matchesRegion = !selectedRegion || trail.region === selectedRegion;
      const matchesDuration = !selectedDuration || matchesDurationFilter(trail.duration_min, selectedDuration);
      const matchesType = !selectedType || trail.trail_type === selectedType;
      const matchesFavorites = !showFavorites || isFavorite(trail.slug);
      return matchesSearch && matchesDifficulty && matchesRegion && matchesDuration && matchesType && matchesFavorites;
    });

    // Sorting
    if (nearbyActive && userLocation) {
      result = [...result].sort((a, b) => {
        const distA = trailDistances.get(a.slug) ?? Infinity;
        const distB = trailDistances.get(b.slug) ?? Infinity;
        return distA - distB;
      });
    } else {
      result = [...result].sort((a, b) => {
        switch (sortKey) {
          case 'distance':
            return a.distance_km - b.distance_km;
          case 'denivele':
            return b.elevation_gain_m - a.elevation_gain_m;
          case 'duree':
            return a.duration_min - b.duration_min;
          case 'nom':
          default:
            return a.name.localeCompare(b.name, 'fr');
        }
      });
    }

    return result;
  }, [trails, debouncedSearch, selectedDifficulty, selectedRegion, selectedDuration, selectedType, showFavorites, isFavorite, favorites, sortKey, nearbyActive, userLocation, trailDistances]);

  const handleTrailPress = useCallback(
    (trail: TrailItem) => {
      navigation.navigate('TrailDetail', { trailId: trail.slug, trailName: trail.name });
    },
    [navigation],
  );

  const renderTrailItem = useCallback(
    ({ item }: { item: TrailItem }) => {
      const distKm = nearbyActive ? trailDistances.get(item.slug) : undefined;
      return (
        <View>
          <TrailCard trail={item} onPress={() => handleTrailPress(item)} />
          {distKm !== undefined && (
            <View style={styles.distanceBadge}>
              <Ionicons name="location-outline" size={12} color={COLORS.primaryLight} />
              <Text style={styles.distanceText}>a {formatDistanceToPoint(distKm)}</Text>
            </View>
          )}
        </View>
      );
    },
    [handleTrailPress, nearbyActive, trailDistances],
  );

  const keyExtractor = useCallback((item: TrailItem) => item.slug, []);

  const resetAllFilters = useCallback(() => {
    setSearch('');
    setSelectedDifficulty(null);
    setSelectedRegion(null);
    setSelectedDuration(null);
    setSelectedType(null);
    setShowFavorites(false);
    setNearbyActive(false);
    setSortKey('nom');
  }, []);

  const resetSheetFilters = useCallback(() => {
    setSelectedDifficulty(null);
    setSelectedRegion(null);
    setSelectedDuration(null);
    setSelectedType(null);
    setShowFavorites(false);
  }, []);

  const hasActiveFilters = selectedDifficulty || selectedRegion || selectedDuration || selectedType || showFavorites;

  const resultSummary = useMemo(() => {
    const count = filteredTrails.length;
    const isFiltered = hasActiveFilters || debouncedSearch.length > 0;

    if (isFiltered) {
      return `${count} resultat${count > 1 ? 's' : ''} sur ${trails.length}`;
    }

    const totalKm = Math.round(
      filteredTrails.reduce((sum, t) => sum + t.distance_km, 0),
    );
    const regionCount = new Set(filteredTrails.map((t) => t.region)).size;
    return `${count} sentier${count > 1 ? 's' : ''} · ${totalKm} km au total · ${regionCount} region${regionCount > 1 ? 's' : ''}`;
  }, [filteredTrails, trails.length, hasActiveFilters, debouncedSearch]);

  // Filter button label
  const filterButtonLabel = activeFilterCount > 0
    ? `Filtrer (${activeFilterCount})`
    : 'Filtrer';

  return (
    <View style={styles.container}>
      {/* Search Bar + Pres de moi + Filtrer */}
      <View style={styles.topRow}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={18} color={COLORS.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher un sentier..."
            placeholderTextColor={COLORS.textMuted}
            value={search}
            onChangeText={setSearch}
            accessibilityLabel="Rechercher un sentier"
          />
          {search.length > 0 && (
            <Pressable
              onPress={() => setSearch('')}
              accessibilityLabel="Effacer la recherche"
              style={styles.clearButton}
            >
              <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
            </Pressable>
          )}
        </View>
        <Pressable
          style={[styles.nearbyButton, nearbyActive && styles.nearbyButtonActive]}
          onPress={handleNearbyToggle}
          accessibilityLabel="Trier par proximite"
          accessibilityRole="button"
        >
          {locationLoading ? (
            <ActivityIndicator size="small" color={nearbyActive ? COLORS.primaryLight : COLORS.textSecondary} />
          ) : (
            <Ionicons
              name="location-outline"
              size={20}
              color={nearbyActive ? COLORS.primaryLight : COLORS.textSecondary}
            />
          )}
        </Pressable>
        <Pressable
          style={[styles.filterButton, activeFilterCount > 0 && styles.filterButtonActive]}
          onPress={openFilterSheet}
          accessibilityLabel={filterButtonLabel}
          accessibilityRole="button"
          accessibilityHint="Ouvre les options de filtrage"
        >
          <Ionicons
            name="options-outline"
            size={18}
            color={activeFilterCount > 0 ? COLORS.primaryLight : COLORS.textSecondary}
          />
          <Text
            style={[
              styles.filterButtonText,
              activeFilterCount > 0 && styles.filterButtonTextActive,
            ]}
          >
            {filterButtonLabel}
          </Text>
        </Pressable>
      </View>

      {/* Sort Row — always visible */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.sortRow}
        contentContainerStyle={styles.sortContent}
      >
        {SORT_OPTIONS.map((opt) => (
          <SortChip
            key={opt.key}
            label={opt.label}
            active={sortKey === opt.key && !nearbyActive}
            onPress={() => { setSortKey(opt.key); setNearbyActive(false); }}
          />
        ))}
      </ScrollView>

      {/* Results count */}
      <View style={styles.resultBar}>
        <Text style={styles.resultCountBold}>{resultSummary}</Text>
        {isLoading && <ActivityIndicator size="small" color={COLORS.primaryLight} />}
      </View>

      {/* Initial loading */}
      {isLoading && trails.length === 0 ? (
        <View style={{ paddingHorizontal: SPACING.md, paddingTop: SPACING.sm }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <View key={i} style={{ backgroundColor: COLORS.card, borderRadius: BORDER_RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.sm }}>
              <Skeleton width="70%" height={16} borderRadius={4} />
              <Skeleton width="40%" height={12} borderRadius={4} />
              <Skeleton width="100%" height={10} borderRadius={4} />
            </View>
          ))}
        </View>
      ) : filteredTrails.length === 0 && debouncedSearch.length > 0 ? (
        <View style={styles.emptySearch}>
          <Ionicons name="search-outline" size={48} color={COLORS.textMuted} />
          <Text style={styles.emptySearchText}>
            Aucun sentier trouve pour &apos;{debouncedSearch}&apos;
          </Text>
          <Pressable onPress={resetAllFilters} accessibilityLabel="Reinitialiser les filtres" accessibilityRole="button">
            <Text style={styles.resetFiltersText}>Reinitialiser les filtres</Text>
          </Pressable>
        </View>
      ) : filteredTrails.length === 0 && hasActiveFilters ? (
        <View style={styles.emptySearch}>
          <Ionicons name="filter-outline" size={48} color={COLORS.textMuted} />
          <Text style={styles.emptySearchText}>
            Aucun sentier ne correspond a ces filtres
          </Text>
          <Pressable onPress={resetAllFilters} accessibilityLabel="Reinitialiser les filtres" accessibilityRole="button">
            <Text style={styles.resetFiltersText}>Reinitialiser les filtres</Text>
          </Pressable>
        </View>
      ) : (
        <FlashList
          data={filteredTrails}
          renderItem={renderTrailItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          estimatedItemSize={100}
        />
      )}

      {/* ============================================================ */}
      {/*  Filter Bottom Sheet                                         */}
      {/* ============================================================ */}
      <BottomSheet
        ref={filterSheetRef}
        index={-1}
        snapPoints={filterSnapPoints}
        enablePanDownToClose
        backgroundStyle={styles.sheetBackground}
        handleIndicatorStyle={styles.sheetIndicator}
      >
        <BottomSheetScrollView
          contentContainerStyle={styles.sheetScrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Sheet header */}
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Filtrer les sentiers</Text>
            <Pressable
              onPress={closeFilterSheet}
              style={styles.sheetCloseButton}
              accessibilityLabel="Fermer les filtres"
              accessibilityRole="button"
            >
              <Ionicons name="close" size={24} color={COLORS.textPrimary} />
            </Pressable>
          </View>

          {/* Difficulte */}
          <FilterSectionHeader title="Difficulte" />
          <View style={styles.chipGrid}>
            {DIFFICULTIES.map((d) => (
              <FilterChip
                key={d}
                label={d.charAt(0).toUpperCase() + d.slice(1)}
                active={selectedDifficulty === d}
                onPress={() => setSelectedDifficulty(selectedDifficulty === d ? null : d)}
              />
            ))}
          </View>

          {/* Region */}
          <FilterSectionHeader title="Region" />
          <View style={styles.chipGrid}>
            {REGIONS.map((r) => (
              <FilterChip
                key={r}
                label={r}
                active={selectedRegion === r}
                onPress={() => setSelectedRegion(selectedRegion === r ? null : r)}
              />
            ))}
          </View>

          {/* Duree */}
          <FilterSectionHeader title="Duree" />
          <View style={styles.chipGrid}>
            {DURATION_FILTERS.map((d) => (
              <FilterChip
                key={d}
                label={d}
                active={selectedDuration === d}
                onPress={() => setSelectedDuration(selectedDuration === d ? null : d)}
              />
            ))}
          </View>

          {/* Type */}
          <FilterSectionHeader title="Type" />
          <View style={styles.chipGrid}>
            {TYPE_FILTERS.map((t) => (
              <FilterChip
                key={t}
                label={t.charAt(0).toUpperCase() + t.slice(1)}
                active={selectedType === t}
                onPress={() => setSelectedType(selectedType === t ? null : t)}
              />
            ))}
          </View>

          {/* Favoris */}
          <View style={styles.favoritesRow}>
            <FilterChip
              label="Favoris seulement"
              active={showFavorites}
              onPress={() => setShowFavorites(!showFavorites)}
              icon="heart"
            />
          </View>

          {/* Bottom actions */}
          <View style={styles.sheetActions}>
            <Pressable
              style={[
                styles.applyButton,
                activeFilterCount === 0 && styles.applyButtonDisabled,
              ]}
              onPress={closeFilterSheet}
              accessibilityLabel={`Appliquer les filtres, ${filteredTrails.length} resultats`}
              accessibilityRole="button"
            >
              <Text style={styles.applyButtonText}>
                Appliquer ({filteredTrails.length} resultat{filteredTrails.length > 1 ? 's' : ''})
              </Text>
            </Pressable>

            <Pressable
              style={styles.resetButton}
              onPress={resetSheetFilters}
              accessibilityLabel="Reinitialiser tous les filtres"
              accessibilityRole="button"
            >
              <Text style={styles.resetButtonText}>Reinitialiser</Text>
            </Pressable>
          </View>
        </BottomSheetScrollView>
      </BottomSheet>
    </View>
  );
}

/* ================================================================== */
/*  Styles                                                            */
/* ================================================================== */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  /* ---- Top row: search + nearby + filter button ---- */
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: SPACING.md,
    marginTop: SPACING.sm,
    gap: SPACING.sm,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.md,
    height: 48,
    gap: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: FONT_SIZE.md,
    color: COLORS.textPrimary,
  },
  clearButton: {
    minWidth: 48,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nearbyButton: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  nearbyButtonActive: {
    backgroundColor: COLORS.primary + '20',
    borderColor: COLORS.primaryLight,
  },

  /* ---- Filter button ---- */
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: SPACING.xs,
  },
  filterButtonActive: {
    backgroundColor: COLORS.primary + '20',
    borderColor: COLORS.primaryLight,
  },
  filterButtonText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  filterButtonTextActive: {
    color: COLORS.primaryLight,
  },

  /* ---- Sort row ---- */
  sortRow: {
    maxHeight: 44,
    marginTop: SPACING.sm,
  },
  sortContent: {
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
    alignItems: 'center',
  },
  sortChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    minHeight: 36,
    minWidth: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sortChipActive: {
    backgroundColor: COLORS.primary + '20',
    borderColor: COLORS.primaryLight,
  },
  sortChipText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  sortChipTextActive: {
    color: COLORS.primaryLight,
    fontWeight: '600',
  },

  /* ---- Shared chip styles (used in bottom sheet) ---- */
  chip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    minHeight: 48,
    justifyContent: 'center',
  },
  chipActive: {
    backgroundColor: COLORS.primary + '20',
    borderColor: COLORS.primaryLight,
  },
  chipInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  chipText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
  },
  chipTextActive: {
    color: COLORS.primaryLight,
    fontWeight: '600',
  },

  /* ---- Results bar ---- */
  resultBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: SPACING.md,
    marginTop: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  resultCountBold: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },

  /* ---- Empty / loading states ---- */
  emptySearch: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.md,
    padding: SPACING.lg,
  },
  emptySearchText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  resetFiltersText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.primaryLight,
    fontWeight: '600',
    marginTop: SPACING.sm,
  },

  /* ---- List ---- */
  listContent: {
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.xxl,
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginHorizontal: SPACING.md + SPACING.md,
    marginTop: -SPACING.sm + 2,
    marginBottom: SPACING.xs,
  },
  distanceText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.primaryLight,
    fontWeight: '500',
  },

  /* ---- Bottom Sheet ---- */
  sheetBackground: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
  },
  sheetIndicator: {
    backgroundColor: COLORS.textMuted,
    width: 40,
  },
  sheetScrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
  },
  sheetTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  sheetCloseButton: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  favoritesRow: {
    marginTop: SPACING.lg,
    flexDirection: 'row',
  },

  /* ---- Sheet action buttons ---- */
  sheetActions: {
    marginTop: SPACING.xl,
    gap: SPACING.sm,
  },
  applyButton: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: BORDER_RADIUS.md,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  applyButtonDisabled: {
    backgroundColor: COLORS.primaryLight,
  },
  applyButtonText: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    color: COLORS.black,
  },
  resetButton: {
    backgroundColor: COLORS.surfaceLight,
    borderRadius: BORDER_RADIUS.md,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resetButtonText: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
});
