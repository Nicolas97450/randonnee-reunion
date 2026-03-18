import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Load env
const envContent = readFileSync('.env', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^#=]+)=(.+)/);
  if (match) env[match[1].trim()] = match[2].trim();
});

const supabase = createClient(env.EXPO_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function extractTrace(rpId) {
  try {
    const res = await fetch(`https://randopitons.re/randonnee/${rpId}`, {
      headers: { 'User-Agent': 'RandonneeReunion/1.0' },
    });
    if (!res.ok) return null;
    const html = await res.text();

    // Extract raw coordinates [lat, lng] from page
    const matches = html.match(/\[\s*-?2[01]\.\d+\s*,\s*5[45]\.\d+[^\]]*\]/g);
    if (!matches || matches.length < 2) return null;

    const coords = matches.map(m => {
      const nums = m.match(/-?\d+\.\d+/g);
      if (nums && nums.length >= 2) return [parseFloat(nums[1]), parseFloat(nums[0])]; // [lng, lat]
      return null;
    }).filter(Boolean);

    if (coords.length < 2) return null;

    return {
      type: 'LineString',
      coordinates: coords,
    };
  } catch {
    return null;
  }
}

async function main() {
  // Check if trail_traces column exists, if not we'll store as gpx_url JSON
  const { data: trails } = await supabase.from('trails').select('id, slug').order('slug');

  console.log(`Scraping traces for ${trails.length} trails...`);

  let success = 0;
  let failed = 0;
  const BATCH_SIZE = 5;
  const DELAY = 500; // ms between batches to not hammer the server

  for (let i = 0; i < trails.length; i += BATCH_SIZE) {
    const batch = trails.slice(i, i + BATCH_SIZE);

    const results = await Promise.all(batch.map(async (trail) => {
      const rpId = trail.slug.match(/^(\d+)-/)?.[1];
      if (!rpId) return { id: trail.id, trace: null };

      const trace = await extractTrace(rpId);
      return { id: trail.id, slug: trail.slug, trace };
    }));

    for (const result of results) {
      if (result.trace && result.trace.coordinates.length >= 2) {
        // Store trace as JSON in gpx_url field (repurposed)
        const { error } = await supabase
          .from('trails')
          .update({ gpx_url: JSON.stringify(result.trace) })
          .eq('id', result.id);

        if (!error) {
          success++;
        } else {
          console.error(`  DB error for ${result.slug}:`, error.message);
          failed++;
        }
      } else {
        failed++;
      }
    }

    if (i % 50 === 0) {
      console.log(`  Progress: ${i + batch.length}/${trails.length} | OK: ${success} | Failed: ${failed}`);
    }

    // Delay between batches
    await new Promise(r => setTimeout(r, DELAY));
  }

  console.log(`\nDone! Success: ${success} | Failed: ${failed} | Total: ${trails.length}`);
}

main().catch(console.error);
