import { Alert, Linking } from 'react-native';

// Integration Strava — Export d'activite apres validation d'un sentier
// En V2 complete, on utilisera l'API Strava OAuth pour poster directement
// Pour l'instant : partage via deep link Strava

const STRAVA_APP_URL = 'strava://';
const STRAVA_WEB_URL = 'https://www.strava.com/upload/select';

interface TrailActivity {
  trailName: string;
  distanceKm: number;
  durationMin: number;
  elevationGain: number;
  date: string;
}

export function useStravaExport() {
  const exportToStrava = async (activity: TrailActivity) => {
    // Verifie si Strava est installe
    const canOpenStrava = await Linking.canOpenURL(STRAVA_APP_URL).catch(() => false);

    if (canOpenStrava) {
      // Ouvre Strava pour enregistrer manuellement
      Alert.alert(
        'Partager sur Strava',
        `Rando "${activity.trailName}" — ${activity.distanceKm}km, ${activity.durationMin}min, +${activity.elevationGain}m\n\nStrava va s'ouvrir pour enregistrer ton activite.`,
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Ouvrir Strava',
            onPress: () => Linking.openURL(STRAVA_APP_URL),
          },
        ],
      );
    } else {
      // Strava pas installe — proposer le web ou l'installation
      Alert.alert(
        'Strava non installe',
        'Installe Strava pour partager tes randonnees avec ta communaute sportive.',
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Installer Strava',
            onPress: () => Linking.openURL('https://play.google.com/store/apps/details?id=com.strava'),
          },
        ],
      );
    }
  };

  const shareActivityText = (activity: TrailActivity): string => {
    return `Je viens de faire "${activity.trailName}" a La Reunion !\n` +
      `${activity.distanceKm}km | +${activity.elevationGain}m | ${activity.durationMin}min\n` +
      `via Randonnee Reunion`;
  };

  return { exportToStrava, shareActivityText };
}
