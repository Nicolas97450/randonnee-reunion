import { useMemo, useState } from 'react';
import { StyleSheet, Text, View, TextInput, Pressable, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT_SIZE, SPACING, BORDER_RADIUS } from '@/constants';
import { useAuth } from '@/hooks/useAuth';
import { useCreateReport } from '@/hooks/useTrailReports';
import { useSupabaseTrails } from '@/hooks/useSupabaseTrails';
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

export default function ReportForm({ trailId, latitude, longitude, onClose }: Props) {
  const { user } = useAuth();
  const createReport = useCreateReport();
  const [selectedTypes, setSelectedTypes] = useState<ReportType[]>([]);
  const [message, setMessage] = useState('');

  // Feature 2: proximity warning
  const { trails } = useSupabaseTrails();
  const trail = useMemo(() => trails.find((t) => t.slug === trailId), [trails, trailId]);

  const distKm = useMemo(() => {
    if (!trail) return 0;
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

  const handleSubmit = async () => {
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
      await createReport.mutateAsync({
        trail_id: trailId,
        user_id: user.id,
        report_type: primaryType,
        message: finalMessage || undefined,
        latitude,
        longitude,
      });

      Alert.alert('Merci !', 'Ton signalement aide les autres randonneurs.');
      onClose();
    } catch {
      Alert.alert('Erreur', 'Impossible d\'envoyer le signalement.');
    }
  };

  return (
    <View style={styles.container}>
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
        <Pressable onPress={onClose}>
          <Ionicons name="close" size={24} color={COLORS.textMuted} />
        </Pressable>
      </View>

      <Text style={styles.subtitle}>Qu'as-tu observe sur le sentier ?</Text>

      <ScrollView style={styles.typeList} showsVerticalScrollIndicator={false}>
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
      </ScrollView>

      <TextInput
        style={styles.input}
        placeholder="Detail (optionnel) — ex: apres le 2eme lacet"
        placeholderTextColor={COLORS.textMuted}
        value={message}
        onChangeText={setMessage}
        multiline
        maxLength={200}
      />

      <Pressable
        style={[styles.submitButton, (selectedTypes.length === 0 || createReport.isPending) && styles.submitDisabled]}
        onPress={handleSubmit}
        disabled={selectedTypes.length === 0 || createReport.isPending}
      >
        <Ionicons name="send" size={18} color={COLORS.white} />
        <Text style={styles.submitText}>
          {createReport.isPending ? 'Envoi...' : 'Envoyer le signalement'}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: SPACING.md },
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
});
