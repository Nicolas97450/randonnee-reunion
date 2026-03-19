import { useQuery } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';
import type { Trail } from '@/types';

// Coordonnees pre-parsees (63KB — Hermes compatible)
import trailCoords from '@/data/trail-coords.json';

type TrailData = Omit<Trail, 'id' | 'created_at' | 'updated_at'>;

const CACHE_KEY = 'trails-v4';
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 jours

// Map slug → {lat, lng} pour lookup rapide
const coordsMap = new Map<string, { lat: number; lng: number }>();
(trailCoords as Array<{ slug: string; lat: number | null; lng: number | null }>).forEach((c) => {
  if (c.lat && c.lng) coordsMap.set(c.slug, { lat: c.lat, lng: c.lng });
});

function mapRow(row: Record<string, unknown>): TrailData {
  const slug = row.slug as string;
  const coords = coordsMap.get(slug);

  return {
    name: row.name as string,
    slug,
    description: (row.description as string) ?? '',
    difficulty: row.difficulty as Trail['difficulty'],
    distance_km: row.distance_km as number,
    elevation_gain_m: row.elevation_gain_m as number,
    duration_min: row.duration_min as number,
    trail_type: row.trail_type as Trail['trail_type'],
    region: row.region as string,
    start_point: coords ? { latitude: coords.lat, longitude: coords.lng } : null,
    end_point: null,
    gpx_url: null,
    tiles_url: null,
    tiles_size_mb: null,
    omf_trail_id: null,
  };
}

async function fetchLightTrails(): Promise<TrailData[]> {
  // On ne charge PAS start_point (WKB) ni description ni gpx_url
  // Les coordonnees viennent du fichier local pre-parse
  const { data, error } = await supabase
    .from('trails')
    .select('name,slug,difficulty,distance_km,elevation_gain_m,duration_min,trail_type,region')
    .order('name');

  if (error) throw error;
  if (!data) return [];

  return data.map((row: Record<string, unknown>) => mapRow(row));
}

async function fetchAllTrails(): Promise<TrailData[]> {
  // 1. Cache d'abord
  try {
    const cached = await AsyncStorage.getItem(CACHE_KEY);
    if (cached) {
      const { data, timestamp } = JSON.parse(cached) as { data: TrailData[]; timestamp: number };
      if (Date.now() - timestamp < CACHE_TTL && data.length > 0) {
        return data;
      }
    }
  } catch {
    // Cache corrompu
  }

  // 2. Supabase (colonnes legeres, ~200KB)
  const trails = await fetchLightTrails();

  // 3. Cache
  if (trails.length > 0) {
    AsyncStorage.setItem(CACHE_KEY, JSON.stringify({ data: trails, timestamp: Date.now() })).catch(() => {});
  }

  return trails;
}

export function useSupabaseTrails() {
  const query = useQuery({
    queryKey: ['all-trails'],
    queryFn: fetchAllTrails,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  return {
    trails: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
  };
}
