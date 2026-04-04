import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Linking, StyleSheet, Text, View, Pressable, ActivityIndicator, Platform } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import Mapbox from '@rnmapbox/maps';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Magnetometer } from 'expo-sensors';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import BaseMap, { type BaseMapHandle } from '@/components/BaseMap';
import ReportForm from '@/components/ReportForm';
import NavigationStatsHUD from '@/components/NavigationStatsHUD';
import NavigationControls from '@/components/NavigationControls';
import TrailReportModal from '@/components/TrailReportModal';
import NavigationCTA from '@/components/NavigationCTA';
import { useGPSTracking } from '@/hooks/useGPSTracking';
import { useOffTrailAlert } from '@/hooks/useOffTrailAlert';
import { useVoiceGuidance } from '@/hooks/useVoiceGuidance';
import { useRouting } from '@/hooks/useRouting';
import { useTrailReports } from '@/hooks/useTrailReports';
import { COLORS, FONT_SIZE, SPACING, BORDER_RADIUS, TRAIL_ZOOM, REUNION_CENTER } from '@/constants';
import { useSupabaseTrails } from '@/hooks/useSupabaseTrails';
import { useTrailTrace } from '@/hooks/useTrailTrace';
import { useWeather } from '@/hooks/useWeather';
import { useAuth } from '@/hooks/useAuth';
import { useProgressStore } from '@/stores/progressStore';
import { useLiveShare } from '@/hooks/useLiveShare';
import { formatDuration, formatDistance } from '@/lib/formatters';
import { haversineDistance, formatDistanceToPoint, douglasPeucker } from '@/lib/geo';
import { supabase } from '@/lib/supabase';
import type { TrailStackParamList } from '@/navigation/types';
import type { TrailReport } from '@/types';

// Douglas-Peucker trace simplification before saving
function perpendicularDistance(
  point: [number, number, number?],
  lineStart: [number, number, number?],
  lineEnd: [number, number, number?],
): number {
  const [x, y] = point;
  const [x1, y1] = lineStart;
  const [x2, y2] = lineEnd;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const mag = Math.sqrt(dx * dx + dy * dy);
  if (mag === 0) return Math.sqrt((x - x1) ** 2 + (y - y1) ** 2);
  const u = ((x - x1) * dx + (y - y1) * dy) / (mag * mag);
  const ix = x1 + u * dx;
  const iy = y1 + u * dy;
  return Math.sqrt((x - ix) ** 2 + (y - iy) ** 2);
}

function simplifyTrace(coords: [number, number, number?][], tolerance = 0.00005): typeof coords {
  if (coords.length <= 2) return coords;
  let maxDist = 0;
  let maxIdx = 0;
  const first = coords[0];
  const last = coords[coords.length - 1];
  for (let i = 1; i < coords.length - 1; i++) {
    const dist = perpendicularDistance(coords[i], first, last);
    if (dist > maxDist) {
      maxDist = dist;
      maxIdx = i;
    }
  }
  if (maxDist > tolerance) {
    const left = simplifyTrace(coords.slice(0, maxIdx + 1), tolerance);
    const right = simplifyTrace(coords.slice(maxIdx), tolerance);
    return [...left.slice(0, -1), ...right];
  }
  return [first, last];
}

// Couleurs navigation
const NAV_COLORS = {
  trailTrace: COLORS.info,       // bleu #3b82f6
  userTrack: COLORS.success,     // vert vif #22c55e
  lineToStart: COLORS.warm,      // orange
  startPoint: COLORS.success,    // vert
  endPoint: COLORS.danger,       // rouge
} as const;

type Props = NativeStackScreenProps<TrailStackParamList, 'Navigation'>;

