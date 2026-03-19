import { useEffect, useRef, useState, useCallback } from 'react';

const OSRM_BASE = 'https://router.project-osrm.org/route/v1/foot';
const THROTTLE_MS = 30_000;

interface LatLng {
  latitude: number;
  longitude: number;
}

interface RouteResult {
  /** GeoJSON LineString geometry for the route */
  geometry: GeoJSON.LineString | null;
  /** Route distance in kilometers */
  distanceKm: number | null;
  /** Route duration in minutes */
  durationMin: number | null;
  /** True while fetching */
  isLoading: boolean;
  /** True if using OSRM route, false if fallback straight line */
  isRealRoute: boolean;
}

/**
 * Fetches a driving route from OSRM between two points.
 * Throttled to one request per 30 seconds.
 * Falls back to a straight line if the request fails.
 */
export function useRouting(
  origin: LatLng | null,
  destination: LatLng | null,
): RouteResult {
  const [geometry, setGeometry] = useState<GeoJSON.LineString | null>(null);
  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  const [durationMin, setDurationMin] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRealRoute, setIsRealRoute] = useState(false);

  const lastFetchTime = useRef(0);
  const lastOriginKey = useRef('');
  const abortRef = useRef<AbortController | null>(null);

  const buildFallbackLine = useCallback(
    (orig: LatLng, dest: LatLng): GeoJSON.LineString => ({
      type: 'LineString',
      coordinates: [
        [orig.longitude, orig.latitude],
        [dest.longitude, dest.latitude],
      ],
    }),
    [],
  );

  useEffect(() => {
    if (!origin || !destination) {
      setGeometry(null);
      setDistanceKm(null);
      setDurationMin(null);
      setIsRealRoute(false);
      return;
    }

    // Round to ~11m precision to avoid re-fetching on tiny GPS jitter
    const originKey = `${origin.latitude.toFixed(4)},${origin.longitude.toFixed(4)}`;

    // Throttle: skip if same rounded position or too soon
    const now = Date.now();
    if (
      originKey === lastOriginKey.current &&
      now - lastFetchTime.current < THROTTLE_MS
    ) {
      return;
    }

    lastOriginKey.current = originKey;

    // Cancel any in-flight request
    if (abortRef.current) {
      abortRef.current.abort();
    }

    const controller = new AbortController();
    abortRef.current = controller;

    const url = `${OSRM_BASE}/${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}?overview=full&geometries=geojson`;

    setIsLoading(true);

    fetch(url, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`OSRM ${res.status}`);
        return res.json();
      })
      .then((data) => {
        const route = data?.routes?.[0];
        if (!route?.geometry) {
          throw new Error('No route in OSRM response');
        }
        setGeometry(route.geometry as GeoJSON.LineString);
        setDistanceKm(route.distance / 1000);
        setDurationMin(Math.round(route.duration / 60));
        setIsRealRoute(true);
        lastFetchTime.current = Date.now();
      })
      .catch((err) => {
        if (err.name === 'AbortError') return;
        // Fallback: straight line, no distance/duration from OSRM
        setGeometry(buildFallbackLine(origin, destination));
        setIsRealRoute(false);
        // Keep previous OSRM distance if available, otherwise clear
        setDistanceKm(null);
        setDurationMin(null);
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      });

    return () => {
      controller.abort();
    };
  }, [
    origin?.latitude,
    origin?.longitude,
    destination?.latitude,
    destination?.longitude,
    buildFallbackLine,
  ]);

  return { geometry, distanceKm, durationMin, isLoading, isRealRoute };
}
