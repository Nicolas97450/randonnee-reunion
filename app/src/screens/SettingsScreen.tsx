import { StyleSheet, Text, View, Pressable, Switch, Alert, Linking, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT_SIZE, SPACING, BORDER_RADIUS } from '@/constants';
import { useThemeStore } from '@/stores/themeStore';
import { useOfflineStore } from '@/stores/offlineStore';
import { usePremiumStore } from '@/stores/premiumStore';
import { useAuth } from '@/hooks/useAuth';
import { useAccountActions } from '@/hooks/useAccountActions';

export default function SettingsScreen() {
  const { mode, setMode, isDark } = useThemeStore();
  const { maps, getTotalSizeMb } = useOfflineStore();
  const { isPremium, isBetaMode } = usePremiumStore();
  const { user } = useAuth();
  const { exportMyData, deleteMyAccount } = useAccountActions();
  const totalSize = getTotalSizeMb();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Premium */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Abonnement</Text>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Statut</Text>
          <Text style={[styles.rowValue, { color: isPremium || isBetaMode ? COLORS.primary : COLORS.textMuted }]}>
            {isBetaMode ? 'Beta (tout inclus)' : isPremium ? 'Premium' : 'Gratuit'}
          </Text>
        </View>
        {!isPremium && !isBetaMode && (
          <Pressable style={styles.premiumButton} accessibilityLabel="Passer en Premium">
            <Ionicons name="diamond" size={18} color={COLORS.warm} />
            <Text style={styles.premiumButtonText}>Passer en Premium — 19.99 EUR/an</Text>
          </Pressable>
        )}
      </View>

      {/* Theme */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Apparence</Text>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Mode sombre</Text>
          <Switch
            value={isDark}
            onValueChange={(value) => setMode(value ? 'dark' : 'light')}
            trackColor={{ false: COLORS.border, true: COLORS.primary + '60' }}
            thumbColor={isDark ? COLORS.primary : COLORS.white}
          />
        </View>
        <Pressable style={styles.row} onPress={() => setMode('system')} accessibilityLabel="Suivre le theme du systeme">
          <Text style={styles.rowLabel}>Suivre le systeme</Text>
          {mode === 'system' && <Ionicons name="checkmark" size={20} color={COLORS.primary} />}
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

      {/* Donnees personnelles (RGPD) */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Mes donnees</Text>

        <Pressable
          style={styles.row}
          onPress={() => {
            if (user) exportMyData(user.id);
          }}
          accessibilityLabel="Exporter mes donnees"
        >
          <Ionicons name="download-outline" size={18} color={COLORS.textSecondary} />
          <Text style={[styles.rowLabel, { flex: 1, marginLeft: SPACING.sm }]}>
            Exporter mes donnees
          </Text>
          <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
        </Pressable>

        <Pressable
          style={styles.row}
          onPress={() => Linking.openURL('https://randonnee-reunion.re/confidentialite')}
          accessibilityLabel="Politique de confidentialite"
        >
          <Ionicons name="document-text-outline" size={18} color={COLORS.textSecondary} />
          <Text style={[styles.rowLabel, { flex: 1, marginLeft: SPACING.sm }]}>
            Politique de confidentialite
          </Text>
          <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
        </Pressable>

        <Pressable
          style={styles.row}
          onPress={() => Linking.openURL('https://randonnee-reunion.re/cgu')}
          accessibilityLabel="Conditions generales d'utilisation"
        >
          <Ionicons name="reader-outline" size={18} color={COLORS.textSecondary} />
          <Text style={[styles.rowLabel, { flex: 1, marginLeft: SPACING.sm }]}>
            Conditions generales d'utilisation
          </Text>
          <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
        </Pressable>
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
          <Text style={styles.rowValue}>Randopitons.re / ONF</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Meteo</Text>
          <Text style={styles.rowValue}>Open-Meteo</Text>
        </View>
      </View>

      {/* Danger zone */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: COLORS.danger }]}>Zone dangereuse</Text>
        <Pressable
          style={styles.dangerRow}
          onPress={() => {
            if (user) deleteMyAccount(user.id);
          }}
          accessibilityLabel="Supprimer mon compte"
        >
          <Ionicons name="trash-outline" size={18} color={COLORS.danger} />
          <Text style={styles.dangerText}>Supprimer mon compte</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingTop: SPACING.md,
  },
  content: {
    paddingBottom: SPACING.xxl,
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
  premiumButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.warm + '15',
    borderWidth: 1,
    borderColor: COLORS.warm + '40',
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.md,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.sm,
  },
  premiumButtonText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.warm,
  },
  dangerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.card,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  dangerText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.danger,
  },
});
