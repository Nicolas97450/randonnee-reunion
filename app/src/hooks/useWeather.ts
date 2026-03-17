import { useQuery } from '@tanstack/react-query';

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

function mapWeatherIcon(code: number): string {
  if (code <= 1) return 'sunny';
  if (code <= 3) return 'partly-cloudy';
  if (code <= 7) return 'cloudy';
  if (code <= 16) return 'rainy';
  if (code <= 32) return 'stormy';
  return 'cloudy';
}

function mapDescription(code: number): string {
  const descriptions: Record<number, string> = {
    0: 'Ensoleille',
    1: 'Peu nuageux',
    2: 'Ciel voile',
    3: 'Nuageux',
    4: 'Tres nuageux',
    5: 'Couvert',
    6: 'Brouillard',
    7: 'Brouillard givrant',
    10: 'Pluie faible',
    11: 'Pluie moderee',
    12: 'Pluie forte',
    13: 'Pluie verglacante',
    20: 'Averses de pluie',
    21: 'Averses de pluie forte',
    30: 'Orage faible',
    31: 'Orage fort',
    32: 'Orage avec grele',
  };
  return descriptions[code] ?? 'Conditions inconnues';
}

async function fetchWeather(lat: number, lng: number): Promise<WeatherResult> {
  const apiKey = process.env.EXPO_PUBLIC_METEO_API_KEY;
  if (!apiKey) {
    return { forecasts: [], cached_at: new Date().toISOString() };
  }

  try {
    const response = await fetch(
      `https://api.meteo-concept.com/api/forecast/daily?token=${apiKey}&latlng=${lat},${lng}`,
    );

    if (!response.ok) {
      return { forecasts: [], cached_at: new Date().toISOString() };
    }

    const json = await response.json();
    const forecasts: DayForecast[] = json.forecast.slice(0, 3).map((day: Record<string, unknown>) => ({
      date: day.datetime as string,
      temp_min: day.tmin as number,
      temp_max: day.tmax as number,
      precipitation_mm: (day.rr10 as number) ?? 0,
      wind_kmh: (day.wind10m as number) ?? 0,
      icon: mapWeatherIcon(day.weather as number),
      description: mapDescription(day.weather as number),
    }));

    return { forecasts, cached_at: new Date().toISOString() };
  } catch {
    return { forecasts: [], cached_at: new Date().toISOString() };
  }
}

export function useWeather(lat: number | undefined, lng: number | undefined) {
  return useQuery({
    queryKey: ['weather', lat, lng],
    queryFn: () => fetchWeather(lat!, lng!),
    enabled: lat !== undefined && lng !== undefined,
    staleTime: 30 * 60 * 1000,
  });
}

export type { DayForecast, WeatherResult };
