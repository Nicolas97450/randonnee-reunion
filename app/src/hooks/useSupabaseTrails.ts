import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { parseWKBPoint } from '@/lib/parseWKB';
import { MOCK_TRAILS } from '@/lib/mockTrails';
import type { Trail } from '@/types';

type TrailData = Omit<Trail, 'id' | 'created_at' | 'updated_at'>;

async function fetchAllTrails(): Promise<TrailData[]> {
  const { data, error } = await supabase
    .from('trails')
    .select('*')
    .order('name');

  if (error) throw error;
  if (!data) return [];

  return data.map((row: Record<string, unknown>) => {
    const parsed = parseWKBPoint((row.start_point as string) ?? '');
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
      start_point: parsed ?? { latitude: -21.1151, longitude: 55.5364 },
      end_point: parsed ?? { latitude: -21.1151, longitude: 55.5364 },
      gpx_url: (row.gpx_url as string) ?? null,
      tiles_url: (row.tiles_url as string) ?? null,
      tiles_size_mb: (row.tiles_size_mb as number) ?? null,
      omf_trail_id: (row.omf_trail_id as string) ?? null,
    };
  });
}

export function useSupabaseTrails() {
  const query = useQuery({
    queryKey: ['all-trails'],
    queryFn: fetchAllTrails,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  return {
    trails: query.data ?? MOCK_TRAILS,
    isLoading: query.isLoading,
    error: query.error,
  };
}
