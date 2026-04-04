import { StyleSheet, Text, View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT_SIZE, SPACING, BORDER_RADIUS } from '@/constants';

interface Props {
  feature: string;
  onSubscribe?: () => void;
  onClose: () => void;
}

export default function PremiumPaywall({ feature, onSubscribe, onClose }: Props) {
  return (
    <View style={styles.container}>
      <Pressable style={styles.closeButton} onPress={onClose} accessibilityLabel="Fermer">
        <Ionicons name="close" size={24} color={COLORS.textMuted} />
      </Pressable>

      <View style={styles.iconContainer}>
        <Ionicons name="diamond" size={48} color={COLORS.warm} />
      </View>

      <Text style={styles.title}>Passe en Premium</Text>
      <Text style={styles.subtitle}>
        {feature} est reserve aux membres Premium.
      </Text>

      {/* Avantages */}
      <View style={styles.benefits}>
        <BenefitRow icon="map" text="Cartes offline illimitees" />
        <BenefitRow icon="people" text="Sorties illimitees" />
        <BenefitRow icon="stats-chart" text="Stats avancees (km, denivele cumule)" />
        <BenefitRow icon="download" text="Export GPX de tes traces" />
        <BenefitRow icon="time" text="Historique complet" />
      </View>

      {/* Prix */}
      <View style={styles.pricing}>
        <Pressable style={styles.priceCard} onPress={onSubscribe} accessibilityLabel="Abonnement annuel a 19.99 euros par an">
          <Text style={styles.priceLabel}>Annuel</Text>
          <Text style={styles.priceValue}>19.99 EUR/an</Text>
          <Text style={styles.priceSub}>soit 1.67 EUR/mois — Economie 44%</Text>
        </Pressable>

        <Pressable style={[styles.priceCard, styles.priceCardSecondary]} onPress={onSubscribe} accessibilityLabel="Abonnement mensuel a 2.99 euros par mois">
          <Text style={styles.priceLabel}>Mensuel</Text>
          <Text style={[styles.priceValue, styles.priceValueSecondary]}>2.99 EUR/mois</Text>
          <Text style={styles.priceSub}>Sans engagement</Text>
        </Pressable>
      </View>

      <Text style={styles.legal}>
        Paiement via Google Play / App Store. Annulable a tout moment.
        En souscrivant tu acceptes les CGU et la politique de confidentialite.
      </Text>
    </View>
  );
}

function BenefitRow({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) {
  return (
    <View style={styles.benefitRow}>
      <Ionicons name={icon} size={18} color={COLORS.primary} />
      <Text style={styles.benefitText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: SPACING.xl,
    backgroundColor: COLORS.background,
  },
  closeButton: {
    position: 'absolute',
    top: SPACING.md,
    right: SPACING.md,
    zIndex: 10,
  },
  iconContainer: {
    alignSelf: 'center',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.warm + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: '800',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.sm,
    marginBottom: SPACING.xl,
  },
  benefits: {
    gap: SPACING.sm,
    marginBottom: SPACING.xl,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  benefitText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textPrimary,
  },
  pricing: {
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  priceCard: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.md,
    alignItems: 'center',
  },
  priceCardSecondary: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  priceLabel: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  priceValue: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '800',
    color: COLORS.white,
    marginTop: 2,
  },
  priceValueSecondary: {
    color: COLORS.textPrimary,
  },
  priceSub: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  legal: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 16,
  },
});
