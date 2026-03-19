import { useEffect, useRef, useState } from 'react';
import { Vibration } from 'react-native';
import { haversineDistance } from '@/lib/geo';

interface Point {
  latitude: number;
  longitude: number;
}

const OFF_TRAIL_THRESHOLD_M = 200;
const ALERT_COOLDOWN_MS = 60000; // Don't spam: 1 alert per minute max

function minDistanceToTrail(position: Point, trailPoints: Point[]): number {
  let minDist = Infinity;
  for (const tp of trailPoints) {
    const dist = haversineDistance(position.latitude, position.longitude, tp.latitude, tp.longitude) * 1000;
    if (dist < minDist) minDist = dist;
  }
  return minDist;
}

interface OffTrailState {
  isOffTrail: boolean;
  distanceM: number;
}

export function useOffTrailAlert(
  currentPosition: Point | null,
  referenceTrail: Point[],
  isTracking: boolean,
): OffTrailState {
  const lastVibrationRef = useRef(0);
  const [state, setState] = useState<OffTrailState>({ isOffTrail: false, distanceM: 0 });

  useEffect(() => {
    if (!isTracking || !currentPosition || referenceTrail.length === 0) {
      setState({ isOffTrail: false, distanceM: 0 });
      return;
    }

    const distance = minDistanceToTrail(currentPosition, referenceTrail);
    const isOff = distance > OFF_TRAIL_THRESHOLD_M;

    setState({ isOffTrail: isOff, distanceM: Math.round(distance) });

    if (isOff) {
      const now = Date.now();
      if (now - lastVibrationRef.current > ALERT_COOLDOWN_MS) {
        lastVibrationRef.current = now;
        Vibration.vibrate([0, 500, 200, 500]);
      }
    }
  }, [currentPosition, referenceTrail, isTracking]);

  return state;
}
