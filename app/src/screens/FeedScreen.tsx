import React, { useState, useCallback, useRef, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Pressable,
  Image,
  ActivityIndicator,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import BottomSheet, { BottomSheetFlatList } from '@gorhom/bottom-sheet';
import { COLORS, FONT_SIZE, SPACING, BORDER_RADIUS } from '@/constants';
import GradientHeader from '@/components/GradientHeader';
import { guardOfflineAction } from '@/components/OfflineBanner';
import Skeleton from '@/components/Skeleton';
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
import { supabase } from '@/lib/supabase';
import type { ProfileStackParamList } from '@/navigation/types';

type FeedNavProp = NativeStackNavigationProp<ProfileStackParamList>;

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

interface PostItemProps {
  post: Post;
  onLike: (post: Post) => void;
  onComment: (post: Post) => void;
  onUserPress: (userId: string, username: string | null) => void;
}

const PostItem = React.memo(function PostItem({ post, onLike, onComment, onUserPress }: PostItemProps) {
  const username = post.user?.username?.trim() || 'Randonneur';
  const avatarUrl = post.user?.avatar_url;
  const stats = post.stats as Record<string, number> | null;

  const heartScale = useSharedValue(1);
  const heartAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartScale.value }],
  }));

  const handleLikePress = useCallback(() => {
    heartScale.value = withSequence(
      withSpring(1.3, { damping: 6, stiffness: 200 }),
      withSpring(1, { damping: 8, stiffness: 150 }),
    );
    onLike(post);
  }, [onLike, post, heartScale]);

  return (
    <View style={styles.postCard}>
      <Pressable
        style={styles.postHeader}
        onPress={() => onUserPress(post.user_id, post.user?.username ?? null)}
        accessibilityLabel={`Voir le profil de ${username}`}
      >
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={styles.postAvatar} />
        ) : (
          <View style={styles.postAvatarPlaceholder}>
            <Ionicons name="person" size={16} color={COLORS.textMuted} />
          </View>
        )}
        <View style={styles.postHeaderText}>
          <Text style={styles.postUsername}>{username}</Text>
          <Text style={styles.postTime}>{timeAgo(post.created_at)}</Text>
        </View>
        {post.post_type === 'achievement' && (
          <View style={styles.achievementBadge}>
            <Ionicons name="trophy" size={12} color={COLORS.warm} />
          </View>
        )}
      </Pressable>

      {post.content && <Text style={styles.postContent}>{post.content}</Text>}

      {post.trail && (
        <View style={styles.trailBadge}>
          <Ionicons name="trail-sign" size={12} color={COLORS.primary} />
          <Text style={styles.trailBadgeText} numberOfLines={1}>{post.trail.name}</Text>
        </View>
      )}

      {post.post_type === 'achievement' && stats && (
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

      {post.image_url && (
        <Image source={{ uri: post.image_url }} style={styles.postImage} resizeMode="cover" />
      )}

      <View style={styles.postActions}>
        <Pressable
          style={styles.likeButton}
          onPress={handleLikePress}
          accessibilityLabel="Aimer ce post"
        >
          <Animated.View style={heartAnimatedStyle}>
            <Ionicons
              name={post.liked_by_me ? 'heart' : 'heart-outline'}
              size={20}
              color={post.liked_by_me ? COLORS.danger : COLORS.textMuted}
            />
          </Animated.View>
          <Text style={[styles.likeCount, post.liked_by_me && { color: COLORS.danger }]}>
            {post.like_count ?? 0}
          </Text>
        </Pressable>
        <Pressable
          style={styles.commentButton}
          onPress={() => onComment(post)}
          accessibilityLabel="Commenter ce post"
        >
          <Ionicons name="chatbubble-outline" size={18} color={COLORS.textMuted} />
          <Text style={styles.commentCount}>{post.comment_count ?? 0}</Text>
        </Pressable>
      </View>
    </View>
  );
});

const CommentItem = React.memo(function CommentItem({ comment }: { comment: Comment }) {
  const username = comment.user?.username?.trim() || 'Randonneur';
  const avatarUrl = comment.user?.avatar_url;

  return (
    <View style={styles.commentItem}>
      {avatarUrl ? (
        <Image source={{ uri: avatarUrl }} style={styles.commentAvatar} />
      ) : (
        <View style={styles.commentAvatarPlaceholder}>
          <Ionicons name="person" size={12} color={COLORS.textMuted} />
        </View>
      )}
      <View style={styles.commentBody}>
        <Text style={styles.commentUsername}>{username}</Text>
        <Text style={styles.commentText}>{comment.content}</Text>
        <Text style={styles.commentTime}>{timeAgo(comment.created_at)}</Text>
      </View>
    </View>
  );
});

