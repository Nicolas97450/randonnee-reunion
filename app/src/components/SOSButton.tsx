import { useState } from 'react';
import { StyleSheet, Text, View, Pressable, Alert, Linking, Vibration } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { COLORS, FONT_SIZE, SPACING, BORDER_RADIUS } from '@/constants';

// Numeros d'urgence La Reunion
const PGHM_REUNION = '0262930930'; // Secours en montagne
const SAMU = '15';
const POMPIERS = '18';
const URGENCES = '112';

interface Props {
  compact?: boolean;
}

export default function SOSButton({ compact = false }: Props) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const handleSOS = async () => {
    Alert.alert(
      'URGENCE — Confirmer l\'appel SOS',
      'Cela va envoyer ta position GPS au PGHM (secours en montagne de La Reunion). Utilise uniquement en cas de reelle urgence.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'APPELER LE PGHM',
          style: 'destructive',
          onPress: () => callPGHM(),
        },
        {
          text: 'ENVOYER PAR SMS',
          onPress: () => sendSOSSMS(),
        },
      ],
    );
  };

  const callPGHM = async () => {
    Vibration.vibrate([0, 200, 100, 200]);
    await Linking.openURL(`tel:${PGHM_REUNION}`);
  };

  const sendSOSSMS = async () => {
    setIsSending(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('GPS requis', 'Active la localisation pour envoyer ta position.');
        setIsSending(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const { latitude, longitude, altitude } = location.coords;
      const googleMapsLink = `https://maps.google.com/?q=${latitude},${longitude}`;

      const smsBody = encodeURIComponent(
        `SOS RANDONNEE - URGENCE\n` +
        `Position GPS: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}\n` +
        `Altitude: ${altitude ? Math.round(altitude) + 'm' : 'inconnue'}\n` +
        `Carte: ${googleMapsLink}\n` +
        `Envoyé depuis l'app Randonnee Reunion`
      );

      // Envoyer au PGHM
      await Linking.openURL(`sms:${PGHM_REUNION}?body=${smsBody}`);

      Vibration.vibrate([0, 500]);
    } catch {
      Alert.alert('Erreur', 'Impossible de recuperer ta position. Appelle directement le PGHM.');
      await Linking.openURL(`tel:${PGHM_REUNION}`);
    }
    setIsSending(false);
  };

  if (compact) {
    return (
      <Pressable style={styles.compactButton} onPress={handleSOS}>
        <Ionicons name="alert-circle" size={20} color={COLORS.white} />
      </Pressable>
    );
  }

  return (
    <View style={styles.container}>
      {/* Bouton SOS principal */}
      <Pressable
        style={styles.sosButton}
        onPress={handleSOS}
        onLongPress={() => setIsExpanded(!isExpanded)}
      >
        <Ionicons name="alert-circle" size={24} color={COLORS.white} />
        <Text style={styles.sosText}>SOS Urgence</Text>
      </Pressable>

      {/* Numeros d'urgence expandables */}
      {isExpanded && (
        <View style={styles.emergencyNumbers}>
          <Text style={styles.emergencyTitle}>Numeros d'urgence La Reunion</Text>

          <Pressable style={styles.numberRow} onPress={() => Linking.openURL(`tel:${PGHM_REUNION}`)}>
            <View style={styles.numberIcon}><Ionicons name="pulse" size={16} color="#DC2626" /></View>
            <View style={styles.numberInfo}>
              <Text style={styles.numberName}>PGHM — Secours en montagne</Text>
              <Text style={styles.numberValue}>{PGHM_REUNION}</Text>
            </View>
            <Ionicons name="call" size={20} color={COLORS.primary} />
          </Pressable>

          <Pressable style={styles.numberRow} onPress={() => Linking.openURL(`tel:${SAMU}`)}>
            <View style={styles.numberIcon}><Ionicons name="medkit" size={16} color="#DC2626" /></View>
            <View style={styles.numberInfo}>
              <Text style={styles.numberName}>SAMU</Text>
              <Text style={styles.numberValue}>{SAMU}</Text>
            </View>
            <Ionicons name="call" size={20} color={COLORS.primary} />
          </Pressable>

          <Pressable style={styles.numberRow} onPress={() => Linking.openURL(`tel:${POMPIERS}`)}>
            <View style={styles.numberIcon}><Ionicons name="flame" size={16} color="#F59E0B" /></View>
            <View style={styles.numberInfo}>
              <Text style={styles.numberName}>Pompiers</Text>
              <Text style={styles.numberValue}>{POMPIERS}</Text>
            </View>
            <Ionicons name="call" size={20} color={COLORS.primary} />
          </Pressable>

          <Pressable style={styles.numberRow} onPress={() => Linking.openURL(`tel:${URGENCES}`)}>
            <View style={styles.numberIcon}><Ionicons name="call" size={16} color="#3B82F6" /></View>
            <View style={styles.numberInfo}>
              <Text style={styles.numberName}>Urgences europeennes</Text>
              <Text style={styles.numberValue}>{URGENCES}</Text>
            </View>
            <Ionicons name="call" size={20} color={COLORS.primary} />
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: SPACING.md },
  sosButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm,
    backgroundColor: '#DC2626', borderRadius: BORDER_RADIUS.xl, paddingVertical: SPACING.md,
    shadowColor: '#DC2626', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 8,
  },
  sosText: { fontSize: FONT_SIZE.lg, fontWeight: '800', color: COLORS.white, textTransform: 'uppercase' },
  compactButton: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: '#DC2626',
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#DC2626', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.4, shadowRadius: 4, elevation: 4,
  },
  emergencyNumbers: {
    backgroundColor: COLORS.card, borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md, marginTop: SPACING.sm,
    borderWidth: 1, borderColor: '#DC262640',
  },
  emergencyTitle: {
    fontSize: FONT_SIZE.sm, fontWeight: '700', color: '#DC2626',
    textTransform: 'uppercase', letterSpacing: 1, marginBottom: SPACING.md,
  },
  numberRow: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    paddingVertical: SPACING.sm, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  numberIcon: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: '#DC262615',
    justifyContent: 'center', alignItems: 'center',
  },
  numberInfo: { flex: 1 },
  numberName: { fontSize: FONT_SIZE.sm, fontWeight: '600', color: COLORS.textPrimary },
  numberValue: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted },
});
