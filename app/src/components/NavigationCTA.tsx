import { StyleSheet, View, Pressable, Text } from 'react-native';
import Animated, { useAnimatedStyle, type AnimatedStyleProp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT_SIZE, SPACING, BORDER_RADIUS } from '@/constants';

type NavigationCTAProps = {
  isTracking: boolean;
  onCameraPress: () => void;
  onToggleTracking: () => void;
  trackingAnimStyle: AnimatedStyleProp;
};

export default function NavigationCTA({
  isTracking,
  onCameraPress,
  onToggleTracking,
  trackingAnimStyle,
}: NavigationCTAProps) {
  return (
    <View style={styles.ctaRow}>
      <Pressable
        style={styles.cameraButton}
        onPress={onCameraPress}
        accessibilityLabel="Prendre une photo"
      >
        <Ionicons name="camera-outline" size={24} color={COLORS.textPrimary} />
      </Pressable>

      <Animated.View style={[styles.ctaButtonWrapper, trackingAnimStyle]}>
        <Pressable
          style={[styles.ctaButton, isTracking ? styles.ctaButtonStop : styles.ctaButtonStart]}
          onPress={onToggleTracking}
          accessibilityLabel={isTracking ? 'Arreter le suivi GPS' : 'Demarrer la randonnee'}
        >
          <Text style={styles.ctaButtonText}>
            {isTracking ? 'ARRETER' : 'DEMARRER'}
          </Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  ctaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  cameraButton: {
    width: SPACING.xxl,
    height: SPACING.xxl,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  ctaButtonWrapper: {
    flex: 1,
  },
  ctaButton: {
    minHeight: 56,
    borderRadius: BORDER_RADIUS.lg,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  ctaButtonStart: {
    backgroundColor: COLORS.success,
    shadowColor: COLORS.success,
  },
  ctaButtonStop: {
    backgroundColor: COLORS.danger,
    shadowColor: COLORS.danger,
  },
  ctaButtonText: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '800',
    color: COLORS.white,
    letterSpacing: 2,
  },
});
