import { useCallback, useEffect, useRef, useState } from 'react';
import * as Speech from 'expo-speech';

interface Point {
  latitude: number;
  longitude: number;
  altitude?: number | null;
}

interface UseVoiceGuidanceParams {
  isTracking: boolean;
  distanceKm: number;
  trailDistanceKm: number | undefined;
  isOffTrail: boolean;
  currentPosition: Point | null;
  trailTrace: { type: string; coordinates: number[][] } | null | undefined;
}

import { OFF_TRAIL_ALERT_COOLDOWN_MS } from '@/hooks/useOffTrailAlert';

// [C4] Unified cooldown — same value as vibration alert

export function useVoiceGuidance({
  isTracking,
  distanceKm,
  trailDistanceKm,
  isOffTrail,
  currentPosition,
  trailTrace,
}: UseVoiceGuidanceParams) {
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const lastKmAnnounced = useRef(0);
  const halfwayAnnounced = useRef(false);
  const nearEndAnnounced = useRef(false);
  const offTrailLastSpoke = useRef(0);
  const wasOffTrail = useRef(false);
  const startAnnounced = useRef(false);
  const prevTracking = useRef(false);

  const speak = useCallback(async (text: string) => {
    if (!voiceEnabled) return;
    try {
      const isSpeaking = await Speech.isSpeakingAsync();
      if (isSpeaking) return;
      Speech.speak(text, { language: 'fr-FR', rate: 0.9 });
    } catch {
      // Ignore speech errors silently
    }
  }, [voiceEnabled]);

  const toggleVoice = useCallback(() => {
    setVoiceEnabled((v) => !v);
  }, []);

  // Reset refs when tracking starts
  useEffect(() => {
    if (isTracking && !prevTracking.current) {
      lastKmAnnounced.current = 0;
      halfwayAnnounced.current = false;
      nearEndAnnounced.current = false;
      offTrailLastSpoke.current = 0;
      wasOffTrail.current = false;
      startAnnounced.current = false;
    }
    prevTracking.current = isTracking;
  }, [isTracking]);

  // On start announcement
  useEffect(() => {
    if (isTracking && voiceEnabled && !startAnnounced.current) {
      startAnnounced.current = true;
      speak('Bonne randonnee, en route');
    }
  }, [isTracking, voiceEnabled, speak]);

  // Every km announcement
  useEffect(() => {
    if (!isTracking || !voiceEnabled) return;
    const currentKm = Math.floor(distanceKm);
    if (currentKm > 0 && currentKm > lastKmAnnounced.current) {
      lastKmAnnounced.current = currentKm;
      speak(`Tu as parcouru ${currentKm} kilometres`);
    }
  }, [isTracking, voiceEnabled, distanceKm, speak]);

  // 50% progress
  useEffect(() => {
    if (!isTracking || !voiceEnabled || !trailDistanceKm || trailDistanceKm <= 0) return;
    const progress = distanceKm / trailDistanceKm;
    if (progress >= 0.5 && !halfwayAnnounced.current) {
      halfwayAnnounced.current = true;
      speak('Tu es a mi-parcours');
    }
  }, [isTracking, voiceEnabled, distanceKm, trailDistanceKm, speak]);

  // 90% progress
  useEffect(() => {
    if (!isTracking || !voiceEnabled || !trailDistanceKm || trailDistanceKm <= 0) return;
    const progress = distanceKm / trailDistanceKm;
    const remainingM = Math.round((trailDistanceKm - distanceKm) * 1000);
    if (progress >= 0.9 && !nearEndAnnounced.current && remainingM > 0) {
      nearEndAnnounced.current = true;
      speak(`Bientot l'arrivee, plus que ${remainingM} metres`);
    }
  }, [isTracking, voiceEnabled, distanceKm, trailDistanceKm, speak]);

  // Off-trail warning (with 2min cooldown)
  useEffect(() => {
    if (!isTracking || !voiceEnabled) return;
    const now = Date.now();

    if (isOffTrail && !wasOffTrail.current) {
      // Just went off trail
      if (now - offTrailLastSpoke.current > OFF_TRAIL_ALERT_COOLDOWN_MS) {
        offTrailLastSpoke.current = now;
        speak('Attention, tu t\'eloignes du sentier');
      }
    } else if (!isOffTrail && wasOffTrail.current) {
      // Just came back on trail
      speak('Tu es de retour sur le sentier');
    }

    wasOffTrail.current = isOffTrail;
  }, [isTracking, voiceEnabled, isOffTrail, speak]);

  // [F2] On stop announcement — single clean effect replacing dead code
  const trackingJustStopped = useRef(false);
  useEffect(() => {
    if (!isTracking && trackingJustStopped.current && voiceEnabled) {
      speak('Randonnee terminee, bravo');
      trackingJustStopped.current = false;
    }
    if (isTracking) {
      trackingJustStopped.current = true;
    }
  }, [isTracking, voiceEnabled, speak]);

  return {
    voiceEnabled,
    toggleVoice,
  };
}
