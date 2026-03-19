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
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
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
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState(new Date(2026, 0, 1, 8, 0));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [placesMax, setPlacesMax] = useState('6');
  const [isPublic, setIsPublic] = useState(true);

  const dateSortie = selectedDate
    ? selectedDate.toISOString().split('T')[0]
    : '';
  const heureDepart = `${String(selectedTime.getHours()).padStart(2, '0')}:${String(selectedTime.getMinutes()).padStart(2, '0')}`;

  const onDateChange = (_event: DateTimePickerEvent, date?: Date) => {
    setShowDatePicker(false);
    if (date) setSelectedDate(date);
  };

  const onTimeChange = (_event: DateTimePickerEvent, date?: Date) => {
    setShowTimePicker(false);
    if (date) setSelectedTime(date);
  };

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
    if (!user?.id) {
      Alert.alert('Erreur', 'Authentification requise');
      return;
    }

    const places = parseInt(placesMax, 10) || 6;
    if (places < 2 || places > 20) {
      Alert.alert('Erreur', 'Le nombre de places doit etre entre 2 et 20.');
      return;
    }

    try {
      await createSortie.mutateAsync({
        trail_id: trailId,
        organisateur_id: user.id,
        titre: titre.trim(),
        description: description.trim() || undefined,
        date_sortie: dateSortie,
        heure_depart: heureDepart,
        places_max: places,
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
          accessibilityLabel="Titre de la sortie"
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
          accessibilityLabel="Description de la sortie"
        />
      </View>

      <View style={styles.row}>
        <View style={[styles.field, { flex: 1 }]}>
          <Text style={styles.label}>Date</Text>
          <Pressable style={styles.input} onPress={() => setShowDatePicker(true)} accessibilityLabel="Choisir la date de la sortie">
            <Text style={[styles.inputText, !dateSortie && styles.inputTextPlaceholder]}>
              {dateSortie || 'Choisir une date'}
            </Text>
          </Pressable>
          {showDatePicker && (
            <DateTimePicker
              value={selectedDate ?? new Date()}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              minimumDate={new Date()}
              onChange={onDateChange}
            />
          )}
        </View>
        <View style={[styles.field, { flex: 1 }]}>
          <Text style={styles.label}>Heure depart</Text>
          <Pressable style={styles.input} onPress={() => setShowTimePicker(true)} accessibilityLabel="Choisir l'heure de depart">
            <Text style={styles.inputText}>
              {heureDepart}
            </Text>
          </Pressable>
          {showTimePicker && (
            <DateTimePicker
              value={selectedTime}
              mode="time"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              is24Hour
              onChange={onTimeChange}
            />
          )}
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
            accessibilityLabel="Nombre de places maximum"
          />
        </View>
        <View style={[styles.field, { flex: 1 }]}>
          <Text style={styles.label}>Visibilite</Text>
          <Pressable
            style={[styles.input, styles.toggleRow]}
            onPress={() => setIsPublic(!isPublic)}
            accessibilityLabel={isPublic ? 'Sortie publique, appuyer pour passer en privee' : 'Sortie privee, appuyer pour passer en publique'}
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
        accessibilityLabel="Creer la sortie"
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
  inputText: { fontSize: FONT_SIZE.md, color: COLORS.textPrimary },
  inputTextPlaceholder: { color: COLORS.textMuted },
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
