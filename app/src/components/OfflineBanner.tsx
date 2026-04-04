import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, Text, View, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import NetInfo from '@react-native-community/netinfo';
import { COLORS, FONT_SIZE, SPACING } from '@/constants';

let _isOffline = false;

/**
 * Hook to get the current offline state.
 */
export function useIsOffline(): boolean {
  const [offline, setOffline] = useState(_isOffline);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const value = !state.isConnected;
      _isOffline = value;
      setOffline(value);
    });
    return () => unsubscribe();
  }, []);

  return offline;
}

/**
 * Guard function: if offline, shows an alert and returns true.
 * Use before network-dependent actions (like, post, signalement, etc.).
 *
 * Usage:
 *   if (guardOfflineAction()) return;
 */
export function guardOfflineAction(): boolean {
  if (_isOffline) {
    Alert.alert(
      'Hors ligne',
      'Action impossible hors ligne. Reconnecte-toi a internet pour continuer.',
    );
    return true;
  }
  return false;
}

function OfflineBanner() {
  const isOffline = useIsOffline();

  if (!isOffline) return null;

  return (
    <View style={styles.banner} accessibilityRole="alert" accessibilityLabel="Mode hors ligne actif">
      <Ionicons name="cloud-offline" size={18} color={COLORS.warning} />
      <View style={styles.textContainer}>
        <Text style={styles.title}>Mode hors-ligne</Text>
        <Text style={styles.subtitle}>
          Les sentiers en cache restent accessibles. Les actions reseau (likes, posts, signalements) sont indisponibles.
        </Text>
      </View>
    </View>
  );
}

export default React.memo(OfflineBanner);

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    backgroundColor: COLORS.warning + '15',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.warning + '30',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    zIndex: 999,
  },
  textContainer: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
    color: COLORS.warning,
  },
  subtitle: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.warning,
    opacity: 0.85,
  },
});