interface StoryItemProps {
  story: FriendStory;
  onPress: (userId: string, username: string | null) => void;
}

const StoryItem = React.memo(function StoryItem({ story, onPress }: StoryItemProps) {
  const borderColor = story.is_recent ? COLORS.primaryLight : COLORS.textMuted;
  const displayName = story.username?.trim() || 'Ami';

  return (
    <Pressable
      style={styles.storyItem}
      onPress={() => onPress(story.user_id, story.username)}
      accessibilityLabel={`Voir le profil de ${displayName}`}
    >
      <View style={[styles.storyAvatarBorder, { borderColor }]}>
        {story.avatar_url ? (
          <Image source={{ uri: story.avatar_url }} style={styles.storyAvatar} />
        ) : (
          <View style={styles.storyAvatarPlaceholder}>
            <Ionicons name="person" size={20} color={COLORS.textMuted} />
          </View>
        )}
      </View>
      <Text style={styles.storyUsername} numberOfLines={1}>
        {displayName}
      </Text>
    </Pressable>
  );
});

export default function FeedScreen() {
  const { user } = useAuth();
  const navigation = useNavigation<FeedNavProp>();
  const [feedFilter, setFeedFilter] = useState<FeedFilter>('public');
  const [modalVisible, setModalVisible] = useState(false);
  const [postText, setPostText] = useState('');
  const [postImageUri, setPostImageUri] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);

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
    toggleLike.mutate({ postId: post.id, userId: user.id, isLiked: post.liked_by_me ?? false });
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

    createComment.mutate({
      postId: activeCommentPostId,
      userId: user.id,
      content: trimmed,
    });
    setCommentText('');
  }, [user?.id, activeCommentPostId, commentText, createComment]);

  const renderComment = useCallback(
    ({ item }: { item: Comment }) => <CommentItem comment={item} />,
    [],
  );

  const commentKeyExtractor = useCallback((item: Comment) => item.id, []);

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

  const handleLeaderboardPress = useCallback(() => {
    navigation.navigate('Leaderboard');
  }, [navigation]);

  // -- Create post logic --

  const openModal = useCallback(() => {
    setPostText('');
    setPostImageUri(null);
    setModalVisible(true);
  }, []);

  const closeModal = useCallback(() => {
    setModalVisible(false);
    setPostText('');
    setPostImageUri(null);
  }, []);

  const pickImage = useCallback(async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        'Permission requise',
        "Autorise l'acces aux photos pour ajouter une image.",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.7,
    });

    if (!result.canceled && result.assets?.[0]) {
      setPostImageUri(result.assets[0].uri);
    }
  }, []);

  const removeImage = useCallback(() => {
    setPostImageUri(null);
  }, []);

  const handlePublish = useCallback(async () => {
    if (guardOfflineAction()) return;
    if (!user?.id) return;
    const trimmed = postText.trim();
    if (!trimmed && !postImageUri) {
      Alert.alert('Post vide', 'Ajoute du texte ou une photo.');
      return;
    }

    setIsPublishing(true);
    try {
      let imageUrl: string | undefined;

      // Upload image if selected
      if (postImageUri) {
        const ext = postImageUri.split('.').pop()?.toLowerCase() ?? 'jpg';
        const safeExt = ext === 'png' ? 'png' : 'jpg';
        const fileName = `posts/${user.id}_${Date.now()}.${safeExt}`;
        const contentType = safeExt === 'png' ? 'image/png' : 'image/jpeg';

        const formData = new FormData();
        formData.append('', {
          uri: postImageUri,
          name: fileName,
          type: contentType,
        } as any);

        const { data: session } = await supabase.auth.getSession();
        const token = session?.session?.access_token;

        const uploadResponse = await fetch(
          `https://wnsitmaxjgbprsdpvict.supabase.co/storage/v1/object/avatars/${fileName}`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'x-upsert': 'true',
            },
            body: formData,
          }
        );

        if (!uploadResponse.ok) throw new Error('Upload failed');

        const { data: urlData } = supabase.storage
          .from('avatars')
          .getPublicUrl(fileName);

        imageUrl = urlData.publicUrl;
      }

      const postType = postImageUri ? 'photo' : 'text';

      createPost.mutate({
        user_id: user.id,
        content: trimmed || undefined,
        image_url: imageUrl,
        post_type: postType,
        visibility: 'public',
      });

      closeModal();
    } catch {
      Alert.alert('Erreur', "Impossible de publier le post.");
    } finally {
      setIsPublishing(false);
    }
  }, [user?.id, postText, postImageUri, createPost, closeModal]);

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
        onRefresh={refetch}
        refreshing={isLoading}
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
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={closeModal}
      >
        <KeyboardAvoidingView
          style={styles.modalContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {/* Modal header */}
          <View style={styles.modalHeader}>
            <Pressable
              style={styles.modalCloseButton}
              onPress={closeModal}
              accessibilityLabel="Fermer"
            >
              <Ionicons name="close" size={24} color={COLORS.textPrimary} />
            </Pressable>
            <Text style={styles.modalTitle}>Nouveau post</Text>
            <Pressable
              style={[
                styles.publishButton,
                (!postText.trim() && !postImageUri) && styles.publishButtonDisabled,
              ]}
              onPress={handlePublish}
              disabled={isPublishing || (!postText.trim() && !postImageUri)}
              accessibilityLabel="Publier le post"
            >
              {isPublishing ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <Text style={styles.publishButtonText}>Publier</Text>
              )}
            </Pressable>
          </View>

          {/* Text input */}
          <TextInput
            style={styles.postInput}
            placeholder="Quoi de neuf sur les sentiers ?"
            placeholderTextColor={COLORS.textMuted}
            multiline
            value={postText}
            onChangeText={setPostText}
            autoFocus
            accessibilityLabel="Texte du post"
          />

          {/* Image preview */}
          {postImageUri && (
            <View style={styles.imagePreviewContainer}>
              <Image
                source={{ uri: postImageUri }}
                style={styles.imagePreview}
                resizeMode="cover"
              />
              <Pressable
                style={styles.removeImageButton}
                onPress={removeImage}
                accessibilityLabel="Retirer la photo"
              >
                <Ionicons name="close-circle" size={28} color={COLORS.white} />
              </Pressable>
            </View>
          )}

          {/* Add photo button */}
          <View style={styles.modalActions}>
            <Pressable
              style={styles.addPhotoButton}
              onPress={pickImage}
              accessibilityLabel="Ajouter une photo"
            >
              <Ionicons name="camera-outline" size={22} color={COLORS.primary} />
              <Text style={styles.addPhotoText}>Ajouter une photo</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Comments bottom sheet */}
      <BottomSheet
        ref={commentSheetRef}
        index={-1}
        snapPoints={commentSnapPoints}
        enablePanDownToClose
        onClose={handleCloseComments}
        backgroundStyle={styles.sheetBackground}
        handleIndicatorStyle={styles.sheetHandle}
      >
        <View style={styles.sheetHeader}>
          <Text style={styles.sheetTitle}>Commentaires</Text>
        </View>

        {commentsLoading ? (
          <View style={styles.sheetLoading}>
            <ActivityIndicator size="small" color={COLORS.primary} />
          </View>
        ) : (
          <BottomSheetFlatList
            data={comments}
            renderItem={renderComment}
            keyExtractor={commentKeyExtractor}
            contentContainerStyle={styles.commentsList}
            ListEmptyComponent={
              <View style={styles.commentsEmpty}>
                <Text style={styles.commentsEmptyText}>Aucun commentaire. Sois le premier !</Text>
              </View>
            }
          />
        )}

        <View style={styles.commentInputRow}>
          <TextInput
            style={styles.commentInput}
            placeholder="Ecrire un commentaire..."
            placeholderTextColor={COLORS.textMuted}
            value={commentText}
            onChangeText={setCommentText}
            maxLength={1000}
            accessibilityLabel="Ecrire un commentaire"
          />
          <Pressable
            style={[
              styles.sendCommentButton,
              !commentText.trim() && styles.sendCommentButtonDisabled,
            ]}
            onPress={handleSendComment}
            disabled={!commentText.trim() || createComment.isPending}
            accessibilityLabel="Envoyer le commentaire"
          >
            {createComment.isPending ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <Ionicons name="send" size={18} color={COLORS.white} />
            )}
          </Pressable>
        </View>
      </BottomSheet>
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
  storyItem: {
    alignItems: 'center',
    width: 68,
  },
  storyAvatarBorder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 2,
  },
  storyAvatar: {
    width: SPACING.xxl,
    height: SPACING.xxl,
    borderRadius: 24,
  },
  storyAvatarPlaceholder: {
    width: SPACING.xxl,
    height: SPACING.xxl,
    borderRadius: 24,
    backgroundColor: COLORS.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  storyUsername: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
    textAlign: 'center',
    maxWidth: 68,
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
  postCard: {
    backgroundColor: COLORS.card,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    minHeight: SPACING.xxl,
  },
  postAvatar: { width: 36, height: 36, borderRadius: 18 },
  postAvatarPlaceholder: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.surface, justifyContent: 'center', alignItems: 'center' },
  postHeaderText: { flex: 1, marginLeft: SPACING.sm },
  postUsername: { fontSize: FONT_SIZE.md, fontWeight: '600', color: COLORS.textPrimary },
  postTime: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted },
  achievementBadge: { backgroundColor: COLORS.warm + '20', padding: 6, borderRadius: BORDER_RADIUS.md },
  postContent: { fontSize: FONT_SIZE.md, color: COLORS.textPrimary, lineHeight: 22, marginBottom: SPACING.sm },
  trailBadge: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, backgroundColor: COLORS.primary + '15', paddingHorizontal: SPACING.sm, paddingVertical: SPACING.xs, borderRadius: BORDER_RADIUS.full, alignSelf: 'flex-start', marginBottom: SPACING.sm },
  trailBadgeText: { fontSize: FONT_SIZE.xs, color: COLORS.primary, fontWeight: '600' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.md, padding: SPACING.sm, marginBottom: SPACING.sm },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: FONT_SIZE.lg, fontWeight: '700', color: COLORS.textPrimary },
  statLabel: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted },
  postImage: { width: '100%', height: 200, borderRadius: BORDER_RADIUS.md, marginBottom: SPACING.sm },
  postActions: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: SPACING.sm, gap: SPACING.lg },
  likeButton: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, minWidth: SPACING.xxl, minHeight: SPACING.xxl },
  likeCount: { fontSize: FONT_SIZE.sm, color: COLORS.textMuted },
  commentButton: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, minWidth: SPACING.xxl, minHeight: SPACING.xxl },
  commentCount: { fontSize: FONT_SIZE.sm, color: COLORS.textMuted },
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

  // Modal
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    minHeight: 56,
  },
  modalCloseButton: {
    width: SPACING.xxl,
    height: SPACING.xxl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  publishButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    minHeight: SPACING.xxl,
    justifyContent: 'center',
  },
  publishButtonDisabled: {
    opacity: 0.5,
  },
  publishButtonText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.white,
  },
  postInput: {
    flex: 1,
    fontSize: FONT_SIZE.lg,
    color: COLORS.textPrimary,
    padding: SPACING.md,
    textAlignVertical: 'top',
  },
  imagePreviewContainer: {
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
  },
  imagePreview: {
    width: '100%',
    height: 220,
    borderRadius: BORDER_RADIUS.lg,
  },
  removeImageButton: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    width: SPACING.xxl,
    height: SPACING.xxl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalActions: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  addPhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.sm,
    minHeight: SPACING.xxl,
  },
  addPhotoText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.primary,
    fontWeight: '600',
  },

  // Bottom sheet - Comments
  sheetBackground: {
    backgroundColor: COLORS.surface,
  },
  sheetHandle: {
    backgroundColor: COLORS.textMuted,
    width: 40,
  },
  sheetHeader: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  sheetTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  sheetLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: SPACING.xl,
  },
  commentsList: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.md,
  },
  commentsEmpty: {
    paddingTop: SPACING.xl,
    alignItems: 'center',
  },
  commentsEmptyText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textMuted,
  },
  commentItem: {
    flexDirection: 'row',
    gap: SPACING.sm,
    paddingVertical: SPACING.sm,
  },
  commentAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  commentAvatarPlaceholder: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  commentBody: {
    flex: 1,
    gap: 2,
  },
  commentUsername: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  commentText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textPrimary,
    lineHeight: 18,
  },
  commentTime: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
  },
  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  commentInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 80,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: FONT_SIZE.sm,
    color: COLORS.textPrimary,
  },
  sendCommentButton: {
    width: SPACING.xxl,
    height: SPACING.xxl,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendCommentButtonDisabled: {
    opacity: 0.4,
  },
});
