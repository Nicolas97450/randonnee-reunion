import { useQuery } from '@tanstack/react-query';

interface ElevationResult {
  elevations: number[];
  minElev: number;
  maxElev: number;
  totalAscent: number;
  totalDescent: number;
}

function subsample(coordinates: [number, number][], targetCount: number): [number, number][] {
  if (coordinates.length <= targetCount) return coordinates;
  const step = (coordinates.length - 1) / (targetCount - 1);
  const result: [number, number][] = [];
  for (let i = 0; i < targetCount; i++) {
    const idx = Math.round(i * step);
    result.push(coordinates[idx]);
  }
  return result;
}

async function fetchElevation(coordinates: [number, number][]): Promise<ElevationResult> {
  const sampled = subsample(coordinates, 50);

  // coordinates are [lng, lat] — Open-Elevation expects { latitude, longitude }
  const locations = sampled.map(([lng, lat]) => ({
    latitude: lat,
    longitude: lng,
  }));

  const response = await fetch('https://api.open-elevation.com/api/v1/lookup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ locations }),
  });

  if (!response.ok) {
    throw new Error(`Open-Elevation API error: ${response.status}`);
  }

  const json = await response.json();

  if (!json.results || !Array.isArray(json.results)) {
    throw new Error('Open-Elevation: invalid response format');
  }

  const elevations: number[] = json.results.map((r: { elevation: number }) => r.elevation);

  let minElev = Infinity;
  let maxElev = -Infinity;
  let totalAscent = 0;
  let totalDescent = 0;

  for (let i = 0; i < elevations.length; i++) {
    const elev = elevations[i];
    if (elev < minElev) minElev = elev;
    if (elev > maxElev) maxElev = elev;
    if (i > 0) {
      const diff = elev - elevations[i - 1];
      if (diff > 0) totalAscent += diff;
      else totalDescent += Math.abs(diff);
    }
  }

  return {
    elevations,
    minElev: minElev === Infinity ? 0 : Math.round(minElev),
    maxElev: maxElev === -Infinity ? 0 : Math.round(maxElev),
    totalAscent: Math.round(totalAscent),
    totalDescent: Math.round(totalDescent),
  };
}

export function useElevation(coordinates: [number, number][] | undefined) {
  return useQuery({
    queryKey: ['elevation', coordinates?.length, coordinates?.[0]?.[0], coordinates?.[0]?.[1]],
    queryFn: () => fetchElevation(coordinates!),
    enabled: !!coordinates && coordinates.length >= 2,
    staleTime: 24 * 60 * 60 * 1000, // 24h
    retry: 1,
  });
}

export type { ElevationResult };
