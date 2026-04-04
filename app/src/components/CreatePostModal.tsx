import React, { useCallback, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  Image,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT_SIZE, SPACING, BORDER_RADIUS } from '@/constants';
import { supabase } from '@/lib/supabase';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
if (!SUPABASE_URL) {
  throw new Error('Missing EXPO_PUBLIC_SUPABASE_URL');
}

interface CreatePostModalProps {
  visible: boolean;
  onClose: () => void;
  onPublish: (text: string, imageUri: string | null) => Promise<void>;
  userId: string | undefined;
}

const CreatePostModal = React.memo(function CreatePostModal({
  visible,
  onClose,
  onPublish,
  userId,
}: CreatePostModalProps) {
  const [postText, setPostText] = useState('');
  const [postImageUri, setPostImageUri] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);

  const handleClose = useCallback(() => {
    setPostText('');
    setPostImageUri(null);
    onClose();
  }, [onClose]);

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
    if (!userId) return;
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
        const fileName = `posts/${userId}_${Date.now()}.${safeExt}`;
        const contentType = safeExt === 'png' ? 'image/png' : 'image/jpeg';

        const formData = new FormData();
        formData.append('', {
          uri: postImageUri,
          name: fileName,
          type: contentType,
        } as unknown as Blob);

        const { data: session } = await supabase.auth.getSession();
        const token = session?.session?.access_token;

        const uploadResponse = await fetch(
          `${SUPABASE_URL}/storage/v1/object/posts/${fileName}`,
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

      await onPublish(trimmed || '', imageUrl ?? null);
      setPostText('');
      setPostImageUri(null);
    } catch {
      Alert.alert('Erreur', "Impossible de publier le post.");
    } finally {
      setIsPublishing(false);
    }
  }, [userId, postText, postImageUri, onPublish]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.modalContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Modal header */}
        <View style={styles.modalHeader}>
          <Pressable
            style={styles.modalCloseButton}
            onPress={handleClose}
            accessibilityLabel="Fermer"
          >
            <Ionicons name="close" size={24} color={COLORS.textPrimary} />
          </Pressable>
          <Text style={styles.modalTitle}>Nouveau post</Text>
          <Pressable
            style={[
              styles.publishButton,
              (!postText.trim() && !postImageUri) && styles.publishButtonDisabled,
              isPublishing && { opacity: 0.5 },
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
  );
});

const styles = StyleSheet.create({
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
});

export default CreatePostModal;
