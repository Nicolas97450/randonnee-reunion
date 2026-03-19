import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

interface LiveSession {
  id: string;
  isActive: boolean;
}

interface UseLiveShareResult {
  liveSession: LiveSession | null;
  isSharing: boolean;
  startSharing: (trailSlug: string) => Promise<void>;
  stopSharing: () => Promise<void>;
  updatePosition: (lat: number, lng: number, altitude?: number | null, speedKmh?: number) => Promise<void>;
}

const UPDATE_THROTTLE_MS = 30_000; // 30 seconds

export function useLiveShare(): UseLiveShareResult {
  const { user } = useAuth();
  const [liveSession, setLiveSession] = useState<LiveSession | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const lastUpdateRef = useRef<number>(0);

  // Cleanup on unmount: deactivate any active session
  useEffect(() => {
    return () => {
      if (liveSession?.id) {
        supabase
          .from('live_tracking')
          .update({ is_active: false, updated_at: new Date().toISOString() })
          .eq('id', liveSession.id)
          .then(() => {});
      }
    };
  }, [liveSession?.id]);

  const startSharing = useCallback(async (trailSlug: string) => {
    if (!user?.id) {
      Alert.alert('Erreur', 'Tu dois etre connecte pour partager ta position.');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('live_tracking')
        .insert({
          user_id: user.id,
          trail_slug: trailSlug,
          is_active: true,
        })
        .select('id')
        .single();

      if (error || !data) {
        Alert.alert('Erreur', 'Impossible de demarrer le partage.');
        return;
      }

      const sessionId = data.id;
      setLiveSession({ id: sessionId, isActive: true });
      setIsSharing(true);

      // Copy link to clipboard
      const link = `randonnee-reunion.re/live/${sessionId}`;
      await Clipboard.setStringAsync(link);
      Alert.alert(
        'Position partagee',
        `Lien copie dans le presse-papier :\n${link}\n\nTes proches peuvent suivre ta rando en direct.`,
      );
    } catch {
      Alert.alert('Erreur', 'Impossible de demarrer le partage.');
    }
  }, [user?.id]);

  const stopSharing = useCallback(async () => {
    if (!liveSession?.id) return;

    try {
      await supabase
        .from('live_tracking')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', liveSession.id);
    } catch {
      // Silent fail — session will expire
    }

    setLiveSession(null);
    setIsSharing(false);
  }, [liveSession?.id]);

  const updatePosition = useCallback(async (
    lat: number,
    lng: number,
    altitude?: number | null,
    speedKmh?: number,
  ) => {
    if (!liveSession?.id || !isSharing) return;

    // Throttle updates to every 30 seconds
    const now = Date.now();
    if (now - lastUpdateRef.current < UPDATE_THROTTLE_MS) return;
    lastUpdateRef.current = now;

    try {
      await supabase
        .from('live_tracking')
        .update({
          latitude: lat,
          longitude: lng,
          altitude: altitude ?? null,
          speed_kmh: speedKmh ?? null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', liveSession.id);
    } catch {
      // Silent fail — next update will retry
    }
  }, [liveSession?.id, isSharing]);

  return {
    liveSession,
    isSharing,
    startSharing,
    stopSharing,
    updatePosition,
  };
}
