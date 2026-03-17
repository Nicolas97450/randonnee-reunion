// Edge Function: /batch-trail-status
// Scrape la page ONF des sentiers fermes et met a jour TOUS les statuts
// Declenchee toutes les heures via pg_cron ou GitHub Actions
// Cout : 0 EUR (Supabase free tier ou GitHub Actions gratuit)

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const ONF_URL = 'https://www.onf.fr/vivre-la-foret/+/b90::randonnee-la-reunion-connaitre-les-sentiers-fermes.html';

interface TrailStatus {
  trail_id: string;
  slug: string;
  status: 'ouvert' | 'ferme' | 'degrade' | 'inconnu';
  message: string | null;
}

// Extrait les noms de sentiers fermes depuis la page ONF
function extractClosedTrails(html: string): string[] {
  const closedTrails: string[] = [];
  const lower = html.toLowerCase();

  // Cherche les sections qui mentionnent des fermetures
  // L'ONF liste generalement les sentiers fermes dans des tableaux ou listes
  const patterns = [
    /ferm[ée].*?sentier[s]?\s+(?:de\s+)?([^<.]+)/gi,
    /sentier[s]?\s+(?:de\s+)?([^<.]+?)\s*(?:est|sont)\s+ferm[ée]/gi,
    /interdi[ct].*?sentier[s]?\s+(?:de\s+)?([^<.]+)/gi,
    /<td[^>]*>([^<]+)<\/td>\s*<td[^>]*>[^<]*ferm[ée]/gi,
    /class="[^"]*ferme[^"]*"[^>]*>([^<]+)/gi,
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(html)) !== null) {
      const trailName = match[1].trim();
      if (trailName.length > 3 && trailName.length < 200) {
        closedTrails.push(trailName.toLowerCase());
      }
    }
  }

  // Cherche aussi les mots-cles specifiques de La Reunion
  const keywords = [
    'mafate', 'cilaos', 'salazie', 'volcan', 'fournaise',
    'piton', 'remparts', 'belouve', 'bebour', 'maido',
    'taibit', 'col des boeufs', 'roche plate', 'marla',
  ];

  for (const keyword of keywords) {
    const idx = lower.indexOf(keyword);
    if (idx !== -1) {
      const context = lower.substring(Math.max(0, idx - 300), idx + 300);
      if (
        context.includes('fermé') ||
        context.includes('ferme') ||
        context.includes('interdit') ||
        context.includes('impraticable')
      ) {
        closedTrails.push(keyword);
      }
    }
  }

  return [...new Set(closedTrails)];
}

serve(async (req) => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // 1. Scrape la page ONF
    const response = await fetch(ONF_URL, {
      headers: { 'User-Agent': 'RandonneeReunion/1.0 (batch-status-check)' },
    });

    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: 'ONF website unreachable', status: response.status }),
        { status: 502, headers: { 'Content-Type': 'application/json' } },
      );
    }

    const html = await response.text();
    const closedTrails = extractClosedTrails(html);

    // 2. Recuperer tous les sentiers de la base
    const { data: trails, error: trailsError } = await supabase
      .from('trails')
      .select('id, slug, name');

    if (trailsError || !trails) {
      return new Response(
        JSON.stringify({ error: 'Could not fetch trails', detail: trailsError }),
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      );
    }

    // 3. Determiner le statut de chaque sentier
    const updates: TrailStatus[] = [];
    const now = new Date().toISOString();
    const validUntil = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // +1h

    for (const trail of trails) {
      const nameLower = trail.name.toLowerCase();
      const slugLower = trail.slug.toLowerCase();

      // Verifie si le sentier est dans la liste des fermes
      let isClosed = false;
      for (const closedName of closedTrails) {
        if (
          nameLower.includes(closedName) ||
          slugLower.includes(closedName) ||
          closedName.includes(nameLower.split(' ')[0])
        ) {
          isClosed = true;
          break;
        }
      }

      updates.push({
        trail_id: trail.id,
        slug: trail.slug,
        status: isClosed ? 'ferme' : 'ouvert',
        message: isClosed
          ? 'Sentier signale comme ferme sur le site de l\'ONF'
          : 'Aucune fermeture signalee par l\'ONF',
      });
    }

    // 4. Upsert dans trail_conditions
    const closedCount = updates.filter((u) => u.status === 'ferme').length;
    const openCount = updates.filter((u) => u.status === 'ouvert').length;

    // Supprimer les anciens statuts et inserer les nouveaux
    await supabase.from('trail_conditions').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    const conditions = updates.map((u) => ({
      trail_id: u.trail_id,
      status: u.status,
      message: u.message,
      source: 'onf-batch',
      fetched_at: now,
      valid_until: validUntil,
    }));

    // Inserer par lots de 100
    for (let i = 0; i < conditions.length; i += 100) {
      const batch = conditions.slice(i, i + 100);
      await supabase.from('trail_conditions').insert(batch);
    }

    return new Response(
      JSON.stringify({
        success: true,
        total_trails: trails.length,
        closed: closedCount,
        open: openCount,
        closed_keywords: closedTrails,
        fetched_at: now,
        valid_until: validUntil,
      }),
      { headers: { 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'Batch status update failed', detail: String(err) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
});
