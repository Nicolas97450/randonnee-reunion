import { useCallback, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import BaseMap from '@/components/BaseMap';
import TrailMarkers from '@/components/TrailMarkers';
import TrailCard from '@/components/TrailCard';
import { useSupabaseTrails } from '@/hooks/useSupabaseTrails';
import { COLORS, SPACING } from '@/constants';
import type { TrailStackParamList } from '@/navigation/types';
import type { Trail } from '@/types';

type TrailItem = Omit<Trail, 'id' | 'created_at' | 'updated_at'> & { id?: string };

export default function MapScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<TrailStackParamList>>();
  const { trails } = useSupabaseTrails();
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

  const handleGoToDetail = useCallback(() => {
    if (selectedSlug) {
      navigation.getParent()?.navigate('TrailsTab', {
        screen: 'TrailDetail',
        params: { trailId: selectedSlug },
      });
    }
  }, [selectedSlug, navigation]);

  return (
    <GestureHandlerRootView style={styles.container}>
      <BaseMap showUserLocation>
        <TrailMarkers onTrailPress={handleTrailPress} />
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
            <Pressable onPress={handleGoToDetail}>
              <TrailCard trail={selectedTrail} />
            </Pressable>
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
});
