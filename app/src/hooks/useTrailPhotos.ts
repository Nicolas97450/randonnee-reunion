import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';
import { supabase } from '@/lib/supabase';

export interface TrailPhoto {
  name: string;
  url: string;
  createdAt: string;
}

/**
 * Recupere les photos du bucket trail_photos pour un sentier donne (par slug).
 */
export function useTrailPhotos(slug: string | undefined) {
  return useQuery({
    queryKey: ['trail-photos', slug],
    queryFn: async () => {
      if (!slug) return [];

      const folder = slug;
      const { data, error } = await supabase.storage
        .from('trail_photos')
        .list(folder, { limit: 50, sortBy: { column: 'created_at', order: 'desc' } });

      if (error) throw error;
      if (!data || data.length === 0) return [];

      const photos: TrailPhoto[] = data
        .filter((f) => !f.name.startsWith('.'))
        .map((file) => {
          const { data: urlData } = supabase.storage
            .from('trail_photos')
            .getPublicUrl(`${folder}/${file.name}`);

          return {
            name: file.name,
            url: urlData.publicUrl,
            createdAt: file.created_at ?? '',
          };
        });

      return photos;
    },
    enabled: !!slug,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Upload une photo dans le bucket trail_photos/<slug>/
 */
export function useUploadTrailPhoto(slug: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      if (!slug) throw new Error('Slug du sentier requis');

      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission requise', "Autorise l'acces aux photos pour ajouter une image.");
        throw new Error('Permission refusee');
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
      });

      if (result.canceled || !result.assets?.[0]) {
        throw new Error('Selection annulee');
      }

      const asset = result.assets[0];
      if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) {
        Alert.alert('Fichier trop volumineux', 'La photo ne doit pas dépasser 5 Mo.');
        return;
      }
      const ext = (asset.uri.split('.').pop() ?? 'jpg').toLowerCase();
      // [B10] Validate file type before upload
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
      const contentType = asset.mimeType ?? 'image/jpeg';
      if (!allowedTypes.includes(contentType)) {
        throw new Error('Format non supporte — JPEG, PNG ou WebP uniquement');
      }
      const fileName = `${slug}/${userId}_${Date.now()}.${ext}`;

      // Lire le fichier en base64 et uploader via le SDK Supabase
      const base64 = await FileSystem.readAsStringAsync(asset.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const { error: uploadError } = await supabase.storage
        .from('trail_photos')
        .upload(fileName, decode(base64), {
          contentType,
        });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('trail_photos')
        .getPublicUrl(fileName);

      return urlData.publicUrl;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trail-photos', slug] });
    },
    onError: (error: Error) => {
      if (error.message !== 'Selection annulee' && error.message !== 'Permission refusee') {
        Alert.alert('Erreur', "Impossible d'ajouter la photo.");
      }
    },
  });
}
