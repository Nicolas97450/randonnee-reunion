import React, { useEffect, useRef } from 'react';
import {
  Animated,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useInAppNotifications } from '@/hooks/useInAppNotifications';
import { navigationRef } from '@/lib/navigationRef';
import { COLORS, FONT_SIZE, SPACING, BORDER_RADIUS } from '@/constants';

const TOAST_HEIGHT = 80;
const DISMISS_THRESHOLD = -30;
const AUTO_DISMISS_MS = 4000;

export default function InAppNotifications() {
  const { currentNotification, dismiss } = useInAppNotifications();
  const insets = useSafeAreaInsets();

  const translateY = useRef(new Animated.Value(-TOAST_HEIGHT - 60)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Pan responder for swipe-up dismiss ──
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gesture) => gesture.dy < -5,
      onPanResponderMove: (_, gesture) => {
        if (gesture.dy < 0) {
          translateY.setValue(gesture.dy);
        }
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dy < DISMISS_THRESHOLD) {
          hideToast();
        } else {
          // Snap back
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    }),
  ).current;

  // ── Show toast ──
  useEffect(() => {
    if (currentNotification) {
      // Reset position
      translateY.setValue(-TOAST_HEIGHT - 60);
      opacity.setValue(0);

      // Slide in
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 60,
          friction: 10,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto-dismiss timer
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        hideToast();
      }, AUTO_DISMISS_MS);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentNotification?.id]);

  // ── Hide toast with animation ──
  function hideToast() {
    if (timerRef.current) clearTimeout(timerRef.current);

    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -TOAST_HEIGHT - 60,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      dismiss();
    });
  }

  // ── Handle tap → navigate ──
  function handlePress() {
    if (!currentNotification?.navigation) {
      hideToast();
      return;
    }

    const { screen, params } = currentNotification.navigation;
    hideToast();

    // Small delay to let the toast animate out before navigating
    setTimeout(() => {
      if (navigationRef.isReady()) {
        // @ts-expect-error — nested navigator params are hard to type precisely
        navigationRef.navigate(screen, params);
      }
    }, 300);
  }

  if (!currentNotification) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          top: insets.top + SPACING.xs,
          transform: [{ translateY }],
          opacity,
        },
      ]}
      {...panResponder.panHandlers}
    >
      <Pressable
        style={[
          styles.toast,
          { borderLeftColor: currentNotification.color },
        ]}
        onPress={handlePress}
        accessibilityLabel={`Notification : ${currentNotification.title}`}
        accessibilityHint="Appuie pour ouvrir"
      >
        <View style={[styles.iconContainer, { backgroundColor: currentNotification.color + '20' }]}>
          <Ionicons
            name={currentNotification.icon as keyof typeof Ionicons.glyphMap}
            size={22}
            color={currentNotification.color}
          />
        </View>

        <View style={styles.textContainer}>
          <Text style={styles.title} numberOfLines={1}>
            {currentNotification.title}
          </Text>
          <Text style={styles.body} numberOfLines={2}>
            {currentNotification.body}
          </Text>
        </View>

        <Text style={styles.time}>maintenant</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: SPACING.sm,
    right: SPACING.sm,
    zIndex: 9999,
    elevation: 9999,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    borderLeftWidth: 4,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    // Shadow iOS
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    // Shadow Android
    elevation: 10,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  textContainer: {
    flex: 1,
    marginRight: SPACING.xs,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
    marginBottom: 2,
  },
  body: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.xs,
    lineHeight: FONT_SIZE.xs * 1.4,
  },
  time: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZE.xs,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
});
