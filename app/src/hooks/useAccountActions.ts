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
      const [profile, activities, sorties, participants, messages, reports, emergencyContacts, friendships, posts, postLikes, postComments, reviews, favorites, liveTracking] = await Promise.all([
        supabase.from('user_profiles').select('*').eq('id', userId).single(),
        supabase.from('user_activities').select('*').eq('user_id', userId),
        supabase.from('sorties').select('*').eq('organisateur_id', userId),
        supabase.from('sortie_participants').select('*').eq('user_id', userId),
        supabase.from('sortie_messages').select('*').eq('user_id', userId),
        supabase.from('trail_reports').select('*').eq('user_id', userId),
        supabase.from('user_emergency_contacts').select('*').eq('user_id', userId),
        supabase.from('friendships').select('*').or(`requester_id.eq.${userId},addressee_id.eq.${userId}`),
        supabase.from('posts').select('*').eq('user_id', userId),
        supabase.from('post_likes').select('*').eq('user_id', userId),
        supabase.from('post_comments').select('*').eq('user_id', userId),
        supabase.from('trail_reviews').select('*').eq('user_id', userId),
        supabase.from('user_favorites').select('*').eq('user_id', userId),
        supabase.from('live_tracking').select('*').eq('user_id', userId),
      ]);

      const exportData = {
        exported_at: new Date().toISOString(),
        profile: profile.data,
        activities: activities.data ?? [],
        sorties_organisees: sorties.data ?? [],
        sorties_rejointes: participants.data ?? [],
        messages: messages.data ?? [],
        signalements: reports.data ?? [],
        contacts_urgence: emergencyContacts.data ?? [],
        amis: friendships.data ?? [],
        posts: posts.data ?? [],
        likes: postLikes.data ?? [],
        commentaires: postComments.data ?? [],
        avis: reviews.data ?? [],
        favoris: favorites.data ?? [],
        partages_position: liveTracking.data ?? [],
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
        'Toutes tes donnees (profil, sentiers, sorties, messages, avis) seront supprimees. Ton compte d\'authentification sera desactive et automatiquement supprime sous 30 jours conformement au RGPD. Cette action est IRREVERSIBLE.',
        [
          { text: 'Annuler', style: 'cancel', onPress: () => resolve(false) },
          {
            text: 'SUPPRIMER DEFINITIVEMENT',
            style: 'destructive',
            onPress: async () => {
              try {
                // Supprimer l'avatar du storage Supabase
                const extensions = ['jpg', 'jpeg', 'png', 'webp'];
                const avatarFiles = extensions.map((ext) => `${userId}.${ext}`);
                await supabase.storage.from('avatars').remove(avatarFiles);

                // Supprimer toutes les donnees utilisateur
                // L'ordre est important a cause des foreign keys
                await supabase.from('post_comments').delete().eq('user_id', userId);
                await supabase.from('post_likes').delete().eq('user_id', userId);
                await supabase.from('posts').delete().eq('user_id', userId);
                await supabase.from('live_tracking').delete().eq('user_id', userId);
                await supabase.from('trail_reviews').delete().eq('user_id', userId);
                await supabase.from('user_favorites').delete().eq('user_id', userId);
                await supabase.from('friendships').delete().or(`requester_id.eq.${userId},addressee_id.eq.${userId}`);
                await supabase.from('sortie_messages').delete().eq('user_id', userId);
                await supabase.from('sortie_participants').delete().eq('user_id', userId);
                await supabase.from('sorties').delete().eq('organisateur_id', userId);
                await supabase.from('trail_reports').delete().eq('user_id', userId);
                await supabase.from('user_activities').delete().eq('user_id', userId);
                await supabase.from('user_emergency_contacts').delete().eq('user_id', userId);
                await supabase.from('user_profiles').delete().eq('id', userId);

                // Deconnecter — le compte auth sera supprime sous 30 jours
                // (necessite une Edge Function avec service_role pour suppression immediate)
                await signOut();

                Alert.alert(
                  'Compte supprime',
                  'Toutes tes donnees ont ete supprimees. Ton compte d\'authentification sera desactive et supprime sous 30 jours.',
                );
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
