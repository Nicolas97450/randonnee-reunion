import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Difficulty, TrailType } from '@/types';

interface TrailRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  difficulty: Difficulty;
  distance_km: number;
  elevation_gain_m: number;
  duration_min: number;
  trail_type: TrailType;
  region: string;
  start_point: string; // PostGIS returns WKT
  gpx_url: string | null;
  tiles_url: string | null;
  tiles_size_mb: number | null;
  omf_trail_id: string | null;
  created_at: string;
  updated_at: string;
}

interface UseTrailsOptions {
  difficulty?: Difficulty;
  region?: string;
  search?: string;
}

async function fetchTrails(options: UseTrailsOptions): Promise<TrailRow[]> {
  let query = supabase
    .from('trails')
    .select('*')
    .order('name', { ascending: true });

  if (options.difficulty) {
    query = query.eq('difficulty', options.difficulty);
  }
  if (options.region) {
    query = query.eq('region', options.region);
  }
  if (options.search) {
    query = query.or(`name.ilike.%${options.search}%,region.ilike.%${options.search}%`);
  }

  const { data, error } = await query;

  if (error) throw new Error(error.message);
  return data as TrailRow[];
}

export function useTrails(options: UseTrailsOptions = {}) {
  return useQuery({
    queryKey: ['trails', options],
    queryFn: () => fetchTrails(options),
  });
}

async function fetchTrailBySlug(slug: string): Promise<TrailRow | null> {
  const { data, error } = await supabase
    .from('trails')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error) throw new Error(error.message);
  return data as TrailRow;
}

export function useTrail(slug: string) {
  return useQuery({
    queryKey: ['trail', slug],
    queryFn: () => fetchTrailBySlug(slug),
    enabled: !!slug,
  });
}
