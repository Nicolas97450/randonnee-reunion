import { StyleSheet, Text, Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT_SIZE, SPACING, BORDER_RADIUS } from '@/constants';
import { useOfflineStore } from '@/stores/offlineStore';

interface Props {
  trailSlug: string;
  tilesSizeMb: number | null;
  tilesUrl: string | null;
}

export default function DownloadButton({ trailSlug, tilesSizeMb, tilesUrl }: Props) {
  const { isDownloaded, getDownloadProgress, downloadMap, deleteMap } = useOfflineStore();

  const downloaded = isDownloaded(trailSlug);
  const progress = getDownloadProgress(trailSlug);
  const isDownloading = progress !== null;

  const handlePress = async () => {
    if (downloaded) {
      await deleteMap(trailSlug);
    } else if (!isDownloading && tilesUrl) {
      await downloadMap(trailSlug, tilesUrl, tilesSizeMb ?? 0);
    }
  };

  if (isDownloading) {
    const percent = Math.round((progress ?? 0) * 100);
    return (
      <View style={styles.container}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${percent}%` }]} />
        </View>
        <Text style={styles.progressText}>{percent}%</Text>
      </View>
    );
  }

  if (downloaded) {
    return (
      <Pressable style={[styles.button, styles.buttonDownloaded]} onPress={handlePress}>
        <Ionicons name="checkmark-circle" size={18} color={COLORS.success} />
        <Text style={[styles.buttonText, styles.textDownloaded]}>Carte offline</Text>
      </Pressable>
    );
  }

  return (
    <Pressable
      style={[styles.button, !tilesUrl && styles.buttonDisabled]}
      onPress={handlePress}
      disabled={!tilesUrl}
    >
      <Ionicons name="download-outline" size={18} color={COLORS.white} />
      <Text style={styles.buttonText}>
        Telecharger{tilesSizeMb ? ` (${tilesSizeMb} Mo)` : ''}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.sm,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: COLORS.border,
    borderRadius: BORDER_RADIUS.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.full,
  },
  progressText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    width: 40,
    textAlign: 'right',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  buttonDownloaded: {
    backgroundColor: COLORS.primary + '15',
    borderWidth: 1,
    borderColor: COLORS.success,
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  buttonText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.white,
  },
  textDownloaded: {
    color: COLORS.success,
  },
});
