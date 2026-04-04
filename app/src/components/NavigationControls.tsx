import { useCallback } from 'react';
import { StyleSheet, View, Pressable, Alert, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS } from '@/constants';

type NavigationControlsProps = {
  isTracking: boolean;
  userMovedMap: boolean;
  headingUp: boolean;
  computedHeading: number;
  isSharing: boolean;
  onRecenter: () => void;
  onHeadingToggle: (value: boolean) => void;
  onSOSPress: () => void;
  onReportPress: () => void;
  onSharePress: (action: 'start' | 'stop', trailId: string) => void;
  trackingScale: Animated.Value;
  trailId: string;
};

export default function NavigationControls({
  isTracking,
  userMovedMap,
  headingUp,
  computedHeading,
  isSharing,
  onRecenter,
  onHeadingToggle,
  onSOSPress,
  onReportPress,
  onSharePress,
  trailId,
}: NavigationControlsProps) {
  const handleShareToggle = useCallback(() => {
    if (isSharing) {
      Alert.alert(
        'Arreter le partage',
        'Tes proches ne pourront plus suivre ta position.',
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Arreter',
            style: 'destructive',
            onPress: () => onSharePress('stop', trailId),
          },
        ],
      );
    } else {
      Alert.alert(
        'Partager ta position en direct ?',
        'Un lien unique sera copie dans ton presse-papier. Tes proches pourront suivre ta rando en temps reel.',
        [
          { text: 'Annuler', style: 'cancel' },
          { text: 'Partager', onPress: () => onSharePress('start', trailId) },
        ],
      );
    }
  }, [isSharing, onSharePress, trailId]);

  return (
    <View style={styles.container}>
      {/* SOS + Report buttons (top right) */}
      <View style={styles.mapOverlayActions}>
        <Pressable
          style={styles.mapOverlayBtn}
          onPress={onSOSPress}
          accessibilityLabel="Appeler les secours"
        >
          <Ionicons name="alert-circle" size={20} color={COLORS.danger} />
        </Pressable>
        <Pressable
          style={styles.mapOverlayBtn}
          onPress={onReportPress}
          accessibilityLabel="Signaler un probleme sur le sentier"
        >
          <Ionicons name="flag-outline" size={20} color={COLORS.warning} />
        </Pressable>
        {isTracking && (
          <Pressable
            style={[styles.mapOverlayBtn, isSharing && styles.mapOverlayBtnActive]}
            onPress={handleShareToggle}
            accessibilityLabel={isSharing ? 'Arreter le partage de position' : 'Partager ma position en direct'}
          >
            <Ionicons
              name={isSharing ? 'radio' : 'share-outline'}
              size={18}
              color={isSharing ? COLORS.white : COLORS.info}
            />
          </Pressable>
        )}
      </View>

      {/* Recenter button (bottom right) */}
      {(isTracking && userMovedMap) || (!isTracking && true) ? (
        <Pressable
          style={styles.recenterButton}
          onPress={onRecenter}
          accessibilityLabel="Recentrer la carte sur ma position"
        >
          <Ionicons name="locate" size={24} color={COLORS.primaryLight} />
        </Pressable>
      ) : null}

      {/* Compass button (bottom left, visible during tracking) */}
      {isTracking && (
        <Pressable
          style={[
            styles.compassButton,
            headingUp && styles.compassButtonActive,
          ]}
          onPress={() => onHeadingToggle(!headingUp)}
          accessibilityLabel={headingUp ? 'Basculer en mode Nord en haut' : 'Basculer en mode boussole'}
        >
          <View style={headingUp ? { transform: [{ rotate: `${-computedHeading}deg` }] } : undefined}>
            <Ionicons name="compass-outline" size={24} color={headingUp ? COLORS.white : COLORS.textPrimary} />
          </View>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'box-none',
  },
  mapOverlayActions: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    gap: SPACING.xs,
  },
  mapOverlayBtn: {
    width: SPACING.xxl,
    height: SPACING.xxl,
    borderRadius: 24,
    backgroundColor: COLORS.surface + 'E6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  mapOverlayBtnActive: {
    backgroundColor: COLORS.info,
    borderColor: COLORS.info,
  },
  recenterButton: {
    position: 'absolute',
    bottom: SPACING.md,
    right: SPACING.md,
    width: SPACING.xxl,
    height: SPACING.xxl,
    borderRadius: 24,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  compassButton: {
    position: 'absolute',
    bottom: SPACING.md,
    left: SPACING.md,
    width: SPACING.xxl,
    height: SPACING.xxl,
    borderRadius: 24,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  compassButtonActive: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primaryLight,
  },
});
