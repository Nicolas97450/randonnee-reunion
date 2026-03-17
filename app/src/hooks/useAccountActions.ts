import { Alert } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

export function useAccountActions() {
  const signOut = useAuthStore((s) => s.signOut);

  // Exporter toutes les donnees personnelles (RGPD Art. 20)
  const exportMyData = async (userId: string) => {
    try {
      // Recuperer toutes les donnees de l'utilisateur
      const [profile, activities, sorties, participants, messages] = await Promise.all([
        supabase.from('user_profiles').select('*').eq('id', userId).single(),
        supabase.from('user_activities').select('*').eq('user_id', userId),
        supabase.from('sorties').select('*').eq('organisateur_id', userId),
        supabase.from('sortie_participants').select('*').eq('user_id', userId),
        supabase.from('sortie_messages').select('*').eq('user_id', userId),
      ]);

      const exportData = {
        exported_at: new Date().toISOString(),
        profile: profile.data,
        activities: activities.data ?? [],
        sorties_organisees: sorties.data ?? [],
        sorties_rejointes: participants.data ?? [],
        messages: messages.data ?? [],
      };

      // Sauvegarder en fichier JSON
      const filePath = `${FileSystem.documentDirectory}mes_donnees_randonnee_reunion.json`;
      await FileSystem.writeAsStringAsync(filePath, JSON.stringify(exportData, null, 2));

      // Partager le fichier
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(filePath, {
          mimeType: 'application/json',
          dialogTitle: 'Exporter mes donnees',
        });
      } else {
        Alert.alert('Export', `Donnees exportees dans : ${filePath}`);
      }

      return { success: true };
    } catch {
      Alert.alert('Erreur', "Impossible d'exporter les donnees.");
      return { success: false };
    }
  };

  // Supprimer le compte et toutes les donnees (RGPD Art. 17)
  const deleteMyAccount = async (userId: string) => {
    return new Promise<boolean>((resolve) => {
      Alert.alert(
        'Supprimer mon compte',
        'Cette action est IRREVERSIBLE. Toutes tes donnees seront supprimees : profil, sentiers valides, sorties, messages. Tu ne pourras pas recuperer ton compte.',
        [
          { text: 'Annuler', style: 'cancel', onPress: () => resolve(false) },
          {
            text: 'SUPPRIMER DEFINITIVEMENT',
            style: 'destructive',
            onPress: async () => {
              try {
                // Supprimer toutes les donnees utilisateur
                // L'ordre est important a cause des foreign keys
                await supabase.from('sortie_messages').delete().eq('user_id', userId);
                await supabase.from('sortie_participants').delete().eq('user_id', userId);
                await supabase.from('sorties').delete().eq('organisateur_id', userId);
                await supabase.from('trail_reports').delete().eq('user_id', userId);
                await supabase.from('user_activities').delete().eq('user_id', userId);
                await supabase.from('user_emergency_contacts').delete().eq('user_id', userId);
                await supabase.from('user_profiles').delete().eq('id', userId);

                // Deconnecter
                await signOut();

                Alert.alert('Compte supprime', 'Toutes tes donnees ont ete supprimees.');
                resolve(true);
              } catch {
                Alert.alert('Erreur', 'Impossible de supprimer le compte. Contacte le support.');
                resolve(false);
              }
            },
          },
        ],
      );
    });
  };

  return { exportMyData, deleteMyAccount };
}
