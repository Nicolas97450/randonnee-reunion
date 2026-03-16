import { useEffect, useRef } from 'react';
import { Vibration, Alert } from 'react-native';

interface Point {
  latitude: number;
  longitude: number;
}

const OFF_TRAIL_THRESHOLD_M = 200;
const ALERT_COOLDOWN_MS = 60000; // Don't spam: 1 alert per minute max

function haversineDistance(a: Point, b: Point): number {
  const R = 6371000; // Earth radius in meters
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLon = ((b.longitude - a.longitude) * Math.PI) / 180;
  const lat1 = (a.latitude * Math.PI) / 180;
  const lat2 = (b.latitude * Math.PI) / 180;

  const x =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
  return R * c;
}

function minDistanceToTrail(position: Point, trailPoints: Point[]): number {
  let minDist = Infinity;
  for (const tp of trailPoints) {
    const dist = haversineDistance(position, tp);
    if (dist < minDist) minDist = dist;
  }
  return minDist;
}

export function useOffTrailAlert(
  currentPosition: Point | null,
  referenceTrail: Point[],
  isTracking: boolean,
) {
  const lastAlertRef = useRef(0);

  useEffect(() => {
    if (!isTracking || !currentPosition || referenceTrail.length === 0) return;

    const distance = minDistanceToTrail(currentPosition, referenceTrail);

    if (distance > OFF_TRAIL_THRESHOLD_M) {
      const now = Date.now();
      if (now - lastAlertRef.current > ALERT_COOLDOWN_MS) {
        lastAlertRef.current = now;
        Vibration.vibrate([0, 500, 200, 500]);
        Alert.alert(
          'Hors sentier',
          `Tu es a ${Math.round(distance)}m du sentier de reference. Verifie ta position.`,
        );
      }
    }
  }, [currentPosition, referenceTrail, isTracking]);
}
