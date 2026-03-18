import { useCallback } from 'react';
import { StyleSheet, Text, View, FlatList, Pressable, Image, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT_SIZE, SPACING, BORDER_RADIUS } from '@/constants';
import { useAuth } from '@/hooks/useAuth';
import { useFeed, useToggleLike, type Post } from '@/hooks/useFeed';

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

export default function FeedScreen() {
  const { user } = useAuth();
  const { data: posts = [], isLoading, refetch } = useFeed();
  const toggleLike = useToggleLike();

  const handleLike = useCallback((post: Post) => {
    if (!user?.id) return;
    toggleLike.mutate({ postId: post.id, userId: user.id, isLiked: post.liked_by_me ?? false });
  }, [user?.id, toggleLike]);

  const renderPost = ({ item }: { item: Post }) => {
    const username = item.user?.username ?? 'Randonneur';
    const avatarUrl = item.user?.avatar_url;
    const stats = item.stats as Record<string, number> | null;

    return (
      <View style={styles.postCard}>
        <View style={styles.postHeader}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.postAvatar} />
          ) : (
            <View style={styles.postAvatarPlaceholder}>
              <Ionicons name="person" size={16} color={COLORS.textMuted} />
            </View>
          )}
          <View style={styles.postHeaderText}>
            <Text style={styles.postUsername}>{username}</Text>
            <Text style={styles.postTime}>{timeAgo(item.created_at)}</Text>
          </View>
          {item.post_type === 'achievement' && (
            <View style={styles.achievementBadge}>
              <Ionicons name="trophy" size={12} color="#F59E0B" />
            </View>
          )}
        </View>

        {item.content && <Text style={styles.postContent}>{item.content}</Text>}

        {item.trail && (
          <View style={styles.trailBadge}>
            <Ionicons name="trail-sign" size={12} color={COLORS.primary} />
            <Text style={styles.trailBadgeText}>{item.trail.name}</Text>
          </View>
        )}

        {item.post_type === 'achievement' && stats && (
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.completed ?? 0}</Text>
              <Text style={styles.statLabel}>sentiers</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.progress ?? 0}%</Text>
              <Text style={styles.statLabel}>explore</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.zones ?? 0}</Text>
              <Text style={styles.statLabel}>zones</Text>
            </View>
          </View>
        )}

        {item.image_url && (
          <Image source={{ uri: item.image_url }} style={styles.postImage} resizeMode="cover" />
        )}

        <View style={styles.postActions}>
          <Pressable
            style={styles.likeButton}
            onPress={() => handleLike(item)}
            accessibilityLabel="Aimer ce post"
          >
            <Ionicons
              name={item.liked_by_me ? 'heart' : 'heart-outline'}
              size={20}
              color={item.liked_by_me ? '#EF4444' : COLORS.textMuted}
            />
            <Text style={[styles.likeCount, item.liked_by_me && { color: '#EF4444' }]}>
              {item.like_count ?? 0}
            </Text>
          </Pressable>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.screenTitle}>Communaute</Text>
      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        onRefresh={refetch}
        refreshing={isLoading}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="newspaper-outline" size={48} color={COLORS.textMuted} />
            <Text style={styles.emptyText}>Aucun post pour le moment.</Text>
            <Text style={styles.emptySubtext}>Partage ta progression pour commencer !</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  screenTitle: { fontSize: FONT_SIZE.xxl, fontWeight: '800', color: COLORS.textPrimary, padding: SPACING.md, paddingBottom: SPACING.sm },
  list: { paddingBottom: SPACING.xxl },
  postCard: {
    backgroundColor: COLORS.card,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
  },
  postHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.sm },
  postAvatar: { width: 36, height: 36, borderRadius: 18 },
  postAvatarPlaceholder: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.surface, justifyContent: 'center', alignItems: 'center' },
  postHeaderText: { flex: 1, marginLeft: SPACING.sm },
  postUsername: { fontSize: FONT_SIZE.md, fontWeight: '600', color: COLORS.textPrimary },
  postTime: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted },
  achievementBadge: { backgroundColor: '#F59E0B20', padding: 6, borderRadius: 12 },
  postContent: { fontSize: FONT_SIZE.md, color: COLORS.textPrimary, lineHeight: 22, marginBottom: SPACING.sm },
  trailBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.primary + '15', paddingHorizontal: SPACING.sm, paddingVertical: 4, borderRadius: BORDER_RADIUS.full, alignSelf: 'flex-start', marginBottom: SPACING.sm },
  trailBadgeText: { fontSize: FONT_SIZE.xs, color: COLORS.primary, fontWeight: '600' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.md, padding: SPACING.sm, marginBottom: SPACING.sm },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: FONT_SIZE.lg, fontWeight: '700', color: COLORS.textPrimary },
  statLabel: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted },
  postImage: { width: '100%', height: 200, borderRadius: BORDER_RADIUS.md, marginBottom: SPACING.sm },
  postActions: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: SPACING.sm },
  likeButton: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  likeCount: { fontSize: FONT_SIZE.sm, color: COLORS.textMuted },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: SPACING.sm, paddingTop: 100 },
  emptyText: { fontSize: FONT_SIZE.lg, color: COLORS.textMuted },
  emptySubtext: { fontSize: FONT_SIZE.sm, color: COLORS.textMuted },
});
