import React, { useCallback, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Pressable,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { COLORS, FONT_SIZE, SPACING, BORDER_RADIUS } from '@/constants';
import { useAuth } from '@/hooks/useAuth';
import { useUserPosts, useToggleLike, type Post } from '@/hooks/useFeed';
import { useFriends, useSendFriendRequest } from '@/hooks/useFriends';
import { useGetOrCreateConversation } from '@/hooks/useDirectMessages';
import { useUserFullStats } from '@/hooks/useUserStats';
import { BADGES } from '@/lib/badges';
import type { ProfileStackParamList } from '@/navigation/types';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

type Props = NativeStackScreenProps<ProfileStackParamList, 'UserProfile'>;

interface UserProfile {
  id: string;
  username: string | null;
  avatar_url: string | null;
  is_private: boolean;
}

function useUserProfile(userId: string) {
  return useQuery({
    queryKey: ['user-profile', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, username, avatar_url, is_private')
        .eq('id', userId)
        .single();
      if (error) throw error;
      return data as UserProfile;
    },
  });
}

function useUserStats(userId: string) {
  return useQuery({
    queryKey: ['user-stats', userId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('user_activities')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);
      if (error) throw error;
      const completed = count ?? 0;
      const total = 710;
      const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
      return { completed, total, progress };
    },
  });
}