export default function NavigationScreen({ route, navigation: navProp }: Props) {
  const { trailId } = route.params;
  const { currentPosition, track, isTracking, error, startTracking, stopTracking, getTrackStats } =
    useGPSTracking();
  const { user } = useAuth();
  const { isSharing, startSharing, stopSharing, updatePosition: updateLivePosition } = useLiveShare();
  const { validateTrail, loadProgress, totalCompleted, totalTrails } = useProgressStore();
  const [showReportForm, setShowReportForm] = useState(false);
  const [selectedReport, setSelectedReport] = useState<TrailReport | null>(null);
  const [showReports, setShowReports] = useState(true);
  const [userMovedMap, setUserMovedMap] = useState(false);
  const [headingUp, setHeadingUp] = useState(false);
  const mapRef = useRef<BaseMapHandle>(null);
  const lastFlyToTime = useRef(0);
  const didInitialFlyTo = useRef(false);
  const trackingScale = useSharedValue(1);
  const trackingAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: trackingScale.value }],
  }));

  const { trails, isLoading: trailsLoading } = useSupabaseTrails();
  const trail = useMemo(() => trails.find((t) => t.slug === trailId), [trails, trailId]);
  const { data: trailTrace } = useTrailTrace(trailId);

  // Meteo : sunrise/sunset pour le mode nuit automatique
  const trailLat = trail?.start_point?.latitude;
  const trailLng = trail?.start_point?.longitude;
  const { data: weatherData } = useWeather(trailLat, trailLng);
  const todayForecast = weatherData?.forecasts?.[0];

  // Heading GPS calcule entre les 2 dernieres positions du track (fallback)
  const computedHeadingGPS = useMemo(() => {
    if (track.length < 2) return 0;
    const prev = track[track.length - 2];
    const curr = track[track.length - 1];
    const dLng = curr.longitude - prev.longitude;
    const dLat = curr.latitude - prev.latitude;
    const rad = Math.atan2(dLng, dLat);
    const deg = (rad * 180) / Math.PI;
    return (deg + 360) % 360;
  }, [track]);

  // Magnetometer heading (instant, more responsive than GPS heading)
  const [magnetometerHeading, setMagnetometerHeading] = useState(0);
  useEffect(() => {
    if (!isTracking) return;
    Magnetometer.setUpdateInterval(500);
    const sub = Magnetometer.addListener(({ x, y }) => {
      let angle = Math.atan2(y, x) * (180 / Math.PI);
      if (angle < 0) angle += 360;
      setMagnetometerHeading(angle);
    });
    return () => sub.remove();
  }, [isTracking]);

  // Use magnetometer heading when tracking, fallback to GPS heading
  const computedHeading = isTracking ? magnetometerHeading : computedHeadingGPS;

  // --- Enriched stats (altitude, D+) ---
  // Current altitude from GPS
  const currentAltitude = useMemo(() => {
    if (!currentPosition?.altitude) return null;
    return Math.round(currentPosition.altitude);
  }, [currentPosition?.altitude]);

  // D+ cumule (sum of positive altitude differences from track)
  const cumulativeElevationGain = useMemo(() => {
    let gain = 0;
    for (let i = 1; i < track.length; i++) {
      const prev = track[i - 1].altitude;
      const curr = track[i].altitude;
      if (prev !== null && curr !== null && curr > prev) {
        gain += curr - prev;
      }
    }
    return Math.round(gain);
  }, [track]);

  // Convert trail trace coordinates [lng, lat] to Point[] for off-trail detection
  const referenceTrailPoints = useMemo(() => {
    if (!trailTrace || trailTrace.type !== 'LineString') return [];
    return trailTrace.coordinates.map(([lng, lat]) => ({ latitude: lat, longitude: lng }));
  }, [trailTrace]);

  const { isOffTrail, distanceM: offTrailDistanceM } = useOffTrailAlert(
    currentPosition,
    referenceTrailPoints,
    isTracking,
  );

  // Active trail reports
  const { data: reports = [] } = useTrailReports(trail?.slug ?? '');

  // Direction arrows distributed along the trail (every ~15% of the trace)
  const directionArrowsGeoJson = useMemo(() => {
    if (!trailTrace || trailTrace.type !== 'LineString' || trailTrace.coordinates.length < 10) return null;
    const coords = trailTrace.coordinates;
    const step = Math.max(Math.floor(coords.length / 7), 2);
    const features: Array<{ type: 'Feature'; geometry: { type: 'Point'; coordinates: [number, number] }; properties: { bearing: number } }> = [];

    for (let i = step; i < coords.length - step; i += step) {
      const nextIdx = Math.min(i + Math.max(Math.floor(step / 3), 1), coords.length - 1);
      const [lng1, lat1] = coords[i];
      const [lng2, lat2] = coords[nextIdx];
      const dLng = ((lng2 - lng1) * Math.PI) / 180;
      const lat1Rad = (lat1 * Math.PI) / 180;
      const lat2Rad = (lat2 * Math.PI) / 180;
      const y = Math.sin(dLng) * Math.cos(lat2Rad);
      const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) - Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLng);
      const bearing = ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
      features.push({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [lng1, lat1] },
        properties: { bearing },
      });
    }

    return { type: 'FeatureCollection' as const, features };
  }, [trailTrace]);

  // GeoJSON FeatureCollection for report markers on the map
  const reportsGeoJson = useMemo(() => {
    if (reports.length === 0) return null;
    return {
      type: 'FeatureCollection' as const,
      features: reports.map((r) => ({
        type: 'Feature' as const,
        geometry: {
          type: 'Point' as const,
          coordinates: [r.longitude, r.latitude],
        },
        properties: {
          id: r.id,
          report_type: r.report_type,
          color: REPORT_LABELS[r.report_type]?.color ?? COLORS.warning,
        },
      })),
    };
  }, [reports]);

  const handleReportMarkerPress = useCallback((event: { features?: Array<{ properties?: { id?: string } }> }) => {
    const featureId = event.features?.[0]?.properties?.id;
    if (!featureId) return;
    const report = reports.find((r) => r.id === featureId);
    if (report) setSelectedReport(report);
  }, [reports]);

  const trailTraceGeoJson = useMemo(() => {
    if (!trailTrace) return null;
    return {
      type: 'Feature' as const,
      geometry: trailTrace,
      properties: {},
    };
  }, [trailTrace]);

  const trackGeoJson = useMemo(() => {
    if (track.length < 2) return null;
    // [PERF-1] Compress trace with Douglas-Peucker for map rendering performance
    // Tolerance: 10 meters (0.01 km) for hiking trails (balances precision vs rendering speed)
    const compressedTrack = douglasPeucker(
      track.map((p) => ({ latitude: p.latitude, longitude: p.longitude })),
      0.01, // 10 meters in kilometers
    );
    return {
      type: 'Feature' as const,
      geometry: {
        type: 'LineString' as const,
        coordinates: compressedTrack.map((p) => [p.longitude, p.latitude]),
      },
      properties: {},
    };
  }, [track]);

  const elapsedMin = useMemo(() => {
    if (track.length < 2) return 0;
    return Math.round((track[track.length - 1].timestamp - track[0].timestamp) / 60000);
  }, [track]);

  const distanceKm = useMemo(() => {
    let total = 0;
    for (let i = 1; i < track.length; i++) {
      total += haversineDistance(
        track[i - 1].latitude,
        track[i - 1].longitude,
        track[i].latitude,
        track[i].longitude,
      );
    }
    return total;
  }, [track]);

  // Vitesse moyenne en km/h
  const speedKmH = useMemo(() => {
    if (elapsedMin < 1 || distanceKm < 0.01) return 0;
    return distanceKm / (elapsedMin / 60);
  }, [distanceKm, elapsedMin]);

  // Pace in min/km
  const paceMinPerKm = useMemo(() => {
    if (elapsedMin < 1 || distanceKm < 0.01) return null;
    const pace = elapsedMin / distanceKm;
    return pace;
  }, [elapsedMin, distanceKm]);

  const formattedPace = useMemo(() => {
    if (paceMinPerKm === null || !isFinite(paceMinPerKm) || paceMinPerKm > 99) return '--:--';
    const mins = Math.floor(paceMinPerKm);
    const secs = Math.round((paceMinPerKm - mins) * 60);
    return `${mins}:${String(secs).padStart(2, '0')}`;
  }, [paceMinPerKm]);

  // Voice guidance hook
  const { voiceEnabled, toggleVoice } = useVoiceGuidance({
    isTracking,
    distanceKm,
    trailDistanceKm: trail?.distance_km,
    isOffTrail,
    currentPosition,
    trailTrace,
  });

  // Point de depart du sentier
  const startPoint = useMemo(() => {
    if (!trail) return null;
    return trail.start_point;
  }, [trail]);

  // Point d'arrivee : end_point du trail, ou dernier point du trace
  const endPoint = useMemo(() => {
    if (trail?.end_point) return trail.end_point;
    if (trailTrace && trailTrace.type === 'LineString' && trailTrace.coordinates.length > 0) {
      const lastCoord = trailTrace.coordinates[trailTrace.coordinates.length - 1];
      return { latitude: lastCoord[1], longitude: lastCoord[0] };
    }
    return null;
  }, [trail, trailTrace]);

  // Distance utilisateur -> point de depart (haversine, fallback)
  const distanceToStartHaversine = useMemo(() => {
    if (!currentPosition || !startPoint) return null;
    return haversineDistance(
      currentPosition.latitude,
      currentPosition.longitude,
      startPoint.latitude,
      startPoint.longitude,
    );
  }, [currentPosition, startPoint]);

  // Itineraire routier OSRM (remplace la ligne droite)
  const {
    geometry: routeGeometry,
    distanceKm: routeDistanceKm,
    isRealRoute,
  } = useRouting(currentPosition, startPoint);

  // Distance affichee : OSRM si disponible, sinon haversine
  const distanceToStart = routeDistanceKm ?? distanceToStartHaversine;

  // Detecter si c'est une boucle (depart et arrivee au meme point, <50m)
  const isLoop = useMemo(() => {
    if (!startPoint || !endPoint) return false;
    const dLat = startPoint.latitude - endPoint.latitude;
    const dLng = startPoint.longitude - endPoint.longitude;
    const distM = Math.sqrt(dLat * dLat + dLng * dLng) * 111000;
    return distM < 50;
  }, [startPoint, endPoint]);

  // GeoJSON pour le marqueur point de depart (cercle vert)
  const startPointGeoJson = useMemo(() => {
    if (!startPoint) return null;
    return {
      type: 'Feature' as const,
      geometry: {
        type: 'Point' as const,
        coordinates: [startPoint.longitude, startPoint.latitude],
      },
      properties: { label: isLoop ? 'D/A' : 'Depart' },
    };
  }, [startPoint, isLoop]);

  // GeoJSON pour le marqueur point d'arrivee (cercle rouge) — masque si boucle
  const endPointGeoJson = useMemo(() => {
    if (!endPoint || isLoop) return null;
    return {
      type: 'Feature' as const,
      geometry: {
        type: 'Point' as const,
        coordinates: [endPoint.longitude, endPoint.latitude],
      },
      properties: { label: 'Arrivee' },
    };
  }, [endPoint, isLoop]);

  // Route OSRM ou ligne droite fallback vers le point de depart
  const routeToStartGeoJson = useMemo(() => {
    if (!routeGeometry) return null;
    // Ne pas afficher si l'utilisateur est tres proche du depart (< 50m)
    if (distanceToStart !== null && distanceToStart < 0.05) return null;
    return {
      type: 'Feature' as const,
      geometry: routeGeometry,
      properties: {},
    };
  }, [routeGeometry, distanceToStart]);

  // --- Progression stats (pendant le tracking) ---
  const distanceRemainingKm = useMemo(() => {
    if (!trail?.distance_km) return null;
    const remaining = trail.distance_km - distanceKm;
    return Math.max(0, remaining);
  }, [trail?.distance_km, distanceKm]);

  const progressPercent = useMemo(() => {
    if (!trail?.distance_km || trail.distance_km <= 0) return 0;
    const pct = (distanceKm / trail.distance_km) * 100;
    return Math.min(100, Math.max(0, pct));
  }, [distanceKm, trail?.distance_km]);

  const estimatedTimeRemaining = useMemo(() => {
    if (!distanceRemainingKm || distanceRemainingKm <= 0) return null;
    if (elapsedMin < 1 || distanceKm < 0.01) {
      // Not enough data — fall back to trail's estimated duration
      if (trail?.duration_min && trail.distance_km) {
        const ratio = distanceRemainingKm / trail.distance_km;
        return Math.round(trail.duration_min * ratio);
      }
      return null;
    }
    const speedKmPerMin = distanceKm / elapsedMin;
    if (speedKmPerMin <= 0) return null;
    return Math.round(distanceRemainingKm / speedKmPerMin);
  }, [distanceRemainingKm, elapsedMin, distanceKm, trail?.duration_min, trail?.distance_km]);

  // --- Live share: push position updates every 30s ---
  useEffect(() => {
    if (!isTracking || !currentPosition || !isSharing) return;
    updateLivePosition(
      currentPosition.latitude,
      currentPosition.longitude,
      currentPosition.altitude,
      speedKmH,
    );
  }, [isTracking, currentPosition, isSharing, updateLivePosition, speedKmH]);

  // --- Initial flyTo: center on user as soon as GPS locks (before tracking) ---
  useEffect(() => {
    if (didInitialFlyTo.current || !currentPosition) return;
    didInitialFlyTo.current = true;
    mapRef.current?.flyTo(
      [currentPosition.longitude, currentPosition.latitude],
      TRAIL_ZOOM,
    );
  }, [currentPosition]);

  // --- Auto-follow: flyTo user position when tracking (throttle 2s) ---
  useEffect(() => {
    if (!isTracking || !currentPosition || userMovedMap) return;
    const now = Date.now();
    if (now - lastFlyToTime.current < 2000) return;
    lastFlyToTime.current = now;
    mapRef.current?.flyTo(
      [currentPosition.longitude, currentPosition.latitude],
      TRAIL_ZOOM,
    );
  }, [isTracking, currentPosition, userMovedMap]);

  const handleRecenter = useCallback(() => {
    if (!currentPosition) return;
    setUserMovedMap(false);
    mapRef.current?.flyTo(
      [currentPosition.longitude, currentPosition.latitude],
      TRAIL_ZOOM,
    );
  }, [currentPosition]);

  const handleMapPress = useCallback((event: { features?: GeoJSON.Feature[]; geometry?: { coordinates: [number, number] } }) => {
    if (isTracking) {
      setUserMovedMap(true);
    }
  }, [isTracking]);

  // Guard: trail not found
  if (trailsLoading && !trail) {
    return (
      <View style={styles.centeredScreen}>
        <ActivityIndicator size="large" color={COLORS.primaryLight} />
        <Text style={styles.centeredText}>Chargement du sentier...</Text>
      </View>
    );
  }

  if (!trail) {
    return (
      <View style={styles.centeredScreen}>
        <Ionicons name="trail-sign-outline" size={64} color={COLORS.textMuted} />
        <Text style={styles.centeredTitle}>Sentier introuvable</Text>
        <Text style={styles.centeredText}>Impossible de lancer la navigation.</Text>
        <Pressable style={styles.centeredBackBtn} onPress={() => navProp.goBack()} accessibilityLabel="Retour">
          <Text style={styles.centeredBackBtnText}>Retour</Text>
        </Pressable>
      </View>
    );
  }

  // Determine map center: user position > trail start > trace midpoint > island center
  const traceMiddlePoint = useMemo((): [number, number] | null => {
    if (!trailTrace || trailTrace.type !== 'LineString' || trailTrace.coordinates.length === 0) return null;
    const mid = Math.floor(trailTrace.coordinates.length / 2);
    return [trailTrace.coordinates[mid][0], trailTrace.coordinates[mid][1]];
  }, [trailTrace]);

  const center: [number, number] = currentPosition
    ? [currentPosition.longitude, currentPosition.latitude]
    : trail.start_point
      ? [trail.start_point.longitude, trail.start_point.latitude]
      : traceMiddlePoint
        ? traceMiddlePoint
        : [REUNION_CENTER.longitude, REUNION_CENTER.latitude];

  const centerZoom = currentPosition || trail.start_point || traceMiddlePoint ? TRAIL_ZOOM : 10;

  const handleToggleTracking = useCallback(() => {
    if (isTracking) {
      // Collect stats BEFORE stopping (track is still populated)
      const stats = getTrackStats();
      const currentTrack = [...track]; // snapshot before stopping
      stopTracking();

      // Stop live sharing if active
      if (isSharing) {
        stopSharing();
      }

      // Compute average speed
      const avgSpeed = stats.durationMin > 0
        ? Number(((stats.distanceKm / stats.durationMin) * 60).toFixed(2))
        : 0;

      // Build trace GeoJSON with Douglas-Peucker simplification
      const rawCoords = currentTrack.map((p) => {
        const coord: [number, number, number?] = [p.longitude, p.latitude];
        if (p.altitude !== null) coord.push(p.altitude);
        return coord;
      });
      const simplifiedCoords = simplifyTrace(rawCoords);
      const traceGeoJsonObj = {
        type: 'LineString' as const,
        coordinates: simplifiedCoords,
      };

      // Build a summary of the track
      const summaryLines = [
        `Distance : ${formatDistance(stats.distanceKm)}`,
        `Duree : ${formatDuration(stats.durationMin)}`,
      ];
      if (stats.elevationGain > 0) {
        summaryLines.push(`Denivele positif : ${stats.elevationGain} m`);
      }
      summaryLines.push(`Points GPS : ${stats.pointCount}`);

      // Auto-validation based on progress
      const currentProgress = trail?.distance_km && trail.distance_km > 0
        ? (stats.distanceKm / trail.distance_km) * 100
        : 0;

      const alertTitle = currentProgress >= 80
        ? 'Bravo, randonnee terminee !'
        : 'Randonnee terminee';

      const alertMessage = currentProgress < 50
        ? summaryLines.join('\n') + `\n\nTu n'as parcouru que ${Math.round(currentProgress)}% du sentier. Valider quand meme ?`
        : summaryLines.join('\n') + (currentProgress >= 80
          ? '\n\nExcellent parcours ! Validation automatique.'
          : '\n\nTu veux valider ce sentier ?');

      // [C3] Auto-validate at 80%+ : only "Valider" button, no cancel
      const onValidate = async () => {
              if (!user?.id) {
                Alert.alert('Erreur', 'Tu dois etre connecte pour valider un sentier.');
                return;
              }
              try {
                // Resolve trail UUID
                const { data: trailRow } = await supabase
                  .from('trails')
                  .select('id, name')
                  .eq('slug', trailId)
                  .single();

                if (!trailRow) {
                  Alert.alert('Erreur', 'Sentier introuvable.');
                  return;
                }

                const completedAt = new Date().toISOString();

                // Save full activity to user_activities
                const { data: activityData, error: activityError } = await supabase
                  .from('user_activities')
                  .insert({
                    user_id: user.id,
                    trail_id: trailRow.id,
                    validation_type: 'gps',
                    completed_at: completedAt,
                    distance_km: Number(stats.distanceKm.toFixed(2)),
                    duration_min: stats.durationMin,
                    elevation_gain_m: stats.elevationGain,
                    average_speed_kmh: avgSpeed,
                    trace_geojson: traceGeoJsonObj,
                  })
                  .select('id')
                  .single();

                if (activityError) {
                  Alert.alert('Erreur', 'Impossible de sauvegarder la trace.');
                  return;
                }

                // Refresh progress store (activity already inserted above)
                await loadProgress(user.id);

                // Navigate to celebration screen
                navProp.replace('HikeSummary', {
                  trailId: trailRow.id,
                  trailName: trailRow.name,
                  trailSlug: trailId,
                  distanceKm: Number(stats.distanceKm.toFixed(2)),
                  durationMin: stats.durationMin,
                  elevationGainM: stats.elevationGain,
                  averageSpeedKmh: avgSpeed,
                  traceGeoJson: JSON.stringify(traceGeoJsonObj),
                  completedAt,
                  activityId: activityData?.id ?? '',
                });
              } catch {
                Alert.alert('Erreur', 'Impossible de valider le sentier. Reessaie plus tard.');
              }
      };

      const validateBtn = { text: 'Valider', onPress: onValidate };
      const cancelBtn = { text: 'Non merci', style: 'cancel' as const };

      Alert.alert(
        alertTitle,
        alertMessage,
        currentProgress >= 80 ? [validateBtn] : [cancelBtn, validateBtn],
      );
    } else {
      startTracking();
    }
  }, [isTracking, startTracking, stopTracking, getTrackStats, track, user?.id, loadProgress, trailId, navProp, isSharing, stopSharing, trail?.distance_km]);

  // Format elapsed time as H:MM:SS
  const formattedTime = useMemo(() => {
    const totalSec = elapsedMin * 60;
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }, [elapsedMin]);

  return (
    <GestureHandlerRootView style={styles.container}>
      {/* Header minimaliste : fleche retour + titre + settings */}
      <View style={styles.header}>
        <Pressable
          style={styles.headerBtn}
          onPress={() => navProp.goBack()}
          accessibilityLabel="Retour a la fiche sentier"
        >
          <Ionicons name="chevron-back" size={24} color={COLORS.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Randonnee</Text>
        <Pressable
          style={styles.headerBtn}
          onPress={() => setShowReports((v) => !v)}
          accessibilityLabel={showReports ? 'Masquer les signalements' : 'Afficher les signalements'}
        >
          <Ionicons name="settings-outline" size={22} color={COLORS.textPrimary} />
        </Pressable>
      </View>

      {/* Carte = 75% de l'ecran (flex: 3) */}
      <View style={styles.mapSection}>
        <BaseMap ref={mapRef} centerCoordinate={center} zoomLevel={centerZoom} showUserLocation userPosition={currentPosition ? { latitude: currentPosition.latitude, longitude: currentPosition.longitude } : null} onMapPress={handleMapPress} autoNight={isTracking} sunrise={todayForecast?.sunrise} sunset={todayForecast?.sunset} followHeading={isTracking && headingUp} heading={computedHeading}>
          {/* Trace du sentier (couleur unique bleu) */}
          {trailTraceGeoJson && (
            <Mapbox.ShapeSource id="trail-trace" shape={trailTraceGeoJson}>
              <Mapbox.LineLayer
                id="trail-trace-line"
                style={{
                  lineWidth: 5,
                  lineOpacity: 0.85,
                  lineColor: NAV_COLORS.trailTrace,
                }}
              />
            </Mapbox.ShapeSource>
          )}
          {/* Fleches de direction reparties le long du trace */}
          {directionArrowsGeoJson && (
            <Mapbox.ShapeSource id="trail-direction-arrows-src" shape={directionArrowsGeoJson}>
              <Mapbox.SymbolLayer
                id="trail-direction-arrows"
                style={{
                  textField: '›',
                  textSize: 22,
                  textRotate: ['get', 'bearing'],
                  textRotationAlignment: 'map',
                  textAllowOverlap: true,
                  textColor: COLORS.white,
                  textHaloColor: NAV_COLORS.trailTrace,
                  textHaloWidth: 3,
                  textOpacity: 0.85,
                }}
              />
            </Mapbox.ShapeSource>
          )}
          {/* Marqueur direction depart : fleche "D" */}
          {trailTrace && trailTrace.type === 'LineString' && trailTrace.coordinates.length >= 2 && (
            <Mapbox.ShapeSource
              id="trail-direction-start"
              shape={{
                type: 'Feature' as const,
                geometry: {
                  type: 'Point' as const,
                  coordinates: trailTrace.coordinates[0],
                },
                properties: {},
              }}
            >
              <Mapbox.SymbolLayer
                id="trail-direction-start-label"
                style={{
                  textField: 'D',
                  textSize: 12,
                  textColor: NAV_COLORS.trailTrace,
                  textHaloColor: COLORS.white,
                  textHaloWidth: 2,
                  textOffset: [0, -1.8],
                  textFont: ['Open Sans Bold'],
                  textAllowOverlap: true,
                }}
              />
            </Mapbox.ShapeSource>
          )}
          {/* Marqueur direction arrivee : fleche "A" */}
          {trailTrace && trailTrace.type === 'LineString' && trailTrace.coordinates.length >= 2 && (
            <Mapbox.ShapeSource
              id="trail-direction-end"
              shape={{
                type: 'Feature' as const,
                geometry: {
                  type: 'Point' as const,
                  coordinates: trailTrace.coordinates[trailTrace.coordinates.length - 1],
                },
                properties: {},
              }}
            >
              <Mapbox.SymbolLayer
                id="trail-direction-end-label"
                style={{
                  textField: 'A',
                  textSize: 12,
                  textColor: NAV_COLORS.trailTrace,
                  textHaloColor: COLORS.white,
                  textHaloWidth: 2,
                  textOffset: [0, -1.8],
                  textFont: ['Open Sans Bold'],
                  textAllowOverlap: true,
                }}
              />
            </Mapbox.ShapeSource>
          )}
          {/* Trace GPS utilisateur (vert vif) */}
          {trackGeoJson && (
            <Mapbox.ShapeSource id="user-track" shape={trackGeoJson}>
              <Mapbox.LineLayer
                id="user-track-line"
                style={{ lineColor: NAV_COLORS.userTrack, lineWidth: 7, lineOpacity: 0.95 }}
              />
            </Mapbox.ShapeSource>
          )}
          {/* Marqueur point de depart (cercle vert + label) */}
          {startPointGeoJson && (
            <Mapbox.ShapeSource id="start-point" shape={startPointGeoJson}>
              <Mapbox.CircleLayer
                id="start-point-circle"
                style={{
                  circleRadius: 7,
                  circleColor: isLoop ? COLORS.primaryLight : NAV_COLORS.startPoint,
                  circleOpacity: 0.95,
                  circleStrokeWidth: 2,
                  circleStrokeColor: COLORS.white,
                }}
              />
              <Mapbox.SymbolLayer
                id="start-label"
                style={{
                  textField: ['get', 'label'],
                  textSize: 11,
                  textColor: isLoop ? COLORS.primaryLight : COLORS.success,
                  textHaloColor: COLORS.black,
                  textHaloWidth: 1.5,
                  textOffset: [0, -1.8],
                  textFont: ['Open Sans Bold'],
                  textAllowOverlap: true,
                }}
              />
            </Mapbox.ShapeSource>
          )}
          {/* Marqueur point d'arrivee (cercle rouge + label) — masque si boucle */}
          {endPointGeoJson && (
            <Mapbox.ShapeSource id="end-point" shape={endPointGeoJson}>
              <Mapbox.CircleLayer
                id="end-point-circle"
                style={{
                  circleRadius: 7,
                  circleColor: NAV_COLORS.endPoint,
                  circleOpacity: 0.95,
                  circleStrokeWidth: 2,
                  circleStrokeColor: COLORS.white,
                }}
              />
              <Mapbox.SymbolLayer
                id="end-label"
                style={{
                  textField: ['get', 'label'],
                  textSize: 11,
                  textColor: COLORS.danger,
                  textHaloColor: COLORS.black,
                  textHaloWidth: 1.5,
                  textOffset: [0, -1.8],
                  textFont: ['Open Sans Bold'],
                  textAllowOverlap: true,
                }}
              />
            </Mapbox.ShapeSource>
          )}
          {/* Itineraire routier OSRM (orange, trait plein) */}
          {routeToStartGeoJson && (
            <Mapbox.ShapeSource id="route-to-start" shape={routeToStartGeoJson}>
              <Mapbox.LineLayer
                id="route-to-start-line"
                style={{ lineColor: NAV_COLORS.lineToStart, lineWidth: 4, lineOpacity: 0.8 }}
              />
            </Mapbox.ShapeSource>
          )}
          {/* Signalements actifs sur la carte */}
          {reportsGeoJson && showReports && (
            <Mapbox.ShapeSource
              id="report-markers"
              shape={reportsGeoJson}
              onPress={handleReportMarkerPress}
            >
              <Mapbox.CircleLayer
                id="report-markers-circle"
                style={{
                  circleRadius: 8,
                  circleColor: ['get', 'color'],
                  circleOpacity: 0.9,
                  circleStrokeWidth: 2,
                  circleStrokeColor: COLORS.white,
                }}
              />
            </Mapbox.ShapeSource>
          )}
        </BaseMap>

        {/* Alerte hors sentier (bandeau discret en haut de la carte) */}
        {isOffTrail && (
          <View style={styles.offTrailBanner} accessibilityLabel={`Hors sentier, a ${offTrailDistanceM} metres du trace`}>
            <Ionicons name="navigate-circle" size={18} color={COLORS.white} />
            <Text style={styles.offTrailText}>
              Hors sentier — {offTrailDistanceM} m
            </Text>
          </View>
        )}

        {error && (
          <View style={styles.errorBanner}>
            <Ionicons name="warning" size={16} color={COLORS.warning} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* SOS + Signaler : petits boutons discrets en haut a droite de la carte */}
        <View style={styles.mapOverlayActions}>
          <Pressable
            style={styles.mapOverlayBtn}
            onPress={() => {
              Alert.alert(
                'Urgence',
                'Appeler le 112 (secours) ?',
                [
                  { text: 'Annuler', style: 'cancel' },
                  { text: 'Appeler', style: 'destructive', onPress: () => Linking.openURL('tel:112') },
                ],
              );
            }}
            accessibilityLabel="Appel d'urgence SOS"
          >
            <Ionicons name="medkit-outline" size={18} color={COLORS.danger} />
          </Pressable>
          <Pressable
            style={styles.mapOverlayBtn}
            onPress={() => setShowReportForm(true)}
            accessibilityLabel="Signaler un probleme sur le sentier"
          >
            <Ionicons name="warning-outline" size={18} color={COLORS.warning} />
          </Pressable>
          {isTracking && (
            <Pressable
              style={[styles.mapOverlayBtn, voiceEnabled && styles.mapOverlayBtnActive]}
              onPress={toggleVoice}
              accessibilityLabel={voiceEnabled ? 'Desactiver le guidage vocal' : 'Activer le guidage vocal'}
            >
              <Ionicons
                name={voiceEnabled ? 'volume-high' : 'volume-mute'}
                size={18}
                color={voiceEnabled ? COLORS.white : COLORS.textMuted}
              />
            </Pressable>
          )}
          {isTracking && (
            <Pressable
              style={[styles.mapOverlayBtn, isSharing && styles.mapOverlayBtnActive]}
              onPress={() => {
                if (isSharing) {
                  Alert.alert(
                    'Arreter le partage',
                    'Tes proches ne pourront plus suivre ta position.',
                    [
                      { text: 'Annuler', style: 'cancel' },
                      { text: 'Arreter', style: 'destructive', onPress: () => stopSharing() },
                    ],
                  );
                } else {
                  Alert.alert(
                    'Partager ta position en direct ?',
                    'Un lien unique sera copie dans ton presse-papier. Tes proches pourront suivre ta rando en temps reel.',
                    [
                      { text: 'Annuler', style: 'cancel' },
                      { text: 'Partager', onPress: () => startSharing(trailId) },
                    ],
                  );
                }
              }}
              accessibilityLabel={isSharing ? 'Arreter le partage de position' : 'Partager ma position en direct'}
            >
              <Ionicons
                name={isSharing ? 'radio' : 'share-outline'}
                size={18}
                color={isSharing ? COLORS.white : COLORS.info}
              />
            </Pressable>
          )}
        </View>

        {/* Bouton recentrer (visible si l'utilisateur a deplace la carte pendant le tracking) */}
        {isTracking && userMovedMap && (
          <Pressable
            style={styles.recenterButton}
            onPress={handleRecenter}
            accessibilityLabel="Recentrer la carte sur ma position"
          >
            <Ionicons name="locate" size={24} color={COLORS.primaryLight} />
          </Pressable>
        )}

        {/* Bouton recentrer visible aussi hors tracking si on a une position */}
        {!isTracking && currentPosition && (
          <Pressable
            style={styles.recenterButton}
            onPress={handleRecenter}
            accessibilityLabel="Recentrer la carte sur ma position"
          >
            <Ionicons name="locate" size={24} color={COLORS.primaryLight} />
          </Pressable>
        )}

        {/* Bouton boussole : toggle Nord-up / Heading-up (visible pendant le tracking) */}
        {isTracking && (
          <Pressable
            style={[
              styles.compassButton,
              headingUp && styles.compassButtonActive,
            ]}
            onPress={() => setHeadingUp((v) => !v)}
            accessibilityLabel={headingUp ? 'Basculer en mode Nord en haut' : 'Basculer en mode boussole'}
          >
            <View style={headingUp ? { transform: [{ rotate: `${-computedHeading}deg` }] } : undefined}>
              <Ionicons name="compass-outline" size={24} color={headingUp ? COLORS.white : COLORS.textPrimary} />
            </View>
          </Pressable>
        )}
      </View>

      {/* Panel bas = 25% de l'ecran (flex: 1) — Stats ENORMES + bouton GEANT */}
      <View style={styles.bottomPanel}>
        <NavigationStatsHUD
          isTracking={isTracking}
          distanceKm={distanceKm}
          trailDistanceKm={trail?.distance_km}
          formattedTime={formattedTime}
          speedKmH={speedKmH}
          currentAltitude={currentAltitude}
          cumulativeElevationGain={cumulativeElevationGain}
          formattedPace={formattedPace}
          progressPercent={progressPercent}
          estimatedTimeRemaining={estimatedTimeRemaining}
        />

        <NavigationCTA
          isTracking={isTracking}
          onCameraPress={() => {
            // Placeholder pour la camera — a connecter a expo-image-picker
          }}
          onToggleTracking={handleToggleTracking}
          trackingAnimStyle={trackingAnimStyle}
        />
      </View>

      {/* Navigation Controls Overlay (SOS, Recenter, Compass) */}
      <NavigationControls
        isTracking={isTracking}
        userMovedMap={userMovedMap}
        headingUp={headingUp}
        computedHeading={computedHeading}
        isSharing={isSharing}
        onRecenter={handleRecenter}
        onHeadingToggle={setHeadingUp}
        onSOSPress={() => {
          Alert.alert('SOS', 'Appel aux secours', [
            { text: 'Annuler', style: 'cancel' },
            { text: 'Appeler le PGHM', onPress: () => Linking.openURL('tel:+33262939255') },
          ]);
        }}
        onReportPress={() => setShowReportForm(true)}
        onSharePress={(action, id) => {
          if (action === 'start') {
            startSharing(id);
          } else {
            stopSharing();
          }
        }}
        trackingScale={trackingScale}
        trailId={trailId}
      />

      {/* Modal signalement */}
      <Modal visible={showReportForm} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ReportForm
              trailId={trail?.slug ?? ''}
              latitude={currentPosition?.latitude ?? trail?.start_point?.latitude ?? 0}
              longitude={currentPosition?.longitude ?? trail?.start_point?.longitude ?? 0}
              onClose={() => setShowReportForm(false)}
            />
          </View>
        </View>
      </Modal>

      {/* Modal detail signalement (au clic sur un marqueur) */}
      <TrailReportModal
        visible={!!selectedReport}
        selectedReport={selectedReport}
        onClose={() => setSelectedReport(null)}
      />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // --- Loading / Error screens ---
  centeredScreen: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.md,
    padding: SPACING.xl,
  },
  centeredTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  centeredText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  centeredBackBtn: {
    marginTop: SPACING.md,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.sm,
  },
  centeredBackBtnText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.white,
  },

  // --- Header minimaliste (1 ligne) ---
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    paddingTop: Platform.OS === 'android' ? SPACING.xl + SPACING.sm : SPACING.xxl,
    paddingBottom: SPACING.sm,
    paddingHorizontal: SPACING.sm,
  },
  headerBtn: {
    width: SPACING.xxl,
    height: SPACING.xxl,
    borderRadius: BORDER_RADIUS.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },

  // --- Carte (flex: 3 = 75%) ---
  mapSection: {
    flex: 3,
  },

  // --- Off-trail & error banners (floating on map) ---
  offTrailBanner: {
    position: 'absolute',
    top: SPACING.sm,
    left: SPACING.md,
    right: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: COLORS.danger + 'DD',
    borderRadius: BORDER_RADIUS.sm,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
  },
  offTrailText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    color: COLORS.white,
    flex: 1,
  },
  errorBanner: {
    position: 'absolute',
    top: SPACING.sm,
    left: SPACING.md,
    right: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.warning + '20',
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.sm,
  },
  errorText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.warning,
    flex: 1,
  },

  // --- Panel bas (flex: 1 = 25%) ---
  bottomPanel: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    paddingTop: SPACING.md,
    paddingBottom: Platform.OS === 'android' ? SPACING.xxl : SPACING.md,
    paddingHorizontal: SPACING.md,
    justifyContent: 'space-between',
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 12,
  },

  // --- Modals (ReportForm) ---
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.black + '80',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    maxHeight: '80%',
  },
});
