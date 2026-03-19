import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View, ActivityIndicator, FlatList, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { GestureHandlerRootView, TouchableOpacity } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import Mapbox from '@rnmapbox/maps';
import BaseMap, { type BaseMapHandle } from '@/components/BaseMap';
import TrailMarkers from '@/components/TrailMarkers';
import { useSupabaseTrails } from '@/hooks/useSupabaseTrails';
import { COLORS, FONT_SIZE, SPACING, BORDER_RADIUS } from '@/constants';
import { useOverpassPOI } from '@/hooks/useOverpassPOI';
import type { RootTabParamList } from '@/navigation/types';
import type { Trail } from '@/types/trail';
import DifficultyBadge from '@/components/DifficultyBadge';
import { formatDistance, formatElevation, formatDuration } from '@/lib/formatters';

// --- Map style cycle (Mapbox) ---
type MapStyleKey = 'outdoors' | 'satellite' | 'light';

const MAP_STYLES: Record<MapStyleKey, { style: string; icon: string; label: string }> = {
  outdoors: { style: 'mapbox://styles/mapbox/outdoors-v12', icon: 'map-outline', label: 'Vue relief' },
  satellite: { style: 'mapbox://styles/mapbox/satellite-streets-v12', icon: 'earth-outline', label: 'Vue satellite' },
  light: { style: 'mapbox://styles/mapbox/light-v11', icon: 'grid-outline', label: 'Vue claire' },
};

const STYLE_CYCLE: MapStyleKey[] = ['outdoors', 'satellite', 'light'];

// --- POI colors by type ---
const POI_COLORS: Record<string, string> = {
  restaurant: '#f97316',  // orange
  cafe: '#f97316',
  bar: '#f97316',
  fast_food: '#f97316',
  viewpoint: '#3b82f6',   // bleu
  picnic_site: '#22c55e', // vert
  spring: '#06b6d4',      // cyan
  drinking_water: '#06b6d4',
  shelter: '#22c55e',     // vert
  alpine_hut: '#22c55e',
  parking: '#78716c',     // gris
  toilets: '#78716c',
  waterfall: '#1d4ed8',   // bleu fonce
  peak: '#dc2626',        // rouge
};

const POI_CIRCLE_MIN_ZOOM = 12;
const POI_LABEL_MIN_ZOOM = 13;

