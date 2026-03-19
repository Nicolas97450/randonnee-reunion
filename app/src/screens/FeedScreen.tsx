import React, { useState, useCallback } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { COLORS, FONT_SIZE, SPACING, BORDER_RADIUS } from '@/constants';
import { useAuth } from '@/hooks/useAuth';
import { useFeed, useCreatePost, useToggleLike, type Post, type FeedFilter } from '@/hooks/useFeed';
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
  onUserPress: (userId: string, username: string | null) => void;
}

const PostItem = React.memo(function PostItem({ post, onLike, onUserPress }: PostItemProps) {
  const username = post.user?.username ?? 'Randonneur';
  const avatarUrl = post.user?.avatar_url;
  const stats = post.stats as Record<string, number> | null;

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
          <Text style={styles.trailBadgeText}>{post.trail.name}</Text>
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
          onPress={() => onLike(post)}
          accessibilityLabel="Aimer ce post"
        >
          <Ionicons
            name={post.liked_by_me ? 'heart' : 'heart-outline'}
            size={20}
            color={post.liked_by_me ? COLORS.danger : COLORS.textMuted}
          />
          <Text style={[styles.likeCount, post.liked_by_me && { color: COLORS.danger }]}>
            {post.like_count ?? 0}
          </Text>
        </Pressable>
      </View>
    </View>
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

  const { data: posts = [], isLoading, error, refetch } = useFeed(feedFilter);
  const toggleLike = useToggleLike();
  const createPost = useCreatePost();

  const handleLike = useCallback((post: Post) => {
    if (!user?.id) return;
    toggleLike.mutate({ postId: post.id, userId: user.id, isLiked: post.liked_by_me ?? false });
  }, [user?.id, toggleLike]);

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
      <PostItem post={item} onLike={handleLike} onUserPress={handleUserPress} />
    ),
    [handleLike, handleUserPress],
  );

  const keyExtractor = useCallback((item: Post) => item.id, []);

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
        const ext = postImageUri.split('.').pop() ?? 'jpg';
        const fileName = `posts/${user.id}_${Date.now()}.${ext}`;

        const response = await fetch(postImageUri);
        const blob = await response.blob();

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, blob, {
            contentType: `image/${ext === 'png' ? 'png' : 'jpeg'}`,
            upsert: false,
          });

        if (uploadError) throw uploadError;

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
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.emptySubtext}>Chargement du feed...</Text>
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
    minHeight: 48,
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
    minHeight: 48,
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
  postActions: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: SPACING.sm },
  likeButton: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, minWidth: 48, minHeight: 48 },
  likeCount: { fontSize: FONT_SIZE.sm, color: COLORS.textMuted },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: SPACING.sm, paddingTop: 100 },
  emptyText: { fontSize: FONT_SIZE.lg, color: COLORS.textMuted },
  emptySubtext: { fontSize: FONT_SIZE.sm, color: COLORS.textMuted },
  retryButton: {
    marginTop: SPACING.md,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.sm,
    minHeight: 48,
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
    width: 48,
    height: 48,
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
    minHeight: 48,
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
    width: 48,
    height: 48,
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
    minHeight: 48,
  },
  addPhotoText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.primary,
    fontWeight: '600',
  },
});
