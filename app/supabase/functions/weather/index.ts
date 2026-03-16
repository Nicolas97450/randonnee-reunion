// Edge Function: /weather?lat=X&lng=Y
// Proxy vers l'API meteo-concept (gratuite, 500 appels/jour)
// Cache: 30 minutes par coordonnées

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const METEO_API_KEY = Deno.env.get('METEO_API_KEY') ?? '';
const CACHE = new Map<string, { data: unknown; expires: number }>();
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

interface MeteoResponse {
  temperature_min: number;
  temperature_max: number;
  precipitation_mm: number;
  wind_kmh: number;
  icon: string;
  description: string;
}

interface DayForecast {
  date: string;
  temp_min: number;
  temp_max: number;
  precipitation_mm: number;
  wind_kmh: number;
  icon: string;
  description: string;
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
    13: 'Pluie verglaçante',
    14: 'Pluie verglaçante forte',
    15: 'Neige faible',
    16: 'Neige forte',
    20: 'Averses de pluie',
    21: 'Averses de pluie forte',
    22: 'Averses de neige',
    30: 'Orage faible',
    31: 'Orage fort',
    32: 'Orage avec grele',
  };
  return descriptions[code] ?? 'Conditions inconnues';
}

serve(async (req) => {
  const url = new URL(req.url);
  const lat = url.searchParams.get('lat');
  const lng = url.searchParams.get('lng');

  if (!lat || !lng) {
    return new Response(JSON.stringify({ error: 'lat and lng required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Round coordinates for cache key (precision ~1km)
  const cacheKey = `${parseFloat(lat).toFixed(2)},${parseFloat(lng).toFixed(2)}`;

  // Check cache
  const cached = CACHE.get(cacheKey);
  if (cached && cached.expires > Date.now()) {
    return new Response(JSON.stringify(cached.data), {
      headers: { 'Content-Type': 'application/json', 'X-Cache': 'HIT' },
    });
  }

  try {
    const apiUrl = `https://api.meteo-concept.com/api/forecast/daily?token=${METEO_API_KEY}&latlng=${lat},${lng}`;
    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error(`Meteo API returned ${response.status}`);
    }

    const json = await response.json();
    const forecasts: DayForecast[] = json.forecast.slice(0, 3).map((day: any) => ({
      date: day.datetime,
      temp_min: day.tmin,
      temp_max: day.tmax,
      precipitation_mm: day.rr10 ?? 0,
      wind_kmh: day.wind10m ?? 0,
      icon: mapWeatherIcon(day.weather),
      description: mapDescription(day.weather),
    }));

    const result = { forecasts, cached_at: new Date().toISOString() };

    // Store in cache
    CACHE.set(cacheKey, { data: result, expires: Date.now() + CACHE_TTL });

    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json', 'X-Cache': 'MISS' },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'Impossible de recuperer la meteo', detail: String(err) }),
      { status: 502, headers: { 'Content-Type': 'application/json' } },
    );
  }
});