// --- Haversine distance (km) ---
function haversineDistance(
  lat1: number, lon1: number,
  lat2: number, lon2: number,
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// --- Suggestion card types ---
interface SuggestionItem {
  key: string;
  label: string;
  color: string;
  trail: Trail;
  distanceKm: number | null;
}

// --- Memoized suggestion card ---
const SuggestionCard = React.memo(function SuggestionCard({
  item,
  onPress,
}: {
  item: SuggestionItem;
  onPress: (slug: string) => void;
}) {
  const handlePress = useCallback(() => {
    onPress(item.trail.slug);
  }, [item.trail.slug, onPress]);

  return (
    <TouchableOpacity
      style={suggestionStyles.card}
      onPress={handlePress}
      activeOpacity={0.7}
      accessibilityLabel={`Suggestion : ${item.label}, ${item.trail.name}`}
    >
      <Text style={[suggestionStyles.label, { color: item.color }]} numberOfLines={1}>
        {item.label}
      </Text>
      <Text style={suggestionStyles.trailName} numberOfLines={1}>
        {item.trail.name}
      </Text>
      {item.distanceKm != null && (
        <Text style={suggestionStyles.distance}>
          {item.distanceKm < 1
            ? `${Math.round(item.distanceKm * 1000)} m`
            : `${item.distanceKm.toFixed(1)} km`}
        </Text>
      )}
    </TouchableOpacity>
  );
});

export default function MapScreen() {
  const navigation = useNavigation<NavigationProp<RootTabParamList>>();
  const { trails, isLoading, error } = useSupabaseTrails();
  const mapRef = useRef<BaseMapHandle>(null);
  const bottomSheetRef = useRef<BottomSheet>(null);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const snapPoints = useMemo(() => ['25%'], []);
  const [userPosition, setUserPosition] = useState<{ latitude: number; longitude: number } | null>(null);
  const [mapStyleIndex, setMapStyleIndex] = useState(0);
  const [showPOI, setShowPOI] = useState(true);
  const [currentZoom, setCurrentZoom] = useState(10);

  const currentStyleKey = STYLE_CYCLE[mapStyleIndex];
  const currentMapStyle = MAP_STYLES[currentStyleKey].style;
  const currentStyleIcon = MAP_STYLES[currentStyleKey].icon;
  const nextStyleKey = STYLE_CYCLE[(mapStyleIndex + 1) % STYLE_CYCLE.length];
  const nextStyleLabel = MAP_STYLES[nextStyleKey].label;

  const { pois } = useOverpassPOI();

  // POI loaded — no debug log in production

  const handleToggleMapStyle = useCallback(() => {
    setMapStyleIndex((prev) => (prev + 1) % STYLE_CYCLE.length);
  }, []);

  const handleTogglePOI = useCallback(() => {
    setShowPOI((prev) => !prev);
  }, []);

  useEffect(() => {
    let subscription: Location.LocationSubscription | null = null;
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setUserPosition({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
      subscription = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Balanced, timeInterval: 10000, distanceInterval: 20 },
        (loc) => setUserPosition({ latitude: loc.coords.latitude, longitude: loc.coords.longitude }),
      );
    })();
    return () => { subscription?.remove(); };
  }, []);

  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const selectedTrail = useMemo(() => {
    if (!selectedSlug) return null;
    return trails.find((t) => t.slug === selectedSlug) ?? null;
  }, [selectedSlug, trails]);

  // --- Compute suggestions (memoized) ---
  const suggestions = useMemo<SuggestionItem[]>(() => {
    if (trails.length === 0) return [];

    // Helper: get distance from user to trail start_point
    const distToUser = (t: Trail): number | null => {
      if (!userPosition || !t.start_point) return null;
      return haversineDistance(
        userPosition.latitude, userPosition.longitude,
        t.start_point.latitude, t.start_point.longitude,
      );
    };

    // Pre-compute distances for trails with start_point
    const withDist = trails
      .filter((t) => t.start_point != null)
      .map((t) => ({ trail: t, dist: distToUser(t)! }));

    const hasGPS = userPosition != null && withDist.length > 0;

    const result: SuggestionItem[] = [];

    // 1. "A cote de toi" — closest trail
    if (hasGPS) {
      const sorted = [...withDist].sort((a, b) => a.dist - b.dist);
      const closest = sorted[0];
      if (closest) {
        result.push({
          key: 'nearby',
          label: 'A cote de toi',
          color: COLORS.primaryLight,
          trail: closest.trail,
          distanceKm: closest.dist,
        });
      }
    } else {
      // No GPS — pick a random trail
      const pick = trails[Math.floor(Math.random() * trails.length)];
      result.push({
        key: 'nearby',
        label: 'Decouvrir',
        color: COLORS.primaryLight,
        trail: pick,
        distanceKm: null,
      });
    }

    // 2. "Court et facile" — easy trail < 60 min, closest to user
    const easyTrails = hasGPS
      ? withDist
          .filter((w) => w.trail.difficulty === 'facile' && w.trail.duration_min < 60)
          .sort((a, b) => a.dist - b.dist)
      : trails
          .filter((t) => t.difficulty === 'facile' && t.duration_min < 60);

    if (easyTrails.length > 0) {
      const pick = hasGPS
        ? (easyTrails as { trail: Trail; dist: number }[])[0]
        : null;
      const easyTrail = pick ? pick.trail : (easyTrails as Trail[])[Math.floor(Math.random() * easyTrails.length)];
      // Avoid duplicating the first suggestion
      if (easyTrail.slug !== result[0]?.trail.slug) {
        result.push({
          key: 'easy',
          label: 'Court et facile',
          color: COLORS.info,
          trail: easyTrail,
          distanceKm: pick ? pick.dist : distToUser(easyTrail),
        });
      }
    }

    // 3. "Populaire" — random difficult/expert trail
    const hardTrails = trails.filter(
      (t) => (t.difficulty === 'difficile' || t.difficulty === 'expert') &&
        !result.some((r) => r.trail.slug === t.slug),
    );
    if (hardTrails.length > 0) {
      const pick = hardTrails[Math.floor(Math.random() * hardTrails.length)];
      result.push({
        key: 'popular',
        label: 'Populaire',
        color: COLORS.warm,
        trail: pick,
        distanceKm: distToUser(pick),
      });
    }

    return result;
  }, [trails, userPosition]);

  const handleTrailPress = useCallback((slug: string) => {
    setSelectedSlug(slug);
    setIsSheetOpen(true);
    bottomSheetRef.current?.snapToIndex(0);
  }, []);

  const handleCloseSheet = useCallback(() => {
    setSelectedSlug(null);
    setIsSheetOpen(false);
  }, []);

  const renderSuggestionItem = useCallback(
    ({ item }: { item: SuggestionItem }) => (
      <SuggestionCard item={item} onPress={handleTrailPress} />
    ),
    [handleTrailPress],
  );

  const handleClusterPress = useCallback((coords: [number, number], zoom: number) => {
    mapRef.current?.flyTo(coords, zoom);
  }, []);

  const handleMapPress = useCallback((event: { features?: GeoJSON.Feature[]; geometry?: { coordinates: [number, number] } }) => {
    const feature = event.features?.[0];
    if (!feature) return;

    const isCluster = feature.properties?.cluster === true || feature.properties?.point_count;

    if (isCluster) {
      const coords = (feature.geometry as unknown as { coordinates: [number, number] }).coordinates;
      const count = feature.properties?.point_count ?? 10;
      const zoom = count > 100 ? 11 : count > 20 ? 12 : 14;
      mapRef.current?.flyTo(coords, zoom);
    } else if (feature.properties?.slug) {
      const slug = feature.properties.slug as string;
      handleTrailPress(slug);
    }
  }, [handleTrailPress]);

  const handleGoToDetail = useCallback(() => {
    if (selectedSlug) {
      navigation.navigate('TrailsTab', {
        screen: 'TrailDetail',
        params: { trailId: selectedSlug, trailName: selectedTrail?.name },
      });
    }
  }, [selectedSlug, selectedTrail, navigation]);

  const handleZoomIn = useCallback(async () => {
    if (!mapRef.current) return;
    const [zoom, center] = await Promise.all([
      mapRef.current.getZoom(),
      mapRef.current.getCenter(),
    ]);
    const nextZoom = Math.min(zoom + 1, 17);
    mapRef.current.flyTo(center, nextZoom);
    setCurrentZoom(nextZoom);
  }, []);

  const handleZoomOut = useCallback(async () => {
    if (!mapRef.current) return;
    const [zoom, center] = await Promise.all([
      mapRef.current.getZoom(),
      mapRef.current.getCenter(),
    ]);
    const nextZoom = Math.max(zoom - 1, 8);
    mapRef.current.flyTo(center, nextZoom);
    setCurrentZoom(nextZoom);
  }, []);

  const handleRegionDidChange = useCallback(async () => {
    if (!mapRef.current) return;
    const zoom = await mapRef.current.getZoom();
    setCurrentZoom(zoom);
  }, []);

  return (
    <GestureHandlerRootView style={styles.container}>
      <BaseMap
        ref={mapRef}
        showUserLocation
        userPosition={userPosition}
        mapStyle={currentMapStyle}
        onMapPress={handleMapPress}
        onRegionDidChange={handleRegionDidChange}
      >
        <TrailMarkers onTrailPress={handleTrailPress} onClusterPress={handleClusterPress} />
        {/* --- POI markers (circles >= 12, labels >= 13) --- */}
        {showPOI && pois && pois.features.length > 0 && (
          <Mapbox.ShapeSource id="poi-source" shape={pois}>
            <Mapbox.CircleLayer
              id="poi-circles"
              minZoomLevel={POI_CIRCLE_MIN_ZOOM}
              style={{
                circleRadius: 5,
                circleColor: [
                  'match',
                  ['get', 'poiType'],
                  'restaurant', POI_COLORS.restaurant,
                  'cafe', POI_COLORS.cafe,
                  'bar', POI_COLORS.bar,
                  'fast_food', POI_COLORS.fast_food,
                  'viewpoint', POI_COLORS.viewpoint,
                  'picnic_site', POI_COLORS.picnic_site,
                  'spring', POI_COLORS.spring,
                  'drinking_water', POI_COLORS.drinking_water,
                  'shelter', POI_COLORS.shelter,
                  'alpine_hut', POI_COLORS.alpine_hut,
                  'parking', POI_COLORS.parking,
                  'toilets', POI_COLORS.toilets,
                  'waterfall', POI_COLORS.waterfall,
                  'peak', POI_COLORS.peak,
                  '#78716c',
                ] as unknown as string,
                circleStrokeWidth: 1.5,
                circleStrokeColor: COLORS.white,
                circleOpacity: 0.9,
              }}
            />
            <Mapbox.SymbolLayer
              id="poi-labels"
              minZoomLevel={POI_LABEL_MIN_ZOOM}
              style={{
                textField: ['get', 'name'],
                textSize: 11,
                textOffset: [0, 1.2],
                textAnchor: 'top',
                textColor: COLORS.textPrimary,
                textHaloColor: COLORS.white,
                textHaloWidth: 1.5,
                textMaxWidth: 10,
                textOptional: true,
              }}
            />
          </Mapbox.ShapeSource>
        )}
      </BaseMap>
      {/* --- Top right: map style toggle (cyclic: IGN -> Satellite -> Positron) --- */}
      <TouchableOpacity
        style={styles.mapStyleToggle}
        onPress={handleToggleMapStyle}
        activeOpacity={0.7}
        accessibilityLabel={`Passer en ${nextStyleLabel}`}
      >
        <Ionicons
          name={currentStyleIcon as keyof typeof Ionicons.glyphMap}
          size={22}
          color={COLORS.textPrimary}
        />
      </TouchableOpacity>

      {/* --- Top right below style toggle: POI visibility toggle --- */}
      <TouchableOpacity
        style={styles.poiToggle}
        onPress={handleTogglePOI}
        activeOpacity={0.7}
        accessibilityLabel={showPOI ? 'Masquer les points d\'interet' : 'Afficher les points d\'interet'}
      >
        <Ionicons
          name={showPOI ? 'eye-outline' : 'eye-off-outline'}
          size={22}
          color={showPOI ? COLORS.primaryLight : COLORS.textMuted}
        />
      </TouchableOpacity>

      {/* --- Right middle: zoom controls --- */}
      <View style={styles.zoomControls}>
        <Pressable
          style={styles.zoomButton}
          onPress={handleZoomIn}
          accessibilityLabel="Zoomer"
          accessibilityRole="button"
        >
          <Ionicons name="add" size={24} color={COLORS.textPrimary} />
        </Pressable>
        <View style={styles.zoomSeparator} />
        <Pressable
          style={styles.zoomButton}
          onPress={handleZoomOut}
          accessibilityLabel="Dezoomer"
          accessibilityRole="button"
        >
          <Ionicons name="remove" size={24} color={COLORS.textPrimary} />
        </Pressable>
      </View>

      {/* --- Zoom hint (visible when zoomed out) --- */}
      {currentZoom < 11 && (
        <Text style={styles.zoomHint}>Zoomez pour voir les sentiers</Text>
      )}

      {/* --- Top center: loading indicator --- */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={COLORS.primaryLight} />
          <Text style={styles.loadingText}>Chargement des sentiers...</Text>
        </View>
      )}

      {/* --- Top left/center: error banner --- */}
      {error && !isLoading && (
        <View style={styles.errorBanner}>
          <Ionicons name="cloud-offline-outline" size={16} color={COLORS.warning} />
          <Text style={styles.errorBannerText}>Impossible de charger les sentiers. Verifie ta connexion.</Text>
        </View>
      )}

      {/* --- Bottom: suggestion cards (hidden when bottom sheet is open) --- */}
      {!isSheetOpen && !isLoading && suggestions.length > 0 && (
        <FlatList
          data={suggestions}
          renderItem={renderSuggestionItem}
          keyExtractor={(item) => item.key}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={suggestionStyles.list}
          style={suggestionStyles.container}
        />
      )}
      {selectedTrail && (
        <BottomSheet
          ref={bottomSheetRef}
          index={0}
          snapPoints={snapPoints}
          enablePanDownToClose
          onClose={handleCloseSheet}
          backgroundStyle={styles.sheetBackground}
          handleIndicatorStyle={styles.sheetIndicator}
        >
          <BottomSheetView style={styles.sheetContent}>
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardName} numberOfLines={2}>
                  {selectedTrail.name}
                </Text>
                <DifficultyBadge difficulty={selectedTrail.difficulty} />
              </View>
              <Text style={styles.cardRegion}>{selectedTrail.region}</Text>
              <View style={styles.cardStats}>
                <View style={styles.cardStat}>
                  <Ionicons name="walk-outline" size={14} color={COLORS.textSecondary} />
                  <Text style={styles.cardStatText}>{formatDistance(selectedTrail.distance_km)}</Text>
                </View>
                <View style={styles.cardStatSeparator} />
                <View style={styles.cardStat}>
                  <Ionicons name="trending-up-outline" size={14} color={COLORS.textSecondary} />
                  <Text style={styles.cardStatText}>{formatElevation(selectedTrail.elevation_gain_m)}</Text>
                </View>
                <View style={styles.cardStatSeparator} />
                <View style={styles.cardStat}>
                  <Ionicons name="time-outline" size={14} color={COLORS.textSecondary} />
                  <Text style={styles.cardStatText}>{formatDuration(selectedTrail.duration_min)}</Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.detailButton}
                onPress={handleGoToDetail}
                activeOpacity={0.7}
                accessibilityLabel={`Voir la fiche du sentier ${selectedTrail.name}`}
              >
                <Text style={styles.detailButtonText}>Voir la fiche</Text>
                <Ionicons name="arrow-forward" size={16} color={COLORS.white} />
              </TouchableOpacity>
            </View>
          </BottomSheetView>
        </BottomSheet>
      )}
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  mapStyleToggle: {
    position: 'absolute',
    top: SPACING.xl + 40,
    right: SPACING.md,
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.surface + 'E6',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  poiToggle: {
    position: 'absolute',
    top: SPACING.xl + 40 + 48 + SPACING.sm,
    right: SPACING.md,
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.surface + 'E6',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  zoomControls: {
    position: 'absolute',
    right: SPACING.md,
    top: SPACING.xl + 40 + 48 + SPACING.sm + 48 + SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.surface + 'E6',
    elevation: 4,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    overflow: 'hidden',
  },
  zoomButton: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  zoomSeparator: {
    height: 1,
    backgroundColor: COLORS.border,
    marginHorizontal: SPACING.sm,
  },
  zoomHint: {
    position: 'absolute',
    right: SPACING.md,
    top: SPACING.xl + 40 + 48 + SPACING.sm + 48 + SPACING.sm + 48 + 1 + 48 + SPACING.sm,
    width: 48,
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 14,
  },
  loadingOverlay: {
    position: 'absolute',
    top: SPACING.xl + 40,
    alignSelf: 'center',
    backgroundColor: COLORS.surface + 'E6',
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  loadingText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
  },
  errorBanner: {
    position: 'absolute',
    top: SPACING.xl + 40,
    left: SPACING.md,
    right: SPACING.md,
    backgroundColor: COLORS.warning + '20',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  errorBannerText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.warning,
    flex: 1,
  },
  sheetBackground: { backgroundColor: COLORS.background },
  sheetIndicator: { backgroundColor: COLORS.textMuted },
  sheetContent: { paddingBottom: SPACING.md },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginHorizontal: SPACING.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  cardName: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
    flex: 1,
    marginRight: SPACING.sm,
  },
  cardRegion: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textMuted,
    marginBottom: SPACING.sm,
  },
  cardStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  cardStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  cardStatSeparator: {
    width: 1,
    height: 14,
    backgroundColor: COLORS.border,
    marginHorizontal: SPACING.sm,
  },
  cardStatText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
  },
  detailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primaryDark,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.sm + 2,
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
    minHeight: 48,
  },
  detailButtonText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.white,
  },
});

const suggestionStyles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: SPACING.md,
    left: 0,
    right: 0,
  },
  list: {
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
  },
  card: {
    width: 140,
    minHeight: 80,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
    justifyContent: 'center',
    elevation: 4,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  label: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: SPACING.xs,
  },
  trailName: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  distance: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
    marginTop: SPACING.xs,
  },
});
