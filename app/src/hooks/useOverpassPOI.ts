import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// --- Types ---

export type POIType =
  | 'restaurant'
  | 'cafe'
  | 'bar'
  | 'fast_food'
  | 'shelter'
  | 'drinking_water'
  | 'toilets'
  | 'viewpoint'
  | 'picnic_site'
  | 'alpine_hut'
  | 'spring'
  | 'waterfall'
  | 'peak'
  | 'parking';

export interface POIProperties {
  id: number;
  name: string;
  poiType: POIType;
}

export type POIFeature = GeoJSON.Feature<GeoJSON.Point, POIProperties>;
export type POIFeatureCollection = GeoJSON.FeatureCollection<GeoJSON.Point, POIProperties>;

// --- Constants ---

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';
const REUNION_BBOX = '(-21.4,55.2,-20.85,55.85)';
const CACHE_KEY = 'overpass_poi_cache';
const CACHE_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 jours

const QUERY = `[out:json][timeout:30];(
  node["amenity"~"restaurant|cafe|bar|fast_food|shelter|drinking_water|toilets"]${REUNION_BBOX};
  node["tourism"~"viewpoint|picnic_site|alpine_hut"]${REUNION_BBOX};
  node["natural"~"spring|waterfall|peak"]${REUNION_BBOX};
  node["amenity"="parking"]["access"!="private"]${REUNION_BBOX};
);out body;`;

// --- Helpers ---

function classifyNode(tags: Record<string, string>): POIType | null {
  // Amenity
  if (tags.amenity === 'restaurant') return 'restaurant';
  if (tags.amenity === 'cafe') return 'cafe';
  if (tags.amenity === 'bar') return 'bar';
  if (tags.amenity === 'fast_food') return 'fast_food';
  if (tags.amenity === 'shelter') return 'shelter';
  if (tags.amenity === 'drinking_water') return 'drinking_water';
  if (tags.amenity === 'toilets') return 'toilets';
  if (tags.amenity === 'parking') return 'parking';
  // Tourism
  if (tags.tourism === 'viewpoint') return 'viewpoint';
  if (tags.tourism === 'picnic_site') return 'picnic_site';
  if (tags.tourism === 'alpine_hut') return 'alpine_hut';
  // Natural
  if (tags.natural === 'spring') return 'spring';
  if (tags.natural === 'waterfall') return 'waterfall';
  if (tags.natural === 'peak') return 'peak';
  return null;
}

interface OverpassElement {
  type: string;
  id: number;
  lat: number;
  lon: number;
  tags?: Record<string, string>;
}

function parseOverpassResponse(elements: OverpassElement[]): POIFeatureCollection {
  const features: POIFeature[] = [];

  for (const el of elements) {
    if (el.type !== 'node' || !el.tags) continue;
    const poiType = classifyNode(el.tags);
    if (!poiType) continue;

    features.push({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [el.lon, el.lat],
      },
      properties: {
        id: el.id,
        name: el.tags.name ?? '',
        poiType,
      },
    });
  }

  return {
    type: 'FeatureCollection',
    features,
  };
}

// --- Cache ---

interface CacheEntry {
  timestamp: number;
  data: POIFeatureCollection;
}

async function getCachedPOI(): Promise<POIFeatureCollection | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const entry: CacheEntry = JSON.parse(raw);
    const age = Date.now() - entry.timestamp;
    if (age > CACHE_DURATION_MS) {
      await AsyncStorage.removeItem(CACHE_KEY);
      return null;
    }
    return entry.data;
  } catch {
    return null;
  }
}

async function setCachedPOI(data: POIFeatureCollection): Promise<void> {
  try {
    const entry: CacheEntry = { timestamp: Date.now(), data };
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(entry));
  } catch {
    // Silently fail — cache is best-effort
  }
}

// --- Fetch ---

async function fetchOverpassPOI(): Promise<POIFeatureCollection> {
  const body = `data=${encodeURIComponent(QUERY)}`;
  const response = await fetch(OVERPASS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  if (!response.ok) {
    throw new Error(`Overpass API error: ${response.status}`);
  }

  const json = await response.json();
  return parseOverpassResponse(json.elements ?? []);
}

// --- Hook ---

interface UseOverpassPOIResult {
  pois: POIFeatureCollection | null;
  isLoading: boolean;
  error: string | null;
}

export function useOverpassPOI(): UseOverpassPOIResult {
  const [pois, setPois] = useState<POIFeatureCollection | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        // Try cache first
        const cached = await getCachedPOI();
        if (cached) {
          if (!cancelled) {
            setPois(cached);
            setIsLoading(false);
          }
          return;
        }

        // Fetch from Overpass
        const data = await fetchOverpassPOI();
        if (!cancelled) {
          setPois(data);
          setIsLoading(false);
          await setCachedPOI(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Erreur chargement POI');
          setIsLoading(false);
        }
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  return { pois, isLoading, error };
}
