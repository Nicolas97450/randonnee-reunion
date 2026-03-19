import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

interface TrailDetail {
  description: string;
  gpx_url: string | null;
}

async function fetchTrailDetail(slug: string): Promise<TrailDetail | null> {
  const { data, error } = await supabase
    .from('trails')
    .select('description,gpx_url')
    .eq('slug', slug)
    .single();

  if (error || !data) return null;

  return {
    description: (data.description as string) ?? '',
    gpx_url: (data.gpx_url as string) ?? null,
  };
}

export function useTrailDetail(slug: string) {
  return useQuery({
    queryKey: ['trail-detail', slug],
    queryFn: () => fetchTrailDetail(slug),
    enabled: !!slug,
    staleTime: 60 * 60 * 1000, // 1h
  });
}
