import { StyleSheet, Text, View, Pressable, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT_SIZE, SPACING, BORDER_RADIUS } from '@/constants';
import { useThemeStore } from '@/stores/themeStore';
import { useOfflineStore } from '@/stores/offlineStore';

export default function SettingsScreen() {
  const { mode, setMode, isDark } = useThemeStore();
  const { maps, getTotalSizeMb } = useOfflineStore();
  const totalSize = getTotalSizeMb();

  return (
    <View style={styles.container}>
      {/* Theme */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Apparence</Text>

        <View style={styles.row}>
          <Text style={styles.rowLabel}>Mode sombre</Text>
          <Switch
            value={isDark}
            onValueChange={(value) => setMode(value ? 'dark' : 'light')}
            trackColor={{ false: COLORS.border, true: COLORS.primary + '60' }}
            thumbColor={isDark ? COLORS.primary : '#f4f3f4'}
          />
        </View>

        <Pressable
          style={styles.row}
          onPress={() => setMode('system')}
        >
          <Text style={styles.rowLabel}>Suivre le systeme</Text>
          {mode === 'system' && (
            <Ionicons name="checkmark" size={20} color={COLORS.primary} />
          )}
        </Pressable>
      </View>

      {/* Offline maps */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Cartes offline</Text>

        <View style={styles.row}>
          <Text style={styles.rowLabel}>Cartes telechargees</Text>
          <Text style={styles.rowValue}>{maps.length}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.rowLabel}>Espace utilise</Text>
          <Text style={styles.rowValue}>
            {totalSize > 0 ? `${totalSize.toFixed(1)} Mo` : '0 Mo'}
          </Text>
        </View>
      </View>

      {/* About */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>A propos</Text>

        <View style={styles.row}>
          <Text style={styles.rowLabel}>Version</Text>
          <Text style={styles.rowValue}>1.0.0</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.rowLabel}>Donnees sentiers</Text>
          <Text style={styles.rowValue}>OMF / OpenStreetMap</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingTop: SPACING.md,
  },
  section: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  rowLabel: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textPrimary,
  },
  rowValue: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
  },
});
