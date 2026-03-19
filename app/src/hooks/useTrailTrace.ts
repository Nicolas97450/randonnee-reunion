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

  if (error || !data?.gpx_url) {
    console.warn(`[useTrailTrace] No gpx_url for slug "${slug}":`, error?.message ?? 'gpx_url is null');
    return null;
  }

  try {
    const trace = JSON.parse(data.gpx_url) as TrailTrace;
    if (trace.type !== 'LineString' || !trace.coordinates?.length || trace.coordinates.length < 2) {
      console.warn(`[useTrailTrace] Invalid trace for slug "${slug}": type=${trace.type}, coords=${trace.coordinates?.length ?? 0}`);
      return null;
    }

    // Validate coordinate order: GeoJSON/Mapbox expects [lng, lat]
    // La Réunion bounds: lat -20.85 to -21.40, lng 55.20 to 55.85
    const [firstLng, firstLat] = trace.coordinates[0];
    if (firstLng < -90 || firstLng > 90) {
      // Coordinates appear swapped (lng value looks like a latitude), swap them
      console.warn(`[useTrailTrace] Swapping coordinates for slug "${slug}" — detected [lat, lng] instead of [lng, lat]`);
      trace.coordinates = trace.coordinates.map(([lat, lng]) => [lng, lat]);
    }

    return trace;
  } catch (e) {
    console.warn(`[useTrailTrace] JSON parse error for slug "${slug}":`, e);
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
