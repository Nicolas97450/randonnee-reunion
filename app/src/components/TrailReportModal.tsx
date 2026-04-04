import { useMemo } from 'react';
import { StyleSheet, Modal, View, Pressable, Text, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT_SIZE, SPACING, BORDER_RADIUS } from '@/constants';
import { REPORT_LABELS } from '@/types';
import type { TrailReport } from '@/types';

type TrailReportModalProps = {
  visible: boolean;
  selectedReport: TrailReport | null;
  onClose: () => void;
};

export default function TrailReportModal({
  visible,
  selectedReport,
  onClose,
}: TrailReportModalProps) {
  const reportData = useMemo(() => {
    if (!selectedReport) return null;
    const config = REPORT_LABELS[selectedReport.report_type];
    const diff = Date.now() - new Date(selectedReport.created_at).getTime();
    const minutes = Math.floor(diff / 60000);
    const timeAgo = minutes < 60
      ? `il y a ${minutes}min`
      : minutes < 1440
        ? `il y a ${Math.floor(minutes / 60)}h`
        : `il y a ${Math.floor(minutes / 1440)}j`;
    return { config, timeAgo };
  }, [selectedReport]);

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <Pressable
        style={styles.modalOverlay}
        onPress={onClose}
        accessibilityLabel="Fermer le detail du signalement"
      >
        {selectedReport && reportData && (
          <View style={styles.reportDetailCard}>
            <View style={styles.reportDetailHeader}>
              <Ionicons
                name={reportData.config.icon as keyof typeof Ionicons.glyphMap}
                size={22}
                color={reportData.config.color}
              />
              <Text style={[styles.reportDetailType, { color: reportData.config.color }]}>
                {reportData.config.label}
              </Text>
              <Text style={styles.reportDetailTime}>{reportData.timeAgo}</Text>
              <Pressable
                onPress={onClose}
                accessibilityLabel="Fermer"
              >
                <Ionicons name="close" size={22} color={COLORS.textMuted} />
              </Pressable>
            </View>
            {selectedReport.message && (
              <Text style={styles.reportDetailMessage}>{selectedReport.message}</Text>
            )}
            {selectedReport.photo_url && (
              <Image
                source={{ uri: selectedReport.photo_url }}
                style={styles.reportDetailPhoto}
                resizeMode="cover"
              />
            )}
            <Text style={styles.reportDetailAuthor}>
              Par {selectedReport.user?.username ?? 'un randonneur'}
            </Text>
          </View>
        )}
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.black + '80',
    justifyContent: 'flex-end',
  },
  reportDetailCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginHorizontal: SPACING.lg,
    marginTop: 'auto',
    marginBottom: 'auto',
    maxWidth: 400,
    alignSelf: 'center',
    width: '85%',
  },
  reportDetailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  reportDetailType: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    flex: 1,
  },
  reportDetailTime: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
  },
  reportDetailMessage: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  reportDetailPhoto: {
    width: '100%',
    height: 180,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.sm,
  },
  reportDetailAuthor: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
  },
});
