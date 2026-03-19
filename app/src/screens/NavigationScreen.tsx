import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, StyleSheet, Text, View, Pressable, Modal, ActivityIndicator, Image, Platform } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import Mapbox from '@rnmapbox/maps';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import BaseMap, { type BaseMapHandle } from '@/components/BaseMap';
import ReportForm from '@/components/ReportForm';
import { useGPSTracking } from '@/hooks/useGPSTracking';
import { useOffTrailAlert } from '@/hooks/useOffTrailAlert';
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
import { haversineDistance, formatDistanceToPoint } from '@/lib/geo';
import { supabase } from '@/lib/supabase';
import type { TrailStackParamList } from '@/navigation/types';
import type { TrailReport } from '@/types';
import { REPORT_LABELS } from '@/types';

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

  // Heading GPS calcule entre les 2 dernieres positions du track
  const computedHeading = useMemo(() => {
    if (track.length < 2) return 0;
    const prev = track[track.length - 2];
    const curr = track[track.length - 1];
    const dLng = curr.longitude - prev.longitude;
    const dLat = curr.latitude - prev.latitude;
    // Bearing en degres (0 = Nord, 90 = Est)
    const rad = Math.atan2(dLng, dLat);
    const deg = (rad * 180) / Math.PI;
    return (deg + 360) % 360;
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

  // Single direction arrow at the midpoint of the trail trace
  const midpointArrowGeoJson = useMemo(() => {
    if (!trailTrace || trailTrace.type !== 'LineString' || trailTrace.coordinates.length < 3) return null;
    const coords = trailTrace.coordinates;
    const midIdx = Math.floor(coords.length / 2);
    const nextIdx = Math.min(midIdx + 1, coords.length - 1);
    const [lng1, lat1] = coords[midIdx];
    const [lng2, lat2] = coords[nextIdx];
    // Compute bearing in degrees (0 = North, 90 = East)
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const lat1Rad = (lat1 * Math.PI) / 180;
    const lat2Rad = (lat2 * Math.PI) / 180;
    const y = Math.sin(dLng) * Math.cos(lat2Rad);
    const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) - Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLng);
    const bearing = ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
    return {
      type: 'Feature' as const,
      geometry: {
        type: 'Point' as const,
        coordinates: [lng1, lat1],
      },
      properties: { bearing },
    };
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
    return {
      type: 'Feature' as const,
      geometry: {
        type: 'LineString' as const,
        coordinates: track.map((p) => [p.longitude, p.latitude]),
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
      const dx = track[i].longitude - track[i - 1].longitude;
      const dy = track[i].latitude - track[i - 1].latitude;
      total += Math.sqrt((dx * 94.5) ** 2 + (dy * 111.0) ** 2);
    }
    return total;
  }, [track]);

  // Vitesse moyenne en km/h
  const speedKmH = useMemo(() => {
    if (elapsedMin < 1 || distanceKm < 0.01) return 0;
    return distanceKm / (elapsedMin / 60);
  }, [distanceKm, elapsedMin]);

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

  // GeoJSON pour le marqueur point de depart (cercle vert)
  const startPointGeoJson = useMemo(() => {
    if (!startPoint) return null;
    return {
      type: 'Feature' as const,
      geometry: {
        type: 'Point' as const,
        coordinates: [startPoint.longitude, startPoint.latitude],
      },
      properties: { label: 'Depart' },
    };
  }, [startPoint]);

  // GeoJSON pour le marqueur point d'arrivee (cercle rouge)
  const endPointGeoJson = useMemo(() => {
    if (!endPoint) return null;
    return {
      type: 'Feature' as const,
      geometry: {
        type: 'Point' as const,
        coordinates: [endPoint.longitude, endPoint.latitude],
      },
      properties: { label: 'Arrivee' },
    };
  }, [endPoint]);

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

      // Build trace GeoJSON
      const traceGeoJsonObj = {
        type: 'LineString' as const,
        coordinates: currentTrack.map((p) => {
          const coord: number[] = [p.longitude, p.latitude];
          if (p.altitude !== null) coord.push(p.altitude);
          return coord;
        }),
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

      // Immediate feedback: propose trail validation
      Alert.alert(
        'Randonnee terminee',
        summaryLines.join('\n') + '\n\nTu veux valider ce sentier ?',
        [
          {
            text: 'Non merci',
            style: 'cancel',
          },
          {
            text: 'Valider',
            onPress: async () => {
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
            },
          },
        ],
      );
    } else {
      startTracking();
    }
  }, [isTracking, startTracking, stopTracking, getTrackStats, track, user?.id, loadProgress, trailId, navProp, isSharing, stopSharing]);

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
          {/* Fleche unique de direction au milieu du trace */}
          {midpointArrowGeoJson && (
            <Mapbox.ShapeSource id="trail-midpoint-arrow-src" shape={midpointArrowGeoJson}>
              <Mapbox.SymbolLayer
                id="trail-midpoint-arrow"
                style={{
                  iconImage: 'triangle-11',
                  iconSize: 0.8,
                  iconRotate: ['get', 'bearing'],
                  iconRotationAlignment: 'map',
                  iconAllowOverlap: true,
                  iconColor: NAV_COLORS.trailTrace,
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
                style={{ lineColor: NAV_COLORS.userTrack, lineWidth: 5, lineOpacity: 0.8 }}
              />
            </Mapbox.ShapeSource>
          )}
          {/* Marqueur point de depart (cercle vert + label) */}
          {startPointGeoJson && (
            <Mapbox.ShapeSource id="start-point" shape={startPointGeoJson}>
              <Mapbox.CircleLayer
                id="start-point-circle"
                style={{
                  circleRadius: 10,
                  circleColor: NAV_COLORS.startPoint,
                  circleOpacity: 0.9,
                  circleStrokeWidth: 3,
                  circleStrokeColor: COLORS.white,
                }}
              />
              <Mapbox.SymbolLayer
                id="start-label"
                style={{
                  textField: 'Depart',
                  textSize: 13,
                  textColor: COLORS.success,
                  textHaloColor: COLORS.black,
                  textHaloWidth: 2,
                  textOffset: [0, -2],
                  textFont: ['Open Sans Bold'],
                  textAllowOverlap: true,
                }}
              />
            </Mapbox.ShapeSource>
          )}
          {/* Marqueur point d'arrivee (cercle rouge + label) */}
          {endPointGeoJson && (
            <Mapbox.ShapeSource id="end-point" shape={endPointGeoJson}>
              <Mapbox.CircleLayer
                id="end-point-circle"
                style={{
                  circleRadius: 10,
                  circleColor: NAV_COLORS.endPoint,
                  circleOpacity: 0.9,
                  circleStrokeWidth: 3,
                  circleStrokeColor: COLORS.white,
                }}
              />
              <Mapbox.SymbolLayer
                id="end-label"
                style={{
                  textField: 'Arrivee',
                  textSize: 13,
                  textColor: COLORS.danger,
                  textHaloColor: COLORS.black,
                  textHaloWidth: 2,
                  textOffset: [0, -2],
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
                  { text: 'Appeler', style: 'destructive', onPress: () => {} },
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
        {/* 3 stats : KM, TEMPS, KM/H */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>
              {isTracking ? distanceKm.toFixed(1) : (trail.distance_km ?? 0).toFixed(1)}
            </Text>
            <Text style={styles.statLabel}>KM</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{formattedTime}</Text>
            <Text style={styles.statLabel}>TEMPS</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{speedKmH.toFixed(1)}</Text>
            <Text style={styles.statLabel}>KM/H</Text>
          </View>
        </View>

        {/* Barre de progression + temps restant (visible pendant le tracking) */}
        {isTracking && (
          <View style={styles.progressSection}>
            <View style={styles.progressBarBackground}>
              <View style={[styles.progressBarFill, { width: `${Math.min(100, progressPercent)}%` }]} />
            </View>
            <View style={styles.progressInfoRow}>
              <Text style={styles.progressPercentText}>{Math.round(progressPercent)}%</Text>
              {estimatedTimeRemaining !== null && estimatedTimeRemaining > 0 && (
                <Text style={styles.estimatedTimeText}>
                  ~{formatDuration(estimatedTimeRemaining)} restantes
                </Text>
              )}
            </View>
          </View>
        )}

        {/* Bouton camera + bouton DEMARRER/ARRETER geant */}
        <View style={styles.ctaRow}>
          <Pressable
            style={styles.cameraButton}
            onPress={() => {
              // Placeholder pour la camera — a connecter a expo-image-picker
            }}
            accessibilityLabel="Prendre une photo"
          >
            <Ionicons name="camera-outline" size={24} color={COLORS.textPrimary} />
          </Pressable>

          <Animated.View style={[styles.ctaButtonWrapper, trackingAnimStyle]}>
            <Pressable
              style={[styles.ctaButton, isTracking ? styles.ctaButtonStop : styles.ctaButtonStart]}
              onPress={handleToggleTracking}
              onPressIn={() => { trackingScale.value = withSpring(0.97, { damping: 15, stiffness: 150 }); }}
              onPressOut={() => { trackingScale.value = withSpring(1, { damping: 15, stiffness: 150 }); }}
              accessibilityLabel={isTracking ? 'Arreter le suivi GPS' : 'Demarrer la randonnee'}
            >
              <Text style={styles.ctaButtonText}>
                {isTracking ? 'ARRETER' : 'DEMARRER'}
              </Text>
            </Pressable>
          </Animated.View>
        </View>
      </View>

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
      <Modal visible={!!selectedReport} animationType="fade" transparent>
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setSelectedReport(null)}
          accessibilityLabel="Fermer le detail du signalement"
        >
          <View style={styles.reportDetailCard}>
            {selectedReport && (() => {
              const config = REPORT_LABELS[selectedReport.report_type];
              const diff = Date.now() - new Date(selectedReport.created_at).getTime();
              const minutes = Math.floor(diff / 60000);
              const timeAgo = minutes < 60
                ? `il y a ${minutes}min`
                : minutes < 1440
                  ? `il y a ${Math.floor(minutes / 60)}h`
                  : `il y a ${Math.floor(minutes / 1440)}j`;

              return (
                <>
                  <View style={styles.reportDetailHeader}>
                    <Ionicons
                      name={config.icon as keyof typeof Ionicons.glyphMap}
                      size={22}
                      color={config.color}
                    />
                    <Text style={[styles.reportDetailType, { color: config.color }]}>
                      {config.label}
                    </Text>
                    <Text style={styles.reportDetailTime}>{timeAgo}</Text>
                    <Pressable
                      onPress={() => setSelectedReport(null)}
                      accessibilityLabel="Fermer"
                    >
                      <Ionicons name="close" size={22} color={COLORS.textMuted} />
                    </Pressable>
                  </View>
                  {selectedReport.message && (
                    <Text style={styles.reportDetailMessage}>{selectedReport.message}</Text>
                  )}
                  {selectedReport.photo_url && (
                    <Image
                      source={{ uri: selectedReport.photo_url }}
                      style={styles.reportDetailPhoto}
                      resizeMode="cover"
                    />
                  )}
                  <Text style={styles.reportDetailAuthor}>
                    Par {selectedReport.user?.username ?? 'un randonneur'}
                  </Text>
                </>
              );
            })()}
          </View>
        </Pressable>
      </Modal>
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
    width: 48,
    height: 48,
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

  // --- SOS + Signaler : petits boutons en haut a droite de la carte ---
  mapOverlayActions: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    gap: SPACING.xs,
  },
  mapOverlayBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.surface + 'E6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  mapOverlayBtnActive: {
    backgroundColor: COLORS.info,
    borderColor: COLORS.info,
  },

  // --- Recenter button ---
  recenterButton: {
    position: 'absolute',
    bottom: SPACING.md,
    right: SPACING.md,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  // --- Compass button (heading-up toggle) ---
  compassButton: {
    position: 'absolute',
    bottom: SPACING.md,
    left: SPACING.md,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  compassButtonActive: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primaryLight,
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

  // --- Stats ENORMES ---
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  statLabel: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
    color: COLORS.textMuted,
    marginTop: 2,
  },

  // --- Progress bar ---
  progressSection: {
    gap: SPACING.xs,
  },
  progressBarBackground: {
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 4,
    backgroundColor: COLORS.success,
    borderRadius: 2,
  },
  progressInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressPercentText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  estimatedTimeText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },

  // --- CTA row (camera + bouton geant) ---
  ctaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  cameraButton: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  ctaButtonWrapper: {
    flex: 1,
  },
  ctaButton: {
    minHeight: 56,
    borderRadius: BORDER_RADIUS.lg,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  ctaButtonStart: {
    backgroundColor: COLORS.success,
    shadowColor: COLORS.success,
  },
  ctaButtonStop: {
    backgroundColor: COLORS.danger,
    shadowColor: COLORS.danger,
  },
  ctaButtonText: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '800',
    color: COLORS.white,
    letterSpacing: 2,
  },

  // --- Modals ---
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
  reportDetailCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginHorizontal: SPACING.lg,
    marginTop: 'auto',
    marginBottom: 'auto',
    maxWidth: 400,
    alignSelf: 'center',
    width: '85%',
  },
  reportDetailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  reportDetailType: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    flex: 1,
  },
  reportDetailTime: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
  },
  reportDetailMessage: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  reportDetailPhoto: {
    width: '100%',
    height: 180,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.sm,
  },
  reportDetailAuthor: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
  },
});
