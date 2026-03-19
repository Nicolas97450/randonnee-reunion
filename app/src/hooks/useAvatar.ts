import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '@/lib/supabase';

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
      const ext = asset.uri.split('.').pop()?.toLowerCase() ?? 'jpg';
      const safeExt = ext === 'png' ? 'png' : 'jpg';
      const fileName = `${userId}.${safeExt}`;
      const contentType = safeExt === 'png' ? 'image/png' : 'image/jpeg';

      // Upload via fetch + FormData (fiable sur React Native)
      const formData = new FormData();
      formData.append('', {
        uri: asset.uri,
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
