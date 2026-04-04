import { useState, useEffect, useCallback, useRef } from 'react';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { haversineDistance } from '@/lib/geo';
import { COLORS } from '@/constants/theme';

// NOTE: android.permission.ACCESS_BACKGROUND_LOCATION is declared in app.json
// for Expo managed workflow. On Android 10+, the user must grant "Allow all the time".

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

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

interface TrackBackup {
  track: GPSPoint[];
  startTime: number;
  trailId?: string;
}

interface UseGPSTrackingResult {
  currentPosition: GPSPoint | null;
  track: GPSPoint[];
  isTracking: boolean;
  error: string | null;
  pendingBackup: TrackBackup | null;
  startTracking: (trailId?: string) => Promise<void>;
  stopTracking: () => Promise<void>;
  clearTrack: () => void;
  getTrackStats: () => TrackStats;
  restoreBackup: () => void;
  dismissBackup: () => void;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const BACKGROUND_LOCATION_TASK = 'background-location-task';
const TRACKING_INTERVAL = 3000; // [C8] 3 seconds — better accuracy for hiking
const DISTANCE_FILTER = 8; // [C8] 8 meters — reduces jitter while keeping trail fidelity
const BACKUP_KEY = '@gps_track_backup';
const BACKUP_INTERVAL_MS = 30_000; // 30 seconds
const SYNC_INTERVAL_MS = 3_000; // sync module buffer -> React state every 3s

// ---------------------------------------------------------------------------
// Module-level buffer for the background task
// ---------------------------------------------------------------------------

let _backgroundPoints: GPSPoint[] = [];
let _isBackgroundTracking = false;
let _foregroundWatcher: Location.LocationSubscription | null = null;

/**
 * Background location task — defined at module level so TaskManager can
 * invoke it even when the component tree is unmounted / screen is locked.
 */
TaskManager.defineTask(BACKGROUND_LOCATION_TASK, async ({ data, error }) => {
  if (error) {
    console.warn('[GPS background] task error:', error.message);
    return;
  }

  const { locations } = data as { locations: Location.LocationObject[] };
  if (!locations || locations.length === 0) return;

  for (const loc of locations) {
    // [A4] Filter out low-accuracy points (GPS drift in forest/cliffs)
    if (loc.coords.accuracy != null && loc.coords.accuracy > 20) continue;

    const point: GPSPoint = {
      latitude: loc.coords.latitude,
      longitude: loc.coords.longitude,
      altitude: loc.coords.altitude,
      accuracy: loc.coords.accuracy,
      timestamp: loc.timestamp,
    };

    // [A4] Filter out speed outliers (> 15 km/h = not hiking)
    if (_backgroundPoints.length > 0) {
      const prev = _backgroundPoints[_backgroundPoints.length - 1];
      const dt = (point.timestamp - prev.timestamp) / 1000; // seconds
      if (dt > 0) {
        const dist = haversineDistance(prev.latitude, prev.longitude, point.latitude, point.longitude);
        const speedKmH = (dist / dt) * 3600;
        if (speedKmH > 15) continue;
      }
    }

    _backgroundPoints.push(point);
  }
});

// ---------------------------------------------------------------------------
// Altitude smoothing (rolling average, window of 5)
// ---------------------------------------------------------------------------

// [C6] Altitude smoothing with edge padding to reduce bias at start/end
function smoothAltitude(points: GPSPoint[]): GPSPoint[] {
  const w = 5;
  const half = Math.floor(w / 2);
  return points.map((p, i) => {
    // Pad edges: mirror boundary points so window is always full size
    const start = Math.max(0, i - half);
    const end = Math.min(points.length, i + half + 1);
    const slice = points.slice(start, end).filter((pt) => pt.altitude != null);
    if (slice.length === 0) return p;
    // Weight center point slightly more to preserve real changes
    const center = p.altitude ?? 0;
    const sumOthers = slice.reduce((sum, pt) => sum + (pt.altitude ?? 0), 0);
    const avg = (sumOthers + center) / (slice.length + 1);
    return { ...p, altitude: avg };
  });
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useGPSTracking(): UseGPSTrackingResult {
  const [currentPosition, setCurrentPosition] = useState<GPSPoint | null>(null);
  const [track, setTrack] = useState<GPSPoint[]>([]);
  const [isTracking, setIsTracking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingBackup, setPendingBackup] = useState<TrackBackup | null>(null);

  const trailIdRef = useRef<string | undefined>(undefined);
  const startTimeRef = useRef<number>(0);
  const syncTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const backupTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ------------------------------------------------------------------
  // On mount: check for crash-safe backup
  // ------------------------------------------------------------------
  // [C2] Check for crash-safe backup in SecureStore first, then AsyncStorage
  useEffect(() => {
    (async () => {
      try {
        // Try SecureStore first (encrypted)
        let raw = await SecureStore.getItemAsync(BACKUP_KEY);
        // Fall back to AsyncStorage
        if (!raw) raw = await AsyncStorage.getItem(BACKUP_KEY);
        if (raw) {
          const backup: TrackBackup = JSON.parse(raw);
          if (backup.track && backup.track.length > 0) {
            setPendingBackup(backup);
          }
        }
      } catch {
        // ignore corrupt backup
      }
    })();
  }, []);

  // [C2] Clean both stores when restoring/dismissing backup
  const cleanupBackup = useCallback(() => {
    SecureStore.deleteItemAsync(BACKUP_KEY).catch(() => {});
    AsyncStorage.removeItem(BACKUP_KEY).catch(() => {});
  }, []);

  const restoreBackup = useCallback(() => {
    if (pendingBackup) {
      setTrack(pendingBackup.track);
      if (pendingBackup.track.length > 0) {
        setCurrentPosition(
          pendingBackup.track[pendingBackup.track.length - 1],
        );
      }
      setPendingBackup(null);
      cleanupBackup();
    }
  }, [pendingBackup, cleanupBackup]);

  const dismissBackup = useCallback(() => {
    setPendingBackup(null);
    cleanupBackup();
  }, [cleanupBackup]);

  // ------------------------------------------------------------------
  // Sync: pull module-level buffer into React state periodically
  // ------------------------------------------------------------------
  const startSyncTimer = useCallback(() => {
    if (syncTimerRef.current) clearInterval(syncTimerRef.current);

    syncTimerRef.current = setInterval(() => {
      if (_backgroundPoints.length === 0) return;

      // [A5] Atomic copy + clear to prevent race condition with background task
      const newPoints = _backgroundPoints.splice(0, _backgroundPoints.length);

      setTrack((prev) => [...prev, ...newPoints]);
      setCurrentPosition(newPoints[newPoints.length - 1]);
    }, SYNC_INTERVAL_MS);
  }, []);

  const stopSyncTimer = useCallback(() => {
    if (syncTimerRef.current) {
      clearInterval(syncTimerRef.current);
      syncTimerRef.current = null;
    }
  }, []);

  // ------------------------------------------------------------------
  // [C2] Backup: save current track to SecureStore every 30s (encrypted)
  // Falls back to AsyncStorage if data exceeds SecureStore limit (~2KB)
  // ------------------------------------------------------------------
  const startBackupTimer = useCallback(() => {
    if (backupTimerRef.current) clearInterval(backupTimerRef.current);

    backupTimerRef.current = setInterval(() => {
      setTrack((currentTrack) => {
        if (currentTrack.length > 0) {
          const backup: TrackBackup = {
            track: currentTrack,
            startTime: startTimeRef.current,
            trailId: trailIdRef.current,
          };
          try {
            const json = JSON.stringify(backup);
            if (json.length < 2048) {
              // Small enough for SecureStore (encrypted)
              SecureStore.setItemAsync(BACKUP_KEY, json).catch(
                (err) => __DEV__ && console.warn('[GPS Backup] SecureStore write failed:', err),
              );
            } else {
              // Too large — fall back to AsyncStorage
              AsyncStorage.setItem(BACKUP_KEY, json).catch(
                (err) => __DEV__ && console.warn('[GPS Backup] AsyncStorage write failed:', err),
              );
            }
          } catch (err) {
            if (__DEV__) console.warn('[GPS Backup] serialize failed:', err);
          }
        }
        return currentTrack;
      });
    }, BACKUP_INTERVAL_MS);
  }, []);

  const stopBackupTimer = useCallback(() => {
    if (backupTimerRef.current) {
      clearInterval(backupTimerRef.current);
      backupTimerRef.current = null;
    }
  }, []);

  // ------------------------------------------------------------------
  // startTracking
  // ------------------------------------------------------------------
  const startTracking = useCallback(
    async (trailId?: string) => {
      try {
        // Request foreground permission first
        const { status: fgStatus } =
          await Location.requestForegroundPermissionsAsync();
        if (fgStatus !== 'granted') {
          setError(
            "Permission de localisation refusee. Active-la dans les parametres.",
          );
          return;
        }

        // Request background permission (nice-to-have, not blocking)
        let hasBackgroundPermission = false;
        try {
          const { status: bgStatus } =
            await Location.requestBackgroundPermissionsAsync();
          hasBackgroundPermission = bgStatus === 'granted';
        } catch {
          // Some devices don't support background permission request
          hasBackgroundPermission = false;
        }

        setError(null);
        trailIdRef.current = trailId;
        startTimeRef.current = Date.now();

        // Clear any leftover background points
        _backgroundPoints = [];
        _isBackgroundTracking = true;

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
        setIsTracking(true);

        // Keep screen awake during tracking
        await activateKeepAwakeAsync('gps-tracking');

        // Start location updates — background if permission granted, foreground-only otherwise
        if (hasBackgroundPermission) {
          try {
            await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, {
              accuracy: Location.Accuracy.High,
              distanceInterval: DISTANCE_FILTER,
              timeInterval: TRACKING_INTERVAL,
              foregroundService: {
                notificationTitle: 'Randonnee en cours',
                notificationBody: 'GPS actif',
                notificationColor: COLORS.success,
              },
              showsBackgroundLocationIndicator: true,
            });
          } catch (bgErr) {
            if (__DEV__) console.warn('[GPS] Background task failed, using foreground:', bgErr);
            hasBackgroundPermission = false;
          }
        }

        // Fallback: foreground-only tracking via watchPositionAsync
        if (!hasBackgroundPermission) {
          _foregroundWatcher = await Location.watchPositionAsync(
            {
              accuracy: Location.Accuracy.High,
              distanceInterval: DISTANCE_FILTER,
              timeInterval: TRACKING_INTERVAL,
            },
            (loc) => {
              // Same filtering as background task
              if (loc.coords.accuracy != null && loc.coords.accuracy > 20) return;
              const point: GPSPoint = {
                latitude: loc.coords.latitude,
                longitude: loc.coords.longitude,
                altitude: loc.coords.altitude,
                accuracy: loc.coords.accuracy,
                timestamp: loc.timestamp,
              };
              if (_backgroundPoints.length > 0) {
                const prev = _backgroundPoints[_backgroundPoints.length - 1];
                const dt = (point.timestamp - prev.timestamp) / 1000;
                if (dt > 0) {
                  const dist = haversineDistance(prev.latitude, prev.longitude, point.latitude, point.longitude);
                  if ((dist / dt) * 3600 > 15) return;
                }
              }
              _backgroundPoints.push(point);
            },
          );
        }

        // Start syncing background points into state
        startSyncTimer();

        // Start crash-safe backup
        startBackupTimer();
      } catch (err) {
        if (__DEV__) console.warn('[GPS] startTracking error:', err);
        setError("Impossible d'acceder au GPS. Verifie les permissions dans les parametres.");
        setIsTracking(false);
        _isBackgroundTracking = false;
      }
    },
    [startSyncTimer, startBackupTimer],
  );

  // ------------------------------------------------------------------
  // stopTracking
  // ------------------------------------------------------------------
  const stopTracking = useCallback(async () => {
    try {
      _isBackgroundTracking = false;

      // Stop foreground watcher if active
      if (_foregroundWatcher) {
        _foregroundWatcher.remove();
        _foregroundWatcher = null;
      }

      // Stop background location updates
      const isRegistered = await TaskManager.isTaskRegisteredAsync(
        BACKGROUND_LOCATION_TASK,
      );
      if (isRegistered) {
        await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
      }

      // Flush any remaining background points
      if (_backgroundPoints.length > 0) {
        const remaining = [..._backgroundPoints];
        _backgroundPoints = [];
        setTrack((prev) => [...prev, ...remaining]);
        if (remaining.length > 0) {
          setCurrentPosition(remaining[remaining.length - 1]);
        }
      }

      // Stop timers
      stopSyncTimer();
      stopBackupTimer();

      // Release screen awake lock
      deactivateKeepAwake('gps-tracking');

      // Clean up backup from both stores
      await SecureStore.deleteItemAsync(BACKUP_KEY).catch(() => {});
      await AsyncStorage.removeItem(BACKUP_KEY).catch(() => {});
    } catch (err) {
      console.warn('[GPS] stopTracking error:', err);
    } finally {
      setIsTracking(false);
    }
  }, [stopSyncTimer, stopBackupTimer]);

  // ------------------------------------------------------------------
  // clearTrack
  // ------------------------------------------------------------------
  const clearTrack = useCallback(() => {
    setTrack([]);
    _backgroundPoints = [];
    cleanupBackup();
  }, [cleanupBackup]);

  // ------------------------------------------------------------------
  // getTrackStats — uses haversine + altitude smoothing
  // ------------------------------------------------------------------
  const getTrackStats = useCallback((): TrackStats => {
    // Distance using proper haversine
    let distanceKm = 0;
    for (let i = 1; i < track.length; i++) {
      distanceKm += haversineDistance(
        track[i - 1].latitude,
        track[i - 1].longitude,
        track[i].latitude,
        track[i].longitude,
      );
    }

    // Duration
    let durationMin = 0;
    if (track.length >= 2) {
      durationMin = Math.round(
        (track[track.length - 1].timestamp - track[0].timestamp) / 60000,
      );
    }

    // Elevation gain with altitude smoothing
    const smoothed = smoothAltitude(track);
    let elevationGain = 0;
    for (let i = 1; i < smoothed.length; i++) {
      const prev = smoothed[i - 1].altitude;
      const curr = smoothed[i].altitude;
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

  // ------------------------------------------------------------------
  // Cleanup on unmount
  // ------------------------------------------------------------------
  useEffect(() => {
    return () => {
      stopSyncTimer();
      stopBackupTimer();
      // Note: we do NOT stop the background task on unmount — the user
      // might navigate away while still tracking. stopTracking() must be
      // called explicitly.
    };
  }, [stopSyncTimer, stopBackupTimer]);

  return {
    currentPosition,
    track,
    isTracking,
    error,
    pendingBackup,
    startTracking,
    stopTracking,
    clearTrack,
    getTrackStats,
    restoreBackup,
    dismissBackup,
  };
}
