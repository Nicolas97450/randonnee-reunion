import { StyleSheet, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT_SIZE, SPACING, BORDER_RADIUS } from '@/constants';
import { useProgressStore } from '@/stores/progressStore';

interface Props {
  height?: number;
}

export default function IslandProgressMap({ height = 300 }: Props) {
  const { zoneProgress, overallProgress } = useProgressStore();
  const completedZones = zoneProgress.filter((z) => z.progress >= 1).length;

  return (
    <View style={[styles.container, { height }]}>
      <Ionicons name="map" size={64} color={COLORS.primary + '40'} />
      <Text style={styles.progress}>{Math.round(overallProgress * 100)}%</Text>
      <Text style={styles.label}>de l'ile exploree</Text>
      <Text style={styles.zones}>{completedZones}/{zoneProgress.length} zones completees</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  progress: {
    fontSize: 48,
    fontWeight: '800',
    color: COLORS.primary,
  },
  label: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
  },
  zones: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textMuted,
    marginTop: SPACING.sm,
  },
});
