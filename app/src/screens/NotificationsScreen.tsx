import React, { useCallback } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useInAppNotifications } from '@/hooks/useInAppNotifications';
import { navigationRef } from '@/lib/navigationRef';
import { COLORS, FONT_SIZE, SPACING, BORDER_RADIUS } from '@/constants';
import type { InAppNotification } from '@/hooks/useInAppNotifications';

// ── Time ago helper ──────────────────────────────────────────
function timeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return 'A l\'instant';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `Il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  return `Il y a ${days}j`;
}

// ── Notification row ─────────────────────────────────────────
function NotificationRow({ item }: { item: InAppNotification }) {
  const handlePress = useCallback(() => {
    if (!item.navigation) return;
    const { screen, params } = item.navigation;
    if (navigationRef.isReady()) {
      // @ts-expect-error — nested navigator params are hard to type precisely
      navigationRef.navigate(screen, params);
    }
  }, [item.navigation]);

  return (
    <Pressable
      style={styles.row}
      onPress={handlePress}
      accessibilityLabel={`Notification : ${item.title}`}
    >
      <View style={[styles.iconContainer, { backgroundColor: item.color + '20' }]}>
        <Ionicons
          name={item.icon as keyof typeof Ionicons.glyphMap}
          size={22}
          color={item.color}
        />
      </View>

      <View style={styles.textContainer}>
        <Text style={styles.title} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.body} numberOfLines={2}>
          {item.body}
        </Text>
      </View>

      <Text style={styles.time}>{timeAgo(item.createdAt)}</Text>
    </Pressable>
  );
}

// ── Empty state ──────────────────────────────────────────────
function EmptyState() {
  return (
    <View style={styles.emptyContainer}>
      <Ionicons name="notifications-off-outline" size={48} color={COLORS.textMuted} />
      <Text style={styles.emptyText}>Aucune notification</Text>
      <Text style={styles.emptySubtext}>
        Les notifications apparaitront ici quand quelqu'un interagit avec toi.
      </Text>
    </View>
  );
}

// ── Screen ───────────────────────────────────────────────────
export default function NotificationsScreen() {
  const { notifications, markAllRead } = useInAppNotifications();

  // Mark all as read when the screen is focused
  useFocusEffect(
    useCallback(() => {
      markAllRead();
    }, [markAllRead]),
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <NotificationRow item={item} />}
        ListEmptyComponent={EmptyState}
        contentContainerStyle={notifications.length === 0 ? styles.emptyList : undefined}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        initialNumToRender={10}
        maxToRenderPerBatch={15}
        removeClippedSubviews={true}
      />
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
  },
  iconContainer: {
    width: 44,
    height: 44,
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
  separator: {
    height: 1,
    backgroundColor: COLORS.border,
    marginLeft: SPACING.md + 44 + SPACING.sm,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.md,
  },
  emptyList: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZE.md,
  },
  emptySubtext: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZE.sm,
    textAlign: 'center',
    paddingHorizontal: SPACING.xl,
  },
});
