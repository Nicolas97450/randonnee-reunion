import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '@/lib/supabase';
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';

export function useAvatar(userId: string | undefined) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Load current avatar URL from user_profiles
  useEffect(() => {
    if (!userId) return;
    supabase
      .from('user_profiles')
      .select('avatar_url')
      .eq('id', userId)
      .single()
      .then(({ data }) => {
        if (data?.avatar_url) setAvatarUrl(data.avatar_url);
      })
      .catch((err) => {
        if (__DEV__) console.warn('[Avatar] load failed:', err);
      });
  }, [userId]);

  const pickAndUpload = useCallback(async () => {
    if (!userId) return;

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission requise', 'Autorise l\'acces aux photos pour changer ta photo de profil.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (result.canceled || !result.assets?.[0]) return;

    setIsUploading(true);
    try {
      const asset = result.assets[0];
      if (asset.fileSize && asset.fileSize > 2 * 1024 * 1024) {
        Alert.alert('Fichier trop volumineux', 'La photo de profil ne doit pas dépasser 2 Mo.');
        return;
      }
      const ext = asset.uri.split('.').pop()?.toLowerCase() ?? 'jpg';
      // [B10] Validate file type before upload
      const allowedExts = ['jpg', 'jpeg', 'png', 'webp'];
      if (!allowedExts.includes(ext)) {
        Alert.alert('Format non supporte', 'Seuls les formats JPEG, PNG et WebP sont acceptes.');
        return;
      }
      const safeExt = ext === 'png' ? 'png' : 'jpg';
      const fileName = `${userId}.${safeExt}`;
      const contentType = safeExt === 'png' ? 'image/png' : 'image/jpeg';

      // Lire le fichier en base64 et uploader via le SDK Supabase
      const base64 = await FileSystem.readAsStringAsync(asset.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, decode(base64), {
          contentType,
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      const publicUrl = urlData.publicUrl + '?t=' + Date.now(); // Cache bust

      // Update profile
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', userId);

      if (updateError) throw updateError;

      setAvatarUrl(publicUrl);
      Alert.alert('Photo mise a jour !');
    } catch {
      Alert.alert('Erreur', 'Impossible de mettre a jour la photo.');
    } finally {
      setIsUploading(false);
    }
  }, [userId]);

  return { avatarUrl, isUploading, pickAndUpload };
}
