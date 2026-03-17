import { useCallback, useMemo, useState } from 'react';
import { StyleSheet, Text, View, FlatList, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import BaseMap from '@/components/BaseMap';
import TrailCard from '@/components/TrailCard';
import { MOCK_TRAILS } from '@/lib/mockTrails';
import { COLORS, FONT_SIZE, SPACING } from '@/constants';
import type { TrailStackParamList } from '@/navigation/types';
import type { Trail } from '@/types';

type TrailItem = Omit<Trail, 'id' | 'created_at' | 'updated_at'> & { id?: string };

export default function MapScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<TrailStackParamList>>();

  const handleTrailPress = useCallback(
    (trail: TrailItem) => {
      navigation.getParent()?.navigate('TrailsTab', {
        screen: 'TrailDetail',
        params: { trailId: trail.slug },
      });
    },
    [navigation],
  );

  return (
    <View style={styles.container}>
      {/* Map placeholder */}
      <View style={styles.mapSection}>
        <BaseMap />
      </View>

      {/* Trail list below map */}
      <View style={styles.listSection}>
        <Text style={styles.listTitle}>Sentiers a proximite</Text>
        <FlatList
          data={MOCK_TRAILS.slice(0, 5)}
          renderItem={({ item }) => (
            <TrailCard trail={item} onPress={() => handleTrailPress(item)} />
          )}
          keyExtractor={(item) => item.slug}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  mapSection: {
    height: 250,
  },
  listSection: {
    flex: 1,
    paddingTop: SPACING.md,
  },
  listTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
  },
});
