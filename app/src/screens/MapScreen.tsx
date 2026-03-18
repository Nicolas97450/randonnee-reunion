import { useCallback, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { GestureHandlerRootView, TouchableOpacity } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import BaseMap, { type BaseMapHandle } from '@/components/BaseMap';
import TrailMarkers from '@/components/TrailMarkers';
import { useSupabaseTrails } from '@/hooks/useSupabaseTrails';
import { COLORS, FONT_SIZE, SPACING, BORDER_RADIUS } from '@/constants';
import type { TrailStackParamList } from '@/navigation/types';
import DifficultyBadge from '@/components/DifficultyBadge';
import { formatDistance } from '@/lib/formatters';

export default function MapScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<TrailStackParamList>>();
  const { trails } = useSupabaseTrails();
  const mapRef = useRef<BaseMapHandle>(null);
  const bottomSheetRef = useRef<BottomSheet>(null);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const snapPoints = useMemo(() => ['25%'], []);

  const selectedTrail = useMemo(() => {
    if (!selectedSlug) return null;
    return trails.find((t) => t.slug === selectedSlug) ?? null;
  }, [selectedSlug, trails]);

  const handleTrailPress = useCallback((slug: string) => {
    setSelectedSlug(slug);
    bottomSheetRef.current?.snapToIndex(0);
  }, []);

  const handleCloseSheet = useCallback(() => {
    setSelectedSlug(null);
  }, []);

  const handleClusterPress = useCallback((coords: [number, number], zoom: number) => {
    mapRef.current?.flyTo(coords, zoom);
  }, []);

  const handleGoToDetail = useCallback(() => {
    if (selectedSlug) {
      // MapScreen is a direct tab child — no getParent needed
      (navigation as any).navigate('TrailsTab', {
        screen: 'TrailDetail',
        params: { trailId: selectedSlug },
      });
    }
  }, [selectedSlug, navigation]);

  return (
    <GestureHandlerRootView style={styles.container}>
      <BaseMap ref={mapRef} showUserLocation>
        <TrailMarkers onTrailPress={handleTrailPress} onClusterPress={handleClusterPress} />
      </BaseMap>
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
            <TouchableOpacity
              style={styles.card}
              onPress={handleGoToDetail}
              activeOpacity={0.7}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.cardName} numberOfLines={1}>
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
                <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
              </View>
            </TouchableOpacity>
          </BottomSheetView>
        </BottomSheet>
      )}
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
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
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cardStatText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
  },
});
