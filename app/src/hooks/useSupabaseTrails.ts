import { useQuery } from '@tanstack/react-query';
import { parseWKBPoint } from '@/lib/parseWKB';
import type { Trail } from '@/types';
import bundledTrails from '@/data/trails.json';

type TrailData = Omit<Trail, 'id' | 'created_at' | 'updated_at'>;

function mapRow(row: Record<string, unknown>): TrailData {
  const parsedStart = row.start_point
    ? parseWKBPoint((row.start_point as string) ?? '')
    : null;
  const parsedEnd = row.end_point
    ? parseWKBPoint((row.end_point as string) ?? '')
    : null;
  return {
    name: row.name as string,
    slug: row.slug as string,
    description: (row.description as string) ?? '',
    difficulty: row.difficulty as Trail['difficulty'],
    distance_km: row.distance_km as number,
    elevation_gain_m: row.elevation_gain_m as number,
    duration_min: row.duration_min as number,
    trail_type: row.trail_type as Trail['trail_type'],
    region: row.region as string,
    start_point: parsedStart ?? null,
    end_point: parsedEnd ?? null,
    gpx_url: (row.gpx_url as string) ?? null,
    tiles_url: (row.tiles_url as string) ?? null,
    tiles_size_mb: (row.tiles_size_mb as number) ?? null,
    omf_trail_id: (row.omf_trail_id as string) ?? null,
  };
}

function loadBundledTrails(): TrailData[] {
  return (bundledTrails as Record<string, unknown>[]).map(mapRow);
}

export function useSupabaseTrails() {
  const query = useQuery({
    queryKey: ['all-trails'],
    queryFn: loadBundledTrails,
    staleTime: Infinity,
    gcTime: Infinity,
  });

  return {
    trails: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
  };
}
