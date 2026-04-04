import { useEffect, useRef, useState } from 'react';
import { Vibration } from 'react-native';
import { haversineDistance } from '@/lib/geo';

interface Point {
  latitude: number;
  longitude: number;
}

const OFF_TRAIL_THRESHOLD_M = 100;
/** [C4] Shared cooldown — also used by useVoiceGuidance */
export const OFF_TRAIL_ALERT_COOLDOWN_MS = 60_000;

// ---------------------------------------------------------------------------
// [C1] Point-to-line-segment distance (perpendicular projection)
// Returns distance in meters between a point and the closest point on a
// line segment (A→B). Much more accurate than point-to-point for sparse traces.
// ---------------------------------------------------------------------------

function pointToSegmentDistanceM(
  p: Point,
  a: Point,
  b: Point,
): number {
  // Convert to approximate meters (good enough at La Réunion ~21°S)
  const cosLat = Math.cos((p.latitude * Math.PI) / 180);
  const px = p.longitude * cosLat;
  const py = p.latitude;
  const ax = a.longitude * cosLat;
  const ay = a.latitude;
  const bx = b.longitude * cosLat;
  const by = b.latitude;

  const dx = bx - ax;
  const dy = by - ay;
  const lenSq = dx * dx + dy * dy;

  let t = 0;
  if (lenSq > 0) {
    t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lenSq));
  }

  const closestX = ax + t * dx;
  const closestY = ay + t * dy;

  // Convert back to real distance using haversine
  return haversineDistance(p.latitude, p.longitude, closestY, closestX / cosLat) * 1000;
}

function minDistanceToTrail(position: Point, trailPoints: Point[]): number {
  if (trailPoints.length === 0) return Infinity;
  if (trailPoints.length === 1) {
    return haversineDistance(position.latitude, position.longitude, trailPoints[0].latitude, trailPoints[0].longitude) * 1000;
  }

  let minDist = Infinity;
  for (let i = 0; i < trailPoints.length - 1; i++) {
    const dist = pointToSegmentDistanceM(position, trailPoints[i], trailPoints[i + 1]);
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
      if (now - lastVibrationRef.current > OFF_TRAIL_ALERT_COOLDOWN_MS) {
        lastVibrationRef.current = now;
        Vibration.vibrate([0, 500, 200, 500]);
      }
    }
  }, [currentPosition, referenceTrail, isTracking]);

  return state;
}
