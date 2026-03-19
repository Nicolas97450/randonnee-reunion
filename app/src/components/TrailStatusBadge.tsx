import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT_SIZE, SPACING, BORDER_RADIUS } from '@/constants';
import type { TrailStatus } from '@/types';

const STATUS_CONFIG: Record<
  TrailStatus,
  { color: string; icon: keyof typeof Ionicons.glyphMap; label: string }
> = {
  ouvert: { color: COLORS.statusOpen, icon: 'checkmark-circle', label: 'Ouvert' },
  ferme: { color: COLORS.statusClosed, icon: 'close-circle', label: 'Ferme' },
  degrade: { color: COLORS.statusDegraded, icon: 'warning', label: 'Degrade' },
  inconnu: { color: COLORS.statusUnknown, icon: 'help-circle', label: 'Inconnu' },
};

interface Props {
  status: TrailStatus;
  message?: string | null;
  compact?: boolean;
}

export default function TrailStatusBadge({ status, message, compact = false }: Props) {
  const config = STATUS_CONFIG[status];

  if (compact) {
    return (
      <View style={[styles.badgeCompact, { backgroundColor: config.color + '20' }]}>
        <Ionicons name={config.icon} size={14} color={config.color} />
        <Text style={[styles.badgeText, { color: config.color }]}>{config.label}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { borderLeftColor: config.color }]}>
      <View style={styles.header}>
        <Ionicons name={config.icon} size={20} color={config.color} />
        <Text style={[styles.label, { color: config.color }]}>
          Etat ONF : {config.label}
        </Text>
      </View>
      {message && <Text style={styles.message}>{message}</Text>}
      {status === 'ferme' && (
        <Text style={styles.warning}>
          Ce sentier est actuellement ferme. Ne pas s'y engager.
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    borderLeftWidth: 4,
    padding: SPACING.md,
    gap: SPACING.xs,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  label: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
  },
  message: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginLeft: 28,
  },
  warning: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.danger,
    fontWeight: '600',
    marginLeft: 28,
  },
  badgeCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  badgeText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
  },
});
