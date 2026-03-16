// Edge Function: /trail-status?trailId=X
// Scrape l'état du sentier depuis sentiers.reunion.fr
// Cache: 1 heure par sentier

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CACHE = new Map<string, { data: unknown; expires: number }>();
const CACHE_TTL = 60 * 60 * 1000; // 1 heure

interface TrailStatusResult {
  status: 'ouvert' | 'ferme' | 'degrade' | 'inconnu';
  message: string | null;
  source: string;
  fetched_at: string;
}

function parseStatus(html: string): TrailStatusResult {
  // Cherche les indicateurs de statut dans le HTML
  const lowerHtml = html.toLowerCase();

  let status: TrailStatusResult['status'] = 'inconnu';
  let message: string | null = null;

  if (lowerHtml.includes('ouvert') || lowerHtml.includes('praticable')) {
    status = 'ouvert';
    message = 'Sentier ouvert et praticable';
  } else if (lowerHtml.includes('fermé') || lowerHtml.includes('ferme') || lowerHtml.includes('interdit')) {
    status = 'ferme';
    // Try to extract reason
    const reasonMatch = html.match(/ferm[ée].*?[.:]\s*(.+?)(?:<|$)/i);
    message = reasonMatch ? reasonMatch[1].trim() : 'Sentier ferme par arrete prefectoral';
  } else if (lowerHtml.includes('dégradé') || lowerHtml.includes('degrade') || lowerHtml.includes('prudence')) {
    status = 'degrade';
    message = 'Sentier praticable avec prudence';
  }

  return {
    status,
    message,
    source: 'sentiers.reunion.fr',
    fetched_at: new Date().toISOString(),
  };
}

serve(async (req) => {
  const url = new URL(req.url);
  const trailId = url.searchParams.get('trailId');

  if (!trailId) {
    return new Response(JSON.stringify({ error: 'trailId required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Check cache
  const cached = CACHE.get(trailId);
  if (cached && cached.expires > Date.now()) {
    return new Response(JSON.stringify(cached.data), {
      headers: { 'Content-Type': 'application/json', 'X-Cache': 'HIT' },
    });
  }

  try {
    // Scrape OMF website
    const omfUrl = `https://sentiers.reunion.fr/sentier/${trailId}`;
    const response = await fetch(omfUrl, {
      headers: {
        'User-Agent': 'RandonneeReunion/1.0 (contact@randonnee-reunion.re)',
      },
    });

    let result: TrailStatusResult;

    if (response.ok) {
      const html = await response.text();
      result = parseStatus(html);
    } else {
      // Fallback: check Supabase cache
      result = {
        status: 'inconnu',
        message: 'Impossible de recuperer le statut OMF',
        source: 'cache',
        fetched_at: new Date().toISOString(),
      };
    }

    // Store in cache
    CACHE.set(trailId, { data: result, expires: Date.now() + CACHE_TTL });

    // Also persist to Supabase for offline access
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
      const supabase = createClient(supabaseUrl, supabaseKey);

      await supabase.from('trail_conditions').upsert({
        trail_id: trailId,
        status: result.status,
        message: result.message,
        source: result.source,
        fetched_at: result.fetched_at,
        valid_until: new Date(Date.now() + CACHE_TTL).toISOString(),
      }, {
        onConflict: 'trail_id',
      });
    } catch {
      // Non-blocking: cache in DB is best-effort
    }

    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json', 'X-Cache': 'MISS' },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'Erreur lors du scraping OMF', detail: String(err) }),
      { status: 502, headers: { 'Content-Type': 'application/json' } },
    );
  }
});
