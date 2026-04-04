import React, { useState, useCallback, useRef, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import BottomSheet from '@gorhom/bottom-sheet';
import { COLORS, FONT_SIZE, SPACING, BORDER_RADIUS } from '@/constants';
import GradientHeader from '@/components/GradientHeader';
import { guardOfflineAction } from '@/components/OfflineBanner';
import Skeleton from '@/components/Skeleton';
import PostItem from '@/components/PostItem';
import StoryItem from '@/components/StoryItem';
import CreatePostModal from '@/components/CreatePostModal';
import CommentsBottomSheet from '@/components/CommentsBottomSheet';
import { useAuth } from '@/hooks/useAuth';
import {
  useFeed,
  useCreatePost,
  useToggleLike,
  useComments,
  useCreateComment,
  type Post,
  type Comment,
  type FeedFilter,
} from '@/hooks/useFeed';
import { useFriendStories, type FriendStory } from '@/hooks/useFriendStories';
import type { ProfileStackParamList } from '@/navigation/types';

type FeedNavProp = NativeStackNavigationProp<ProfileStackParamList>;

export default function FeedScreen() {
  const { user } = useAuth();
  const navigation = useNavigation<FeedNavProp>();
  const [feedFilter, setFeedFilter] = useState<FeedFilter>('public');
  const [modalVisible, setModalVisible] = useState(false);

  // Comments state
  const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const commentSheetRef = useRef<BottomSheet>(null);
  const commentSnapPoints = useMemo(() => ['50%', '80%'], []);

  const { data: posts = [], isLoading, error, refetch } = useFeed(feedFilter);
  const { data: friendStories = [] } = useFriendStories();
  const toggleLike = useToggleLike();
  const createPost = useCreatePost();
  const { data: comments = [], isLoading: commentsLoading } = useComments(activeCommentPostId);
  const createComment = useCreateComment();

  const handleLike = useCallback((post: Post) => {
    if (guardOfflineAction()) return;
    if (!user?.id) return;
    toggleLike.mutate(
      { postId: post.id, userId: user.id, isLiked: post.liked_by_me ?? false },
      {
        onError: () => Alert.alert('Erreur', 'Impossible de reagir a ce post.'),
      },
    );
  }, [user?.id, toggleLike]);

  const handleOpenComments = useCallback((post: Post) => {
    setActiveCommentPostId(post.id);
    setCommentText('');
    commentSheetRef.current?.snapToIndex(0);
  }, []);

  const handleCloseComments = useCallback(() => {
    setActiveCommentPostId(null);
    setCommentText('');
  }, []);

  const handleSendComment = useCallback(() => {
    if (guardOfflineAction()) return;
    if (!user?.id || !activeCommentPostId) return;
    const trimmed = commentText.trim();
    if (!trimmed) return;

    createComment.mutate(
      {
        postId: activeCommentPostId,
        userId: user.id,
        content: trimmed,
      },
      {
        onError: () => Alert.alert('Erreur', 'Impossible d\'envoyer le commentaire.'),
      },
    );
    setCommentText('');
  }, [user?.id, activeCommentPostId, commentText, createComment]);

  const handleUserPress = useCallback(
    (userId: string, username: string | null) => {
      navigation.navigate('UserProfile', {
        userId,
        username: username ?? undefined,
      });
    },
    [navigation],
  );

  const renderPost = useCallback(
    ({ item }: { item: Post }) => (
      <PostItem post={item} onLike={handleLike} onComment={handleOpenComments} onUserPress={handleUserPress} />
    ),
    [handleLike, handleOpenComments, handleUserPress],
  );

  const keyExtractor = useCallback((item: Post) => item.id, []);

  const renderStory = useCallback(
    ({ item }: { item: FriendStory }) => (
      <StoryItem story={item} onPress={handleUserPress} />
    ),
    [handleUserPress],
  );

  const storyKeyExtractor = useCallback((item: FriendStory) => item.user_id, []);

  const handlePublish = useCallback(
    async (postText: string, imageUrl: string | null) => {
      if (guardOfflineAction()) return;
      if (!user?.id) return;

      const postType = imageUrl ? 'photo' : 'text';

      createPost.mutate(
        {
          user_id: user.id,
          content: postText || undefined,
          image_url: imageUrl,
          post_type: postType,
          visibility: 'public',
        },
        {
          onError: () => Alert.alert('Erreur', 'Impossible de publier le post.'),
        },
      );
    },
    [user?.id, createPost],
  );

  const handleLeaderboardPress = useCallback(() => {
    navigation.navigate('Leaderboard');
  }, [navigation]);

  const openModal = useCallback(() => {
    setModalVisible(true);
  }, []);

  const closeModal = useCallback(() => {
    setModalVisible(false);
  }, []);

  // -- Render --

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.screenTitle}>Communaute</Text>
        {[1, 2, 3].map((i) => (
          <View key={i} style={styles.postCard}>
            <View style={styles.postHeader}>
              <Skeleton width={36} height={36} borderRadius={18} />
              <View style={{ marginLeft: SPACING.sm, flex: 1 }}>
                <Skeleton width={120} height={14} borderRadius={4} />
                <Skeleton width={60} height={10} borderRadius={4} />
              </View>
            </View>
            <Skeleton width="100%" height={14} borderRadius={4} />
            <Skeleton width="80%" height={14} borderRadius={4} />
            <Skeleton width="100%" height={160} borderRadius={BORDER_RADIUS.md} />
          </View>
        ))}
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Ionicons name="cloud-offline-outline" size={48} color={COLORS.danger} />
        <Text style={styles.emptyText}>Impossible de charger le feed</Text>
        <Text style={styles.emptySubtext}>Verifie ta connexion internet</Text>
        <Pressable style={styles.retryButton} onPress={() => refetch()} accessibilityLabel="Reessayer">
          <Text style={styles.retryText}>Reessayer</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <GradientHeader height={80} />
      <Text style={styles.screenTitle}>Communaute</Text>

      {/* Feed filter tabs */}
      <View style={styles.filterTabs}>
        <Pressable
          style={[styles.filterTab, feedFilter === 'public' && styles.filterTabActive]}
          onPress={() => setFeedFilter('public')}
          accessibilityLabel="Afficher tous les posts"
        >
          <Text style={[styles.filterTabText, feedFilter === 'public' && styles.filterTabTextActive]}>
            Tous
          </Text>
        </Pressable>
        <Pressable
          style={[styles.filterTab, feedFilter === 'friends' && styles.filterTabActive]}
          onPress={() => setFeedFilter('friends')}
          accessibilityLabel="Afficher les posts des amis"
        >
          <Text style={[styles.filterTabText, feedFilter === 'friends' && styles.filterTabTextActive]}>
            Amis
          </Text>
        </Pressable>
      </View>

      {/* Friend stories — amis actifs ces 7 derniers jours */}
      {friendStories.length > 0 && (
        <FlatList
          data={friendStories}
          renderItem={renderStory}
          keyExtractor={storyKeyExtractor}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.storiesList}
          style={styles.storiesContainer}
        />
      )}

      {/* Leaderboard link */}
      <Pressable
        style={styles.leaderboardLink}
        onPress={handleLeaderboardPress}
        accessibilityLabel="Voir le classement des randonneurs"
      >
        <Ionicons name="podium-outline" size={18} color={COLORS.primaryLight} />
        <Text style={styles.leaderboardLinkText}>Classement</Text>
        <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
      </Pressable>

      <FlatList
        data={posts}
        renderItem={renderPost}
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
        initialNumToRender={10}
        maxToRenderPerBatch={15}
        removeClippedSubviews={true}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="newspaper-outline" size={48} color={COLORS.textMuted} />
            <Text style={styles.emptyText}>
              {feedFilter === 'friends'
                ? 'Aucun post de tes amis.'
                : 'Aucun post pour le moment.'}
            </Text>
            <Text style={styles.emptySubtext}>
              {feedFilter === 'friends'
                ? 'Ajoute des amis pour voir leurs publications !'
                : 'Partage ta progression pour commencer !'}
            </Text>
            <Pressable
              style={{
                marginTop: SPACING.md,
                backgroundColor: COLORS.primary,
                paddingHorizontal: SPACING.lg,
                paddingVertical: SPACING.sm,
                borderRadius: BORDER_RADIUS.md,
              }}
              onPress={() => navigation.navigate('Friends')}
              accessibilityLabel="Ajouter des amis"
              accessibilityRole="button"
            >
              <Text style={{ color: COLORS.white, fontWeight: '600', fontSize: FONT_SIZE.sm }}>
                Ajouter des amis
              </Text>
            </Pressable>
          </View>
        }
      />

      {/* FAB - Create post */}
      <Pressable
        style={styles.fab}
        onPress={openModal}
        accessibilityLabel="Creer un nouveau post"
      >
        <Ionicons name="add" size={28} color={COLORS.white} />
      </Pressable>

      {/* Create post modal */}
      <CreatePostModal
        visible={modalVisible}
        onClose={closeModal}
        onPublish={handlePublish}
        userId={user?.id}
      />

      {/* Comments bottom sheet */}
      <CommentsBottomSheet
        ref={commentSheetRef}
        snapPoints={commentSnapPoints}
        onClose={handleCloseComments}
        comments={comments}
        commentsLoading={commentsLoading}
        commentText={commentText}
        onCommentTextChange={setCommentText}
        onSendComment={handleSendComment}
        isSending={createComment.isPending ?? false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  screenTitle: { fontSize: FONT_SIZE.xxl, fontWeight: '800', color: COLORS.textPrimary, padding: SPACING.md, paddingBottom: SPACING.xs },

  // Filter tabs
  filterTabs: {
    flexDirection: 'row',
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: 3,
  },
  filterTab: {
    flex: 1,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.md,
    minHeight: SPACING.xxl,
    justifyContent: 'center',
  },
  filterTabActive: {
    backgroundColor: COLORS.primary,
  },
  filterTabText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  filterTabTextActive: {
    color: COLORS.white,
  },

  // Stories
  storiesContainer: {
    maxHeight: 100,
    marginBottom: SPACING.sm,
  },
  storiesList: {
    paddingHorizontal: SPACING.md,
    gap: SPACING.md,
  },

  // Leaderboard link
  leaderboardLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    minHeight: SPACING.xxl,
  },
  leaderboardLinkText: {
    flex: 1,
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.primaryLight,
  },

  list: { paddingBottom: SPACING.xxl + 60 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: SPACING.sm, paddingTop: 100 },
  emptyText: { fontSize: FONT_SIZE.lg, color: COLORS.textMuted },
  emptySubtext: { fontSize: FONT_SIZE.sm, color: COLORS.textMuted },
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

  // FAB
  fab: {
    position: 'absolute',
    bottom: SPACING.lg,
    right: SPACING.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
});
