import React, { useState } from 'react';
import { StyleSheet, Text, View, Image, Pressable, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT_SIZE, SPACING, BORDER_RADIUS } from '@/constants';
import type { TrailReport } from '@/types';
import { REPORT_LABELS } from '@/types';

interface Props {
  report: TrailReport;
}

const TrailReportCard = React.memo(function TrailReportCard({ report }: Props) {
  const config = REPORT_LABELS[report.report_type];
  const timeAgo = getTimeAgo(report.created_at);
  const [showFullPhoto, setShowFullPhoto] = useState(false);

  return (
    <View style={[styles.card, { borderLeftColor: config.color }]}>
      <View style={styles.header}>
        <Ionicons name={config.icon as keyof typeof Ionicons.glyphMap} size={18} color={config.color} />
        <Text style={[styles.type, { color: config.color }]}>{config.label}</Text>
        <Text style={styles.time}>{timeAgo}</Text>
      </View>
      {report.message && <Text style={styles.message}>{report.message}</Text>}
      {report.photo_url && (
        <Pressable
          onPress={() => setShowFullPhoto(true)}
          accessibilityLabel="Voir la photo du signalement en plein ecran"
        >
          <Image source={{ uri: report.photo_url }} style={styles.photo} />
        </Pressable>
      )}
      <Text style={styles.author}>
        Par {report.user?.username ?? 'un randonneur'}
      </Text>

      {/* Full-screen photo modal */}
      {report.photo_url && (
        <Modal visible={showFullPhoto} transparent animationType="fade">
          <Pressable
            style={styles.photoModal}
            onPress={() => setShowFullPhoto(false)}
            accessibilityLabel="Fermer la photo"
          >
            <Image source={{ uri: report.photo_url }} style={styles.photoFull} resizeMode="contain" />
            <View style={styles.photoCloseButton}>
              <Ionicons name="close-circle" size={32} color={COLORS.white} />
            </View>
          </Pressable>
        </Modal>
      )}
    </View>
  );
});

export default TrailReportCard;

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
  photo: {
    width: '100%',
    height: 140,
    borderRadius: BORDER_RADIUS.sm,
    marginTop: SPACING.sm,
    marginLeft: 26,
  },
  photoModal: {
    flex: 1,
    backgroundColor: COLORS.overlayHeavy,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoFull: {
    width: '90%',
    height: '70%',
  },
  photoCloseButton: {
    position: 'absolute',
    top: 60,
    right: 20,
  },
});
