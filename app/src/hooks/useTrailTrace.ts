import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

interface TrailTrace {
  type: 'LineString';
  coordinates: [number, number][]; // [lng, lat]
}

async function fetchTrailTrace(slug: string): Promise<TrailTrace | null> {
  // Resolve slug to get gpx_url (which stores the trace GeoJSON)
  const { data, error } = await supabase
    .from('trails')
    .select('gpx_url')
    .eq('slug', slug)
    .single();

  if (error || !data?.gpx_url) return null;

  try {
    const trace = JSON.parse(data.gpx_url) as TrailTrace;
    if (trace.type === 'LineString' && trace.coordinates?.length >= 2) {
      return trace;
    }
    return null;
  } catch {
    return null;
  }
}

export function useTrailTrace(slug: string) {
  return useQuery({
    queryKey: ['trail-trace', slug],
    queryFn: () => fetchTrailTrace(slug),
    enabled: !!slug,
    staleTime: 60 * 60 * 1000, // 1h cache
  });
}
