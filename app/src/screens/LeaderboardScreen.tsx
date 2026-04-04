import React, { useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Pressable,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { COLORS, FONT_SIZE, SPACING, BORDER_RADIUS } from '@/constants';
import Skeleton from '@/components/Skeleton';
import { useLeaderboard, useCurrentUserRank, type LeaderboardEntry } from '@/hooks/useLeaderboard';
import { useAuth } from '@/hooks/useAuth';
import type { ProfileStackParamList } from '@/navigation/types';

type NavProp = NativeStackNavigationProp<ProfileStackParamList>;

const MEDAL_COLORS: Record<number, string> = {
  1: COLORS.gold,
  2: COLORS.silver,
  3: COLORS.bronze,
};

const MEDAL_ICONS: Record<number, string> = {
  1: 'trophy',
  2: 'medal',
  3: 'medal',
};

interface LeaderboardItemProps {
  entry: LeaderboardEntry;
  isCurrentUser: boolean;
  onPress: (userId: string, username: string | null) => void;
}

const LeaderboardItem = React.memo(function LeaderboardItem({
  entry,
  isCurrentUser,
  onPress,
}: LeaderboardItemProps) {
  const isMedal = entry.rank <= 3;
  const medalColor = MEDAL_COLORS[entry.rank];

  return (
    <Pressable
      style={[
        styles.entryRow,
        isCurrentUser && styles.entryRowCurrent,
        isMedal && styles.entryRowMedal,
      ]}
      onPress={() => onPress(entry.user_id, entry.username)}
      accessibilityLabel={`Voir le profil de ${entry.username ?? 'Randonneur'}, rang ${entry.rank}`}
    >
      {/* Rang */}
      <View style={styles.rankContainer}>
        {isMedal ? (
          <Ionicons
            name={MEDAL_ICONS[entry.rank] as 'trophy' | 'medal'}
            size={24}
            color={medalColor}
          />
        ) : (
          <Text style={styles.rankText}>{entry.rank}</Text>
        )}
      </View>

      {/* Avatar */}
      {entry.avatar_url ? (
        <Image
          source={{ uri: entry.avatar_url }}
          style={[styles.avatar, isMedal && { borderColor: medalColor, borderWidth: 2 }]}
        />
      ) : (
        <View style={[styles.avatarPlaceholder, isMedal && { borderColor: medalColor, borderWidth: 2 }]}>
          <Ionicons name="person-circle-outline" size={24} color={COLORS.textMuted} />
        </View>
      )}

      {/* Infos */}
      <View style={styles.entryInfo}>
        <Text style={[styles.username, isCurrentUser && styles.usernameCurrent]} numberOfLines={1}>
          {entry.username?.trim() || 'Randonneur'}
          {isCurrentUser ? ' (toi)' : ''}
        </Text>
        <Text style={styles.statsLine}>
          {entry.trails_completed} sentier{entry.trails_completed > 1 ? 's' : ''}
          {'  '}
          {entry.total_distance_km.toFixed(1)} km
        </Text>
      </View>

      {/* Sentiers count badge */}
      <View style={[styles.countBadge, isMedal && { backgroundColor: (medalColor ?? COLORS.primary) + '25' }]}>
        <Text style={[styles.countText, isMedal && { color: medalColor }]}>
          {entry.trails_completed}
        </Text>
      </View>
    </Pressable>
  );
});

export default function LeaderboardScreen() {
  const { user } = useAuth();
  const navigation = useNavigation<NavProp>();
  const { data: leaderboard = [], isLoading, error, refetch } = useLeaderboard();
  const { data: myRank } = useCurrentUserRank();

  const currentUserId = user?.id;
  const isInTop10 = leaderboard.some((e) => e.user_id === currentUserId);

  const handleUserPress = useCallback(
    (userId: string, username: string | null) => {
      navigation.navigate('UserProfile', {
        userId,
        username: username ?? undefined,
      });
    },
    [navigation],
  );

  const renderItem = useCallback(
    ({ item }: { item: LeaderboardEntry }) => (
      <LeaderboardItem
        entry={item}
        isCurrentUser={item.user_id === currentUserId}
        onPress={handleUserPress}
      />
    ),
    [currentUserId, handleUserPress],
  );

  const keyExtractor = useCallback((item: LeaderboardEntry) => item.user_id, []);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Top 10 Randonneurs</Text>
          <Text style={styles.subtitle}>Classes par nombre de sentiers completes</Text>
        </View>
        <View style={{ padding: SPACING.md }}>
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} width="100%" height={60} style={{ marginBottom: SPACING.sm, borderRadius: BORDER_RADIUS.md }} />
          ))}
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Ionicons name="cloud-offline-outline" size={48} color={COLORS.danger} />
        <Text style={styles.errorText}>Impossible de charger le classement</Text>
        <Pressable
          style={styles.retryButton}
          onPress={() => refetch()}
          accessibilityLabel="Reessayer le chargement du classement"
        >
          <Text style={styles.retryText}>Reessayer</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Top 10 Randonneurs</Text>
        <Text style={styles.subtitle}>Classes par nombre de sentiers completes</Text>
      </View>

      <FlatList
        data={leaderboard}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refetch}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="podium-outline" size={48} color={COLORS.textMuted} />
            <Text style={styles.emptyText}>Aucune activite pour le moment</Text>
            <Text style={styles.emptySubtext}>
              Complete des sentiers pour apparaitre dans le classement !
            </Text>
          </View>
        }
        ListFooterComponent={
          !isInTop10 && myRank ? (
            <View style={styles.myRankSection}>
              <View style={styles.separator}>
                <View style={styles.separatorLine} />
                <Text style={styles.separatorText}>Ta position</Text>
                <View style={styles.separatorLine} />
              </View>
              <LeaderboardItem
                entry={myRank}
                isCurrentUser
                onPress={handleUserPress}
              />
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    gap: SPACING.sm,
  },
  header: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  title: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  subtitle: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textMuted,
    marginTop: SPACING.xs,
  },
  list: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  entryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    minHeight: 64,
  },
  entryRowCurrent: {
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  entryRowMedal: {
    backgroundColor: COLORS.surface,
  },
  rankContainer: {
    width: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginLeft: SPACING.sm,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: SPACING.sm,
  },
  entryInfo: {
    flex: 1,
    marginLeft: SPACING.sm,
  },
  username: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  usernameCurrent: {
    color: COLORS.primaryLight,
  },
  statsLine: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  countBadge: {
    backgroundColor: COLORS.primary + '25',
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    minWidth: 36,
    alignItems: 'center',
  },
  countText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
    color: COLORS.primaryLight,
  },
  loadingText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textMuted,
  },
  errorText: {
    fontSize: FONT_SIZE.lg,
    color: COLORS.textMuted,
  },
  retryButton: {
    marginTop: SPACING.md,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.sm,
    minHeight: SPACING.xxl,
    justifyContent: 'center',
  },
  retryText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.white,
  },
  empty: {
    alignItems: 'center',
    gap: SPACING.sm,
    paddingTop: 80,
  },
  emptyText: {
    fontSize: FONT_SIZE.lg,
    color: COLORS.textMuted,
  },
  emptySubtext: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  myRankSection: {
    marginTop: SPACING.sm,
  },
  separator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    gap: SPACING.sm,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  separatorText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
});
