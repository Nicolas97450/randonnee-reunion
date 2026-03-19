import { useQuery } from '@tanstack/react-query';

interface DayForecast {
  date: string;
  temp_min: number;
  temp_max: number;
  precipitation_mm: number;
  wind_kmh: number;
  wind_gusts_kmh: number;
  uv_index_max: number;
  sunrise: string;
  sunset: string;
  visibility_m: number;
  icon: string;
  description: string;
}

interface WeatherResult {
  forecasts: DayForecast[];
  cached_at: string;
}

function mapWmoIcon(code: number): string {
  if (code === 0) return 'sunny';
  if (code <= 3) return 'partly-cloudy';
  if (code <= 48) return 'cloudy';
  if (code <= 57) return 'rainy';
  if (code <= 67) return 'rainy';
  if (code <= 77) return 'cloudy';
  if (code <= 82) return 'rainy';
  if (code <= 86) return 'cloudy';
  if (code >= 95) return 'stormy';
  return 'cloudy';
}

function mapWmoDescription(code: number): string {
  // Descriptions adaptees au climat tropical de La Reunion
  if (code === 0) return 'Grand soleil';
  if (code <= 3) return 'Partiellement nuageux';
  if (code <= 48) return 'Brouillard en altitude';
  if (code <= 57) return 'Crachin';
  if (code <= 65) return 'Pluie';
  if (code <= 67) return 'Forte pluie';
  if (code <= 77) return 'Froid en altitude';
  if (code <= 82) return 'Averses tropicales';
  if (code <= 86) return 'Froid et pluie en altitude';
  if (code === 95) return 'Orage tropical';
  if (code <= 99) return 'Orage violent';
  return 'Conditions inconnues';
}

async function fetchWeather(lat: number, lng: number): Promise<WeatherResult> {
  try {
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max,wind_gusts_10m_max,uv_index_max,sunrise,sunset,weather_code&hourly=visibility&timezone=Indian/Reunion&forecast_days=3`,
    );

    if (!response.ok) {
      return { forecasts: [], cached_at: new Date().toISOString() };
    }

    const json = await response.json();
    const daily = json.daily;

    if (!daily || !daily.time) {
      return { forecasts: [], cached_at: new Date().toISOString() };
    }

    // Compute min visibility per day from hourly data (24 hours per day)
    const hourly = json.hourly;
    const dailyMinVisibility: number[] = daily.time.map((_: string, dayIdx: number) => {
      if (!hourly?.visibility) return Infinity;
      const startHour = dayIdx * 24;
      const endHour = Math.min(startHour + 24, hourly.visibility.length);
      let minVis = Infinity;
      for (let h = startHour; h < endHour; h++) {
        const v = hourly.visibility[h];
        if (v != null && v < minVis) minVis = v;
      }
      return minVis === Infinity ? 99999 : minVis;
    });

    const forecasts: DayForecast[] = daily.time.map((date: string, i: number) => ({
      date,
      temp_min: daily.temperature_2m_min[i],
      temp_max: daily.temperature_2m_max[i],
      precipitation_mm: daily.precipitation_sum[i] ?? 0,
      wind_kmh: daily.wind_speed_10m_max[i] ?? 0,
      wind_gusts_kmh: daily.wind_gusts_10m_max?.[i] ?? 0,
      uv_index_max: daily.uv_index_max?.[i] ?? 0,
      sunrise: daily.sunrise?.[i] ?? '',
      sunset: daily.sunset?.[i] ?? '',
      visibility_m: dailyMinVisibility[i],
      icon: mapWmoIcon(daily.weather_code[i]),
      description: mapWmoDescription(daily.weather_code[i]),
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
