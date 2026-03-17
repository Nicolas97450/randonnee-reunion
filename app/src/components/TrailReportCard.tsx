import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT_SIZE, SPACING, BORDER_RADIUS } from '@/constants';
import type { TrailReport } from '@/types';
import { REPORT_LABELS } from '@/types';

interface Props {
  report: TrailReport;
}

export default function TrailReportCard({ report }: Props) {
  const config = REPORT_LABELS[report.report_type];
  const timeAgo = getTimeAgo(report.created_at);

  return (
    <View style={[styles.card, { borderLeftColor: config.color }]}>
      <View style={styles.header}>
        <Ionicons name={config.icon as keyof typeof Ionicons.glyphMap} size={18} color={config.color} />
        <Text style={[styles.type, { color: config.color }]}>{config.label}</Text>
        <Text style={styles.time}>{timeAgo}</Text>
      </View>
      {report.message && <Text style={styles.message}>{report.message}</Text>}
      <Text style={styles.author}>
        Par {report.user?.username ?? 'un randonneur'}
      </Text>
    </View>
  );
}

function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `il y a ${minutes}min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `il y a ${hours}h`;
  return `il y a ${Math.floor(hours / 24)}j`;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.md,
    borderLeftWidth: 4,
    padding: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  type: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
    flex: 1,
  },
  time: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
  },
  message: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
    marginLeft: 26,
  },
  author: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
    marginTop: SPACING.xs,
    marginLeft: 26,
  },
});
