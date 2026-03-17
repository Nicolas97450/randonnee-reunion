import { useState } from 'react';
import { StyleSheet, Text, View, TextInput, Pressable, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT_SIZE, SPACING, BORDER_RADIUS } from '@/constants';
import { useAuth } from '@/hooks/useAuth';
import { useCreateReport } from '@/hooks/useTrailReports';
import { REPORT_LABELS, type ReportType } from '@/types';

interface Props {
  trailId: string;
  latitude: number;
  longitude: number;
  onClose: () => void;
}

const REPORT_TYPES: ReportType[] = [
  'boue', 'arbre_tombe', 'eau_haute', 'brouillard',
  'glissant', 'eboulement', 'danger', 'sentier_degrade',
  'balisage_manquant', 'autre',
];

export default function ReportForm({ trailId, latitude, longitude, onClose }: Props) {
  const { user } = useAuth();
  const createReport = useCreateReport();
  const [selectedType, setSelectedType] = useState<ReportType | null>(null);
  const [message, setMessage] = useState('');

  const handleSubmit = async () => {
    if (!selectedType || !user) {
      Alert.alert('Erreur', 'Choisis un type de signalement');
      return;
    }

    try {
      await createReport.mutateAsync({
        trail_id: trailId,
        user_id: user.id,
        report_type: selectedType,
        message: message.trim() || undefined,
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
          const isSelected = selectedType === type;
          return (
            <Pressable
              key={type}
              style={[styles.typeButton, isSelected && { borderColor: config.color, backgroundColor: config.color + '15' }]}
              onPress={() => setSelectedType(type)}
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
        style={[styles.submitButton, (!selectedType || createReport.isPending) && styles.submitDisabled]}
        onPress={handleSubmit}
        disabled={!selectedType || createReport.isPending}
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
});
