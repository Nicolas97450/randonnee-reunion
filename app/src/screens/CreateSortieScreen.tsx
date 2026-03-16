import { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Pressable,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { COLORS, FONT_SIZE, SPACING, BORDER_RADIUS } from '@/constants';
import { useAuth } from '@/hooks/useAuth';
import { useCreateSortie } from '@/hooks/useSorties';

interface Props {
  trailId?: string;
  trailName?: string;
}

export default function CreateSortieScreen({ route }: { route: { params?: Props } }) {
  const navigation = useNavigation();
  const { user } = useAuth();
  const createSortie = useCreateSortie();

  const trailId = route.params?.trailId ?? '';
  const trailName = route.params?.trailName ?? '';

  const [titre, setTitre] = useState(trailName ? `Rando ${trailName}` : '');
  const [description, setDescription] = useState('');
  const [dateSortie, setDateSortie] = useState('');
  const [heureDepart, setHeureDepart] = useState('08:00');
  const [placesMax, setPlacesMax] = useState('6');
  const [isPublic, setIsPublic] = useState(true);

  const handleCreate = async () => {
    if (!titre.trim()) {
      Alert.alert('Erreur', 'Donne un titre a ta sortie');
      return;
    }
    if (!dateSortie) {
      Alert.alert('Erreur', 'Choisis une date (format AAAA-MM-JJ)');
      return;
    }
    if (!trailId) {
      Alert.alert('Erreur', 'Aucun sentier selectionne');
      return;
    }

    try {
      await createSortie.mutateAsync({
        trail_id: trailId,
        organisateur_id: user!.id,
        titre: titre.trim(),
        description: description.trim() || undefined,
        date_sortie: dateSortie,
        heure_depart: heureDepart,
        places_max: parseInt(placesMax, 10) || 6,
        is_public: isPublic,
      });

      Alert.alert('Sortie creee !', 'Les randonneurs pourront la rejoindre.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch {
      Alert.alert('Erreur', 'Impossible de creer la sortie.');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Organiser une sortie</Text>

      {trailName ? (
        <View style={styles.trailBadge}>
          <Ionicons name="trail-sign" size={16} color={COLORS.primary} />
          <Text style={styles.trailBadgeText}>{trailName}</Text>
        </View>
      ) : null}

      <View style={styles.field}>
        <Text style={styles.label}>Titre</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: Rando Piton des Neiges"
          placeholderTextColor={COLORS.textMuted}
          value={titre}
          onChangeText={setTitre}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Description (optionnel)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Niveau requis, materiel, point de RDV..."
          placeholderTextColor={COLORS.textMuted}
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={3}
        />
      </View>

      <View style={styles.row}>
        <View style={[styles.field, { flex: 1 }]}>
          <Text style={styles.label}>Date (AAAA-MM-JJ)</Text>
          <TextInput
            style={styles.input}
            placeholder="2026-04-15"
            placeholderTextColor={COLORS.textMuted}
            value={dateSortie}
            onChangeText={setDateSortie}
          />
        </View>
        <View style={[styles.field, { flex: 1 }]}>
          <Text style={styles.label}>Heure depart</Text>
          <TextInput
            style={styles.input}
            placeholder="08:00"
            placeholderTextColor={COLORS.textMuted}
            value={heureDepart}
            onChangeText={setHeureDepart}
          />
        </View>
      </View>

      <View style={styles.row}>
        <View style={[styles.field, { flex: 1 }]}>
          <Text style={styles.label}>Places max (2-20)</Text>
          <TextInput
            style={styles.input}
            placeholder="6"
            placeholderTextColor={COLORS.textMuted}
            value={placesMax}
            onChangeText={setPlacesMax}
            keyboardType="number-pad"
          />
        </View>
        <View style={[styles.field, { flex: 1 }]}>
          <Text style={styles.label}>Visibilite</Text>
          <Pressable
            style={[styles.input, styles.toggleRow]}
            onPress={() => setIsPublic(!isPublic)}
          >
            <Ionicons
              name={isPublic ? 'earth' : 'lock-closed'}
              size={18}
              color={COLORS.textPrimary}
            />
            <Text style={styles.toggleText}>{isPublic ? 'Publique' : 'Sur invitation'}</Text>
          </Pressable>
        </View>
      </View>

      <Pressable
        style={[styles.button, createSortie.isPending && styles.buttonDisabled]}
        onPress={handleCreate}
        disabled={createSortie.isPending}
      >
        <Ionicons name="add-circle" size={20} color={COLORS.white} />
        <Text style={styles.buttonText}>
          {createSortie.isPending ? 'Creation...' : 'Creer la sortie'}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.md, paddingBottom: SPACING.xxl },
  title: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.lg,
  },
  trailBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.primary + '15',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  trailBadgeText: { fontSize: FONT_SIZE.md, color: COLORS.primary, fontWeight: '600' },
  field: { marginBottom: SPACING.md },
  label: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
    fontWeight: '600',
  },
  input: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    fontSize: FONT_SIZE.md,
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  row: { flexDirection: 'row', gap: SPACING.md },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  toggleText: { fontSize: FONT_SIZE.md, color: COLORS.textPrimary },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.xl,
    paddingVertical: SPACING.md,
    marginTop: SPACING.lg,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { fontSize: FONT_SIZE.lg, fontWeight: '700', color: COLORS.white },
});
