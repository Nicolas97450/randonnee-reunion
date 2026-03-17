import { StyleSheet, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT_SIZE, SPACING } from '@/constants';

// MapLibre temporarily disabled for build compatibility
// Will be re-enabled once native build issues are resolved

interface Props {
  children?: React.ReactNode;
  centerCoordinate?: [number, number];
  zoomLevel?: number;
  showUserLocation?: boolean;
  onPress?: (feature: unknown) => void;
}

export default function BaseMap({ children }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.placeholder}>
        <Ionicons name="map-outline" size={48} color={COLORS.textMuted} />
        <Text style={styles.text}>Carte MapLibre</Text>
        <Text style={styles.subtext}>Disponible dans la prochaine version</Text>
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  text: {
    fontSize: FONT_SIZE.lg,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  subtext: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textMuted,
  },
});
