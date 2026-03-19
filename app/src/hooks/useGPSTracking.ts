import { useState, useEffect, useCallback, useRef } from 'react';
import * as Location from 'expo-location';

interface GPSPoint {
  latitude: number;
  longitude: number;
  altitude: number | null;
  accuracy: number | null;
  timestamp: number;
}

interface TrackStats {
  distanceKm: number;
  durationMin: number;
  elevationGain: number;
  pointCount: number;
}

interface UseGPSTrackingResult {
  currentPosition: GPSPoint | null;
  track: GPSPoint[];
  isTracking: boolean;
  error: string | null;
  startTracking: () => Promise<void>;
  stopTracking: () => void;
  clearTrack: () => void;
  getTrackStats: () => TrackStats;
}

const TRACKING_INTERVAL = 5000; // 5 seconds
const DISTANCE_FILTER = 10; // 10 meters minimum movement

export function useGPSTracking(): UseGPSTrackingResult {
  const [currentPosition, setCurrentPosition] = useState<GPSPoint | null>(null);
  const [track, setTrack] = useState<GPSPoint[]>([]);
  const [isTracking, setIsTracking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const subscriptionRef = useRef<Location.LocationSubscription | null>(null);

  const startTracking = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError("Permission de localisation refusee. Active-la dans les parametres.");
        return;
      }

      setError(null);
      setIsTracking(true);

      // Get initial position
      const initial = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const initialPoint: GPSPoint = {
        latitude: initial.coords.latitude,
        longitude: initial.coords.longitude,
        altitude: initial.coords.altitude,
        accuracy: initial.coords.accuracy,
        timestamp: initial.timestamp,
      };

      setCurrentPosition(initialPoint);
      setTrack([initialPoint]);

      // Start watching
      subscriptionRef.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: TRACKING_INTERVAL,
          distanceInterval: DISTANCE_FILTER,
        },
        (location) => {
          const point: GPSPoint = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            altitude: location.coords.altitude,
            accuracy: location.coords.accuracy,
            timestamp: location.timestamp,
          };

          setCurrentPosition(point);
          setTrack((prev) => [...prev, point]);
        },
      );
    } catch (err) {
      setError("Impossible d'acceder au GPS.");
      setIsTracking(false);
    }
  }, []);

  const stopTracking = useCallback(() => {
    if (subscriptionRef.current) {
      subscriptionRef.current.remove();
      subscriptionRef.current = null;
    }
    setIsTracking(false);
  }, []);

  const clearTrack = useCallback(() => {
    setTrack([]);
  }, []);

  const getTrackStats = useCallback((): TrackStats => {
    // Distance (same haversine approximation used elsewhere)
    let distanceKm = 0;
    for (let i = 1; i < track.length; i++) {
      const dx = track[i].longitude - track[i - 1].longitude;
      const dy = track[i].latitude - track[i - 1].latitude;
      distanceKm += Math.sqrt((dx * 94.5) ** 2 + (dy * 111.0) ** 2);
    }

    // Duration
    let durationMin = 0;
    if (track.length >= 2) {
      durationMin = Math.round(
        (track[track.length - 1].timestamp - track[0].timestamp) / 60000,
      );
    }

    // Elevation gain (sum of positive altitude differences)
    let elevationGain = 0;
    for (let i = 1; i < track.length; i++) {
      const prev = track[i - 1].altitude;
      const curr = track[i].altitude;
      if (prev !== null && curr !== null && curr > prev) {
        elevationGain += curr - prev;
      }
    }

    return {
      distanceKm,
      durationMin,
      elevationGain: Math.round(elevationGain),
      pointCount: track.length,
    };
  }, [track]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.remove();
      }
    };
  }, []);

  return {
    currentPosition,
    track,
    isTracking,
    error,
    startTracking,
    stopTracking,
    clearTrack,
    getTrackStats,
  };
}
