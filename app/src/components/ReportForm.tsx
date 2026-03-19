import { useMemo, useState } from 'react';
import { StyleSheet, Text, View, TextInput, Pressable, ScrollView, Alert, Image, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { COLORS, FONT_SIZE, SPACING, BORDER_RADIUS } from '@/constants';
import { guardOfflineAction } from '@/components/OfflineBanner';
import { useAuth } from '@/hooks/useAuth';
import { useCreateReport } from '@/hooks/useTrailReports';
import { useSupabaseTrails } from '@/hooks/useSupabaseTrails';
import { supabase } from '@/lib/supabase';
import { REPORT_LABELS, type ReportType } from '@/types';

interface Props {
  trailId: string;
  latitude: number;
  longitude: number;
  onClose: () => void;
}

const REPORT_TYPES: ReportType[] = [
  'boue', 'arbre_tombe', 'eau_haute', 'brouillard',
  'glissant', 'eboulement', 'neige', 'danger', 'sentier_degrade',
  'balisage_manquant', 'autre',
];

export default function ReportForm({ trailId, latitude, longitude, onClose, onPickLocation }: Props & { onPickLocation?: () => void }) {
  const { user } = useAuth();
  const createReport = useCreateReport();
  const [selectedTypes, setSelectedTypes] = useState<ReportType[]>([]);
  const [message, setMessage] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  // Feature 2: proximity warning
  const { trails } = useSupabaseTrails();
  const trail = useMemo(() => trails.find((t) => t.slug === trailId), [trails, trailId]);

  const distKm = useMemo(() => {
    if (!trail || !trail.start_point) return 0;
    const dx = (longitude - trail.start_point.longitude) * 94.5;
    const dy = (latitude - trail.start_point.latitude) * 111.0;
    return Math.sqrt(dx * dx + dy * dy);
  }, [trail, latitude, longitude]);

  const isFarFromTrail = distKm > 5;

  const toggleType = (type: ReportType) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
    );
  };

  const pickPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission requise', 'Autorise l\'acces aux photos pour ajouter une image au signalement.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.7,
    });

    if (!result.canceled && result.assets?.[0]) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission requise', 'Autorise l\'acces a la camera pour prendre une photo.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.7,
    });

    if (!result.canceled && result.assets?.[0]) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const handlePickPhoto = () => {
    Alert.alert('Ajouter une photo', 'Choisis une source', [
      { text: 'Prendre une photo', onPress: takePhoto },
      { text: 'Galerie', onPress: pickPhoto },
      { text: 'Annuler', style: 'cancel' },
    ]);
  };

  const uploadPhoto = async (reportId: string): Promise<string | null> => {
    if (!photoUri || !user) return null;

    try {
      const ext = photoUri.split('.').pop() ?? 'jpg';
      const fileName = `${reportId}.${ext}`;

      const contentType = ext === 'png' ? 'image/png' : 'image/jpeg';

      const formData = new FormData();
      formData.append('', {
        uri: photoUri,
        name: fileName,
        type: contentType,
      } as any);

      const { data: session } = await supabase.auth.getSession();
      const token = session?.session?.access_token;

      const uploadResponse = await fetch(
        `https://wnsitmaxjgbprsdpvict.supabase.co/storage/v1/object/reports/${fileName}`,
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
        .from('reports')
        .getPublicUrl(fileName);

      return urlData.publicUrl;
    } catch {
      // Photo upload failure is non-blocking
      return null;
    }
  };

  const handleSubmit = async () => {
    if (guardOfflineAction()) return;
    if (selectedTypes.length === 0 || !user) {
      Alert.alert('Erreur', 'Choisis au moins un type de signalement');
      return;
    }

    const primaryType = selectedTypes[0];
    const extraTypes = selectedTypes.slice(1);
    let finalMessage = message.trim();
    if (extraTypes.length > 0) {
      const extraLabels = extraTypes.map((t) => REPORT_LABELS[t].label.toLowerCase()).join(', ');
      finalMessage = `[Aussi: ${extraLabels}]${finalMessage ? ' ' + finalMessage : ''}`;
    }

    try {
      setIsUploadingPhoto(!!photoUri);

      // Create report first
      const report = await createReport.mutateAsync({
        trail_id: trailId,
        user_id: user.id,
        report_type: primaryType,
        message: finalMessage || undefined,
        latitude,
        longitude,
      });

      // Upload photo if selected, then update report with photo_url
      if (photoUri && report?.id) {
        const photoUrl = await uploadPhoto(report.id);
        if (photoUrl) {
          await supabase
            .from('trail_reports')
            .update({ photo_url: photoUrl })
            .eq('id', report.id);
        }
      }

      setIsUploadingPhoto(false);
      Alert.alert('Merci !', 'Ton signalement aide les autres randonneurs.');
      onClose();
    } catch {
      setIsUploadingPhoto(false);
      Alert.alert('Erreur', 'Impossible d\'envoyer le signalement.');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.containerContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      {/* Feature 2: proximity warning */}
      {isFarFromTrail && (
        <View style={styles.warningBanner}>
          <Ionicons name="location-outline" size={18} color={COLORS.warning} />
          <Text style={styles.warningText}>
            Tu sembles loin de ce sentier. Le signalement sera plus utile sur place.
          </Text>
        </View>
      )}

      <View style={styles.header}>
        <Text style={styles.title}>Signaler un probleme</Text>
        <Pressable onPress={onClose} accessibilityLabel="Fermer le formulaire de signalement">
          <Ionicons name="close" size={24} color={COLORS.textMuted} />
        </Pressable>
      </View>

      <Text style={styles.subtitle}>Qu'as-tu observe sur le sentier ?</Text>

      <View>
        {REPORT_TYPES.map((type) => {
          const config = REPORT_LABELS[type];
          const isSelected = selectedTypes.includes(type);
          return (
            <Pressable
              key={type}
              style={[styles.typeButton, isSelected && { borderColor: config.color, backgroundColor: config.color + '15' }]}
              onPress={() => toggleType(type)}
            >
              <Ionicons
                name={config.icon as keyof typeof Ionicons.glyphMap}
                size={20}
                color={isSelected ? config.color : COLORS.textMuted}
              />
              <Text style={[styles.typeLabel, isSelected && { color: config.color }]}>
                {config.label}
              </Text>
              {isSelected && <Ionicons name="checkmark-circle" size={20} color={config.color} />}
            </Pressable>
          );
        })}
      </View>

      <TextInput
        style={styles.input}
        placeholder="Detail (optionnel) — ex: apres le 2eme lacet"
        placeholderTextColor={COLORS.textMuted}
        value={message}
        onChangeText={setMessage}
        multiline
        maxLength={200}
        accessibilityLabel="Detail du signalement"
      />

      {/* Photo section */}
      <View style={styles.photoSection}>
        {photoUri ? (
          <View style={styles.photoPreviewContainer}>
            <Image source={{ uri: photoUri }} style={styles.photoPreview} />
            <Pressable
              style={styles.removePhotoButton}
              onPress={() => setPhotoUri(null)}
              accessibilityLabel="Supprimer la photo"
            >
              <Ionicons name="close-circle" size={24} color={COLORS.danger} />
            </Pressable>
          </View>
        ) : (
          <Pressable
            style={styles.addPhotoButton}
            onPress={handlePickPhoto}
            accessibilityLabel="Ajouter une photo au signalement"
          >
            <Ionicons name="camera-outline" size={22} color={COLORS.primaryLight} />
            <Text style={styles.addPhotoText}>Ajouter une photo</Text>
          </Pressable>
        )}
      </View>

      <Pressable
        style={[styles.submitButton, (selectedTypes.length === 0 || createReport.isPending || isUploadingPhoto) && styles.submitDisabled]}
        onPress={handleSubmit}
        disabled={selectedTypes.length === 0 || createReport.isPending || isUploadingPhoto}
        accessibilityLabel="Envoyer le signalement"
      >
        {(createReport.isPending || isUploadingPhoto) ? (
          <ActivityIndicator size="small" color={COLORS.white} />
        ) : (
          <Ionicons name="send" size={18} color={COLORS.white} />
        )}
        <Text style={styles.submitText}>
          {isUploadingPhoto ? 'Upload photo...' : createReport.isPending ? 'Envoi...' : 'Envoyer le signalement'}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: SPACING.md, maxHeight: '100%' },
  containerContent: { paddingBottom: SPACING.xl },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm },
  title: { fontSize: FONT_SIZE.xl, fontWeight: '700', color: COLORS.textPrimary },
  subtitle: { fontSize: FONT_SIZE.md, color: COLORS.textSecondary, marginBottom: SPACING.md },
  typeList: { maxHeight: 280 },
  typeButton: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    padding: SPACING.sm, paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.md, borderWidth: 1, borderColor: COLORS.border,
    marginBottom: SPACING.xs, backgroundColor: COLORS.card,
  },
  typeLabel: { flex: 1, fontSize: FONT_SIZE.md, color: COLORS.textSecondary },
  input: {
    backgroundColor: COLORS.card, borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
    fontSize: FONT_SIZE.md, color: COLORS.textPrimary,
    borderWidth: 1, borderColor: COLORS.border, marginTop: SPACING.md,
    minHeight: 60, textAlignVertical: 'top',
  },
  submitButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm,
    backgroundColor: COLORS.primary, borderRadius: BORDER_RADIUS.xl,
    paddingVertical: SPACING.md, marginTop: SPACING.md,
  },
  submitDisabled: { opacity: 0.5 },
  submitText: { fontSize: FONT_SIZE.md, fontWeight: '700', color: COLORS.white },
  warningBanner: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    backgroundColor: COLORS.warning + '20', borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm, marginBottom: SPACING.sm,
  },
  warningText: { flex: 1, fontSize: FONT_SIZE.sm, color: COLORS.warning },
  photoSection: {
    marginTop: SPACING.md,
  },
  addPhotoButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm,
    backgroundColor: COLORS.card, borderRadius: BORDER_RADIUS.md,
    borderWidth: 1, borderColor: COLORS.border, borderStyle: 'dashed',
    paddingVertical: SPACING.md,
  },
  addPhotoText: {
    fontSize: FONT_SIZE.md, color: COLORS.primaryLight, fontWeight: '600',
  },
  photoPreviewContainer: {
    position: 'relative', alignSelf: 'flex-start',
  },
  photoPreview: {
    width: 120, height: 120, borderRadius: BORDER_RADIUS.md,
  },
  removePhotoButton: {
    position: 'absolute', top: -8, right: -8,
    backgroundColor: COLORS.background, borderRadius: 12,
  },
});