interface PostItemProps {
  post: Post;
  onLike: (post: Post) => void;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "a l'instant";
  if (min < 60) return `il y a ${min}min`;
  const hours = Math.floor(min / 60);
  if (hours < 24) return `il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  return `il y a ${days}j`;
}

const PostItem = React.memo(function PostItem({ post, onLike }: PostItemProps) {
  return (
    <View style={styles.postCard}>
      {post.content && (
        <Text style={styles.postContent}>{post.content}</Text>
      )}
      {post.image_url && (
        <Image
          source={{ uri: post.image_url }}
          style={styles.postImage}
          resizeMode="cover"
        />
      )}
      <View style={styles.postFooter}>
        <Text style={styles.postTime}>{timeAgo(post.created_at)}</Text>
        <Pressable
          style={styles.likeButton}
          onPress={() => onLike(post)}
          accessibilityLabel="Aimer ce post"
        >
          <Ionicons
            name={post.liked_by_me ? 'heart' : 'heart-outline'}
            size={20}
            color={post.liked_by_me ? COLORS.danger : COLORS.textMuted}
          />
          <Text
            style={[
              styles.likeCount,
              post.liked_by_me && { color: COLORS.danger },
            ]}
          >
            {post.like_count ?? 0}
          </Text>
        </Pressable>
      </View>
    </View>
  );
});

export default function UserProfileScreen({ route }: Props) {
  const { userId } = route.params;
  const { user } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
  const { data: profile, isLoading: profileLoading } = useUserProfile(userId);
  const { data: stats } = useUserStats(userId);
  const { data: fullStats } = useUserFullStats(userId);
  const { data: posts = [], isLoading: postsLoading } = useUserPosts(userId);
  const { data: friends = [] } = useFriends(user?.id);
  const sendRequest = useSendFriendRequest();
  const toggleLike = useToggleLike();
  const getOrCreateConversation = useGetOrCreateConversation();

  const isFriend = friends.some((f) => f.friend.id === userId);
  const isMe = user?.id === userId;

  const earnedBadgeIds = useMemo(() => {
    if (!fullStats) return new Set<string>();
    return new Set(fullStats.earnedBadges.map((b) => b.id));
  }, [fullStats]);

  const handleSendMessage = useCallback(async () => {
    if (!user?.id) return;
    const conversationId = await getOrCreateConversation.mutateAsync({ userId: user.id, peerId: userId });
    navigation.navigate('Conversation', {
      conversationId,
      peerUsername: profile?.username ?? 'Randonneur',
      peerId: userId,
    });
  }, [user?.id, userId, profile?.username, getOrCreateConversation, navigation]);

  const handleLike = useCallback(
    (post: Post) => {
      if (!user?.id) return;
      toggleLike.mutate({
        postId: post.id,
        userId: user.id,
        isLiked: post.liked_by_me ?? false,
      });
    },
    [user?.id, toggleLike],
  );

  const handleAddFriend = useCallback(() => {
    if (!user?.id) return;
    sendRequest.mutate({ requesterId: user.id, addresseeId: userId });
  }, [user?.id, userId, sendRequest]);

  const renderPost = useCallback(
    ({ item }: { item: Post }) => <PostItem post={item} onLike={handleLike} />,
    [handleLike],
  );

  const keyExtractor = useCallback((item: Post) => item.id, []);

  if (profileLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const username = profile?.username ?? 'Randonneur';
  const avatarUrl = profile?.avatar_url;
  const isProfilePrivate = profile?.is_private === true && !isMe && !isFriend;

  if (isProfilePrivate) {
    return (
      <View style={styles.container}>
        <View style={styles.privateContainer}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person-circle-outline" size={40} color={COLORS.textMuted} />
            </View>
          )}
          <Text style={styles.username}>{username}</Text>
          <View style={styles.privateBadge}>
            <Ionicons name="lock-closed" size={24} color={COLORS.textMuted} />
            <Text style={styles.privateTitle}>Profil prive</Text>
            <Text style={styles.privateSubtitle}>
              Ajoutez cet utilisateur en ami pour voir son profil, ses stats et ses badges.
            </Text>
          </View>
          {!isMe && !isFriend && (
            <Pressable
              style={styles.addFriendButton}
              onPress={handleAddFriend}
              accessibilityLabel={`Ajouter ${username} en ami`}
            >
              <Ionicons name="person-add" size={18} color={COLORS.white} />
              <Text style={styles.addFriendText}>Ajouter en ami</Text>
            </Pressable>
          )}
        </View>
      </View>
    );
  }

  const hikerLevel = fullStats?.hikerLevel;
  const earnedBadges = fullStats?.earnedBadges ?? [];

  const ListHeader = (
    <View style={styles.header}>
      {avatarUrl ? (
        <Image source={{ uri: avatarUrl }} style={styles.avatar} />
      ) : (
        <View style={styles.avatarPlaceholder}>
          <Ionicons name="person-circle-outline" size={40} color={COLORS.textMuted} />
        </View>
      )}
      <Text style={styles.username}>{username}</Text>

      {/* Hiker level badge */}
      {hikerLevel && (
        <View style={styles.levelRow}>
          <View style={[styles.levelBadgeCircle, { backgroundColor: hikerLevel.color + '20', borderColor: hikerLevel.color }]}>
            <Text style={[styles.levelNumber, { color: hikerLevel.color }]}>{hikerLevel.level}</Text>
          </View>
          <Text style={[styles.levelName, { color: hikerLevel.color }]}>{hikerLevel.name}</Text>
        </View>
      )}

      {/* Stats row */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Ionicons name="trail-sign" size={18} color={COLORS.primary} />
          <Text style={styles.statValue}>{fullStats?.totalTrails ?? stats?.completed ?? 0}</Text>
          <Text style={styles.statLabel}>sentiers</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="speedometer" size={18} color={COLORS.info} />
          <Text style={styles.statValue}>{fullStats?.totalKm ?? 0}</Text>
          <Text style={styles.statLabel}>km</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="trending-up" size={18} color={COLORS.warm} />
          <Text style={styles.statValue}>{fullStats?.totalElevation ?? 0}</Text>
          <Text style={styles.statLabel}>m D+</Text>
        </View>
      </View>

      {/* Badges section */}
      {earnedBadges.length > 0 && (
        <View style={styles.badgesSection}>
          <Text style={styles.badgesSectionTitle}>
            Badges ({earnedBadges.length}/{BADGES.length})
          </Text>
          <View style={styles.badgesGrid}>
            {BADGES.map((badge) => {
              const isEarned = earnedBadgeIds.has(badge.id);
              const displayColor = isEarned ? badge.color : COLORS.textMuted;
              const opacity = isEarned ? 1 : 0.35;
              return (
                <View
                  key={badge.id}
                  style={[styles.badgeItemContainer, { opacity }]}
                  accessibilityLabel={`${badge.name}: ${isEarned ? 'debloque' : 'verrouille'}`}
                >
                  <View style={[styles.badgeIconCircle, { backgroundColor: displayColor + '20' }]}>
                    <Ionicons
                      name={badge.icon as keyof typeof Ionicons.glyphMap}
                      size={22}
                      color={displayColor}
                    />
                  </View>
                  <Text style={[styles.badgeNameText, { color: displayColor }]} numberOfLines={1}>
                    {badge.name}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* Add friend button */}
      {!isMe && !isFriend && (
        <Pressable
          style={styles.addFriendButton}
          onPress={handleAddFriend}
          accessibilityLabel={`Ajouter ${username} en ami`}
        >
          <Ionicons name="person-add" size={18} color={COLORS.white} />
          <Text style={styles.addFriendText}>Ajouter en ami</Text>
        </Pressable>
      )}
      {!isMe && isFriend && (
        <View style={styles.friendRow}>
          <View style={styles.friendBadge}>
            <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
            <Text style={styles.friendBadgeText}>Ami</Text>
          </View>
          <Pressable
            style={styles.messageButton}
            onPress={handleSendMessage}
            accessibilityLabel={`Envoyer un message a ${profile?.username ?? 'cet utilisateur'}`}
          >
            <Ionicons name="chatbubble" size={16} color={COLORS.white} />
            <Text style={styles.messageButtonText}>Message</Text>
          </Pressable>
        </View>
      )}

      <Text style={styles.sectionTitle}>Publications</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={keyExtractor}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        initialNumToRender={10}
        maxToRenderPerBatch={15}
        removeClippedSubviews={true}
        ListEmptyComponent={
          postsLoading ? (
            <ActivityIndicator
              size="small"
              color={COLORS.primary}
              style={styles.loader}
            />
          ) : (
            <View style={styles.empty}>
              <Ionicons
                name="newspaper-outline"
                size={36}
                color={COLORS.textMuted}
              />
              <Text style={styles.emptyText}>Aucun post public</Text>
            </View>
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  header: { alignItems: 'center', paddingTop: SPACING.lg, paddingBottom: SPACING.md },
  avatar: { width: 80, height: 80, borderRadius: 40 },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  username: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: SPACING.sm,
  },
  levelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  levelBadgeCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  levelNumber: {
    fontSize: FONT_SIZE.md,
    fontWeight: '800',
  },
  levelName: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  statItem: { alignItems: 'center', gap: SPACING.xs },
  statValue: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  statLabel: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted },
  badgesSection: {
    width: '100%',
    paddingHorizontal: SPACING.md,
    marginTop: SPACING.lg,
  },
  badgesSectionTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  badgeItemContainer: {
    width: 72,
    alignItems: 'center',
    gap: SPACING.xs,
  },
  badgeIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeNameText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
    textAlign: 'center',
  },
  addFriendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    marginTop: SPACING.md,
    minHeight: SPACING.xxl,
  },
  addFriendText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.white,
  },
  friendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  friendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: COLORS.success + '20',
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
  },
  friendBadgeText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.success,
    fontWeight: '600',
  },
  messageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: COLORS.primaryLight,
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
  },
  messageButtonText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.white,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    alignSelf: 'flex-start',
    marginTop: SPACING.lg,
    marginLeft: SPACING.md,
  },
  list: { paddingBottom: SPACING.xxl },
  postCard: {
    backgroundColor: COLORS.card,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.sm,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
  },
  postContent: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textPrimary,
    lineHeight: 22,
    marginBottom: SPACING.sm,
  },
  postImage: {
    width: '100%',
    height: 200,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.sm,
  },
  postFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: SPACING.sm,
  },
  postTime: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    minWidth: SPACING.xxl,
    minHeight: SPACING.xxl,
    justifyContent: 'center',
  },
  likeCount: { fontSize: FONT_SIZE.sm, color: COLORS.textMuted },
  loader: { marginTop: SPACING.xl },
  empty: {
    alignItems: 'center',
    gap: SPACING.sm,
    paddingTop: SPACING.xl,
  },
  emptyText: { fontSize: FONT_SIZE.md, color: COLORS.textMuted },
  privateContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg,
  },
  privateBadge: {
    alignItems: 'center',
    marginTop: SPACING.lg,
    gap: SPACING.sm,
  },
  privateTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  privateSubtitle: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },
});
