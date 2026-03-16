import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

interface DayForecast {
  date: string;
  temp_min: number;
  temp_max: number;
  precipitation_mm: number;
  wind_kmh: number;
  icon: string;
  description: string;
}

interface WeatherResult {
  forecasts: DayForecast[];
  cached_at: string;
}

async function fetchWeather(lat: number, lng: number): Promise<WeatherResult> {
  try {
    const { data, error } = await supabase.functions.invoke('weather', {
      body: { lat, lng },
    });

    if (error || !data) {
      return { forecasts: [], cached_at: new Date().toISOString() };
    }

    return data as WeatherResult;
  } catch {
    return { forecasts: [], cached_at: new Date().toISOString() };
  }
}

export function useWeather(lat: number | undefined, lng: number | undefined) {
  return useQuery({
    queryKey: ['weather', lat, lng],
    queryFn: () => fetchWeather(lat!, lng!),
    enabled: lat !== undefined && lng !== undefined,
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
}

export type { DayForecast, WeatherResult };
