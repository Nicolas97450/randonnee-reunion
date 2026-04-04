import { useEffect, useRef, useCallback } from 'react';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { navigate } from '@/lib/navigationRef';

// ─── Types ───────────────────────────────────────────────────

export type PushNotificationType =
  | 'friend_request'
  | 'friend_accepted'
  | 'direct_message'
  | 'sortie_invite'
  | 'sortie_reminder'
  | 'trail_report'
  | 'trail_reopen';

interface PushNotificationData {
  type: PushNotificationType;
  conversationId?: string;
  peerId?: string;
  peerUsername?: string;
  sortieId?: string;
  trailId?: string;
  [key: string]: string | undefined;
}

interface RegisteredNotificationResponse {
  notification: Notifications.Notification;
  actionIdentifier: string;
}

// ─── Setup notification handler ──────────────────────────────

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// ─── Hook ────────────────────────────────────────────────────

/**
 * Gère l'inscription aux notifications push Expo/FCM
 * - Enregistre le token push utilisateur dans Supabase
 * - Écoute les notifications reçues (foreground)
 * - Gère les taps sur notifications (deep linking)
 * - Nettoie le token à la déconnexion
 */
export function usePushNotifications() {
  const { user } = useAuth();
  const userId = user?.id;
  const notificationListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  // ── Register Expo push token ──
  const registerPushToken = useCallback(async () => {
    if (!userId) return;

    try {
      // Récupérer le token Expo
      const projectId = 'a8181af5-569b-456d-8c0a-98006c53bcaf'; // from app.json
      const tokenResponse = await Notifications.getExpoPushTokenAsync({ projectId });
      const expoToken = tokenResponse.data;

      if (!expoToken) {
        console.error('Failed to get Expo push token');
        return;
      }

      // Déterminer la plateforme
      const platform = Platform.OS === 'ios' ? 'ios' : 'android';

      // Sur Android, configurer le canal de notification par défaut
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Notifications Randonnée Réunion',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#16a34a',
          enableLeds: true,
          bypassDnd: false,
        });
      }

      // Stocker le token dans Supabase
      const { error } = await supabase
        .from('push_tokens')
        .upsert(
          {
            user_id: userId,
            token: expoToken,
            platform: platform,
          },
          { onConflict: 'user_id,token' }
        )
        .select()
        .single();

      if (error) {
        console.error('Failed to store push token:', error);
      }
    } catch (error) {
      console.error('Error registering push token:', error);
    }
  }, [userId]);

  // ── Handle notification received (foreground) ──
  const handleNotificationReceived = useCallback(
    (notification: Notifications.Notification) => {
      const data = notification.request.content.data as PushNotificationData;
      // La notification est affichée par le handler setNotificationHandler
      // On peut ajouter de la logique personnalisée ici si besoin
      if (data.type) {
        // Log pour le debugging
        __DEV__ && console.log('Push notification received:', data.type);
      }
    },
    []
  );

  // ── Handle notification response (tap) ──
  const handleNotificationResponse = useCallback(
    (response: RegisteredNotificationResponse) => {
      const data = response.notification.request.content.data as PushNotificationData;

      if (!data.type) return;

      // Navigation basée sur le type de notification
      switch (data.type) {
        case 'friend_request':
          navigate('SocialTab', { screen: 'Friends' });
          break;

        case 'friend_accepted':
          navigate('SocialTab', { screen: 'Friends' });
          break;

        case 'direct_message':
          if (data.conversationId && data.peerId && data.peerUsername) {
            navigate('SocialTab', {
              screen: 'Conversation',
              params: {
                conversationId: data.conversationId,
                peerId: data.peerId,
                peerUsername: data.peerUsername,
              },
            });
          }
          break;

        case 'sortie_invite':
          if (data.sortieId) {
            navigate('SortiesTab', {
              screen: 'SortieDetail',
              params: { sortieId: data.sortieId },
            });
          }
          break;

        case 'sortie_reminder':
          if (data.sortieId) {
            navigate('SortiesTab', {
              screen: 'SortieDetail',
              params: { sortieId: data.sortieId },
            });
          }
          break;

        case 'trail_report':
          // Afficher les signalements du sentier
          if (data.trailId) {
            navigate('TrailTab', {
              screen: 'TrailDetail',
              params: { trailId: data.trailId },
            });
          }
          break;

        case 'trail_reopen':
          // Afficher le détail du sentier réouvert
          if (data.trailId) {
            navigate('TrailTab', {
              screen: 'TrailDetail',
              params: { trailId: data.trailId },
            });
          }
          break;

        default:
          __DEV__ && console.warn('Unknown notification type:', data.type);
      }
    },
    []
  );

  // ── Unregister push token (logout) ──
  const unregisterPushToken = useCallback(async () => {
    if (!userId) return;

    try {
      const projectId = 'a8181af5-569b-456d-8c0a-98006c53bcaf';
      const tokenResponse = await Notifications.getExpoPushTokenAsync({ projectId });
      const expoToken = tokenResponse.data;

      if (!expoToken) return;

      // Supprimer le token de Supabase
      const { error } = await supabase
        .from('push_tokens')
        .delete()
        .eq('user_id', userId)
        .eq('token', expoToken);

      if (error) {
        console.error('Failed to unregister push token:', error);
      }
    } catch (error) {
      console.error('Error unregistering push token:', error);
    }
  }, [userId]);

  // ── Main effect: setup listeners & register token ──
  useEffect(() => {
    // Register push token when user logs in
    if (userId) {
      registerPushToken();
    }

    // Listen for notifications received
    notificationListener.current = Notifications.addNotificationReceivedListener(
      handleNotificationReceived
    );

    // Listen for notification responses (tap)
    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      handleNotificationResponse
    );

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, [userId, registerPushToken, handleNotificationReceived, handleNotificationResponse]);

  // ── Handle app killed / cold start ──
  // Check if app was opened from notification
  useEffect(() => {
    const checkLastNotification = async () => {
      const lastNotifResponse = await Notifications.getLastNotificationResponseAsync();
      if (lastNotifResponse?.notification) {
        // App was opened from notification tap
        handleNotificationResponse({
          notification: lastNotifResponse.notification,
          actionIdentifier: 'default',
        });
      }
    };

    checkLastNotification();
  }, [handleNotificationResponse]);

  return {
    registerPushToken,
    unregisterPushToken,
  };
}
