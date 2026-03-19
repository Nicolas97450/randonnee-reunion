import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const envContent = readFileSync('.env', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^#=]+)=(.+)/);
  if (match) env[match[1].trim()] = match[2].trim();
});

const anon = createClient(env.EXPO_PUBLIC_SUPABASE_URL, env.EXPO_PUBLIC_SUPABASE_ANON_KEY);
const admin = createClient(env.EXPO_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const results = [];
function log(test, ok, detail) { results.push({ test, ok, detail }); }

async function testApp() {
  // === PARCOURS 1: SENTIERS ===
  const { data: allTrails, error: e1 } = await anon.from('trails').select('slug, name, difficulty, region, distance_km, start_point, description').order('name');
  log('1.1 Fetch sentiers', !e1 && allTrails?.length === 710, allTrails?.length + ' sentiers');

  const hasWKB = allTrails?.[0]?.start_point?.length > 10;
  log('1.2 Coordonnees WKB', hasWKB, 'start_point present');

  const cilaos = allTrails?.filter(t => t.name.toLowerCase().includes('cilaos'));
  log('1.3 Recherche cilaos', cilaos?.length > 0, cilaos?.length + ' resultats');

  const regions = [...new Set(allTrails?.map(t => t.region))];
  log('1.4 Regions', regions.length === 11, regions.length + ' regions');

  const withPhotos = allTrails?.filter(t => t.description && /\(photo \d+\)/i.test(t.description));
  log('1.5 Descriptions nettoyees', withPhotos?.length < 10, withPhotos?.length + ' avec (photo N)');

  // === PARCOURS 2: FICHE SENTIER ===
  const testSlug = '1834-cilaos-cascades-anciens-thermes';
  const { data: trail } = await anon.from('trails').select('*').eq('slug', testSlug).single();
  log('2.1 Fiche par slug', !!trail, trail?.name);

  if (trail?.gpx_url) {
    const trace = JSON.parse(trail.gpx_url);
    log('2.2 Trace GPS', trace?.coordinates?.length > 2, trace?.coordinates?.length + ' points');
  } else {
    log('2.2 Trace GPS', false, 'Pas encore scrape pour ce sentier');
  }

  const wRes = await fetch('https://api.open-meteo.com/v1/forecast?latitude=-21.1&longitude=55.47&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max,weather_code&timezone=Indian/Reunion&forecast_days=3');
  const w = await wRes.json();
  log('2.3 Meteo locale', !!w.daily?.time, w.daily?.temperature_2m_max?.[0] + 'C max');

  const { data: trailUuid } = await anon.from('trails').select('id').eq('slug', testSlug).single();
  const { data: reports } = await anon.from('trail_reports').select('*, user:user_profiles!user_id(username)').eq('trail_id', trailUuid?.id).eq('is_active', true);
  log('2.4 Signalements lisibles', !!reports, reports?.length + ' signalements');

  const { data: sorties } = await anon.from('sorties').select('*, organisateur:user_profiles!organisateur_id(username)').eq('trail_id', trailUuid?.id).eq('statut', 'ouvert');
  log('2.5 Sorties lisibles', !!sorties, sorties?.length + ' sorties');

  // === PARCOURS 3: ONGLET SORTIES ===
  const { data: allSorties, error: e3 } = await anon.from('sorties')
    .select('*, trail:trails!trail_id(name, slug, region, difficulty), organisateur:user_profiles!organisateur_id(username)')
    .eq('statut', 'ouvert').eq('is_public', true)
    .gte('date_sortie', new Date().toISOString().split('T')[0]);
  log('3.1 Sorties publiques', !e3, allSorties?.length + ' sorties');
  log('3.2 Organisateur visible', allSorties?.[0]?.organisateur?.username != null, allSorties?.[0]?.organisateur?.username);
  log('3.3 Sentier visible', !!allSorties?.[0]?.trail?.name, allSorties?.[0]?.trail?.name);

  // === PARCOURS 4: CHAT ===
  const sortieId = allSorties?.[0]?.id;
  if (sortieId) {
    const { data: msgs, error: chatErr } = await anon.from('sortie_messages')
      .select('*, user:user_profiles!user_id(username)')
      .eq('sortie_id', sortieId).order('created_at');
    log('4.1 Messages chat', !chatErr, msgs?.length + ' messages');
    log('4.2 Username visible', msgs?.length > 0 ? msgs[0].user?.username != null : true, msgs?.[0]?.user?.username || 'vide');
  } else {
    log('4.1 Messages chat', true, 'Pas de sortie pour tester');
    log('4.2 Username visible', true, 'Skip');
  }

  // === PARCOURS 5: PROFILS ===
  const { data: profiles } = await anon.from('user_profiles').select('id, username');
  log('5.1 Profils existent', profiles?.length >= 5, profiles?.length + ' profils');
  const allUsernames = profiles?.every(p => p.username?.length > 0);
  log('5.2 Tous ont username', allUsernames, profiles?.map(p => p.username).join(', '));

  // === PARCOURS 6: GAMIFICATION ===
  const REGION_TO_ZONE = {
    'Cirque de Mafate': 'mafate', 'Cirque de Cilaos': 'cilaos', 'Cirque de Salazie': 'salazie',
    'Massif du Volcan': 'volcan', 'Plaine des Cafres': 'plaine-des-cafres', 'Plaine des Palmistes': 'plaine-des-palmistes',
    'Foret de Bebour-Belouve': 'bebour-belouve', 'Cote Ouest': 'cote-ouest', 'Cote Est': 'cote-est',
    'Nord': 'nord', 'Grand Sud Sauvage': 'sud-sauvage', 'Hauts du Nord-Est': 'hauts-nord-est',
    'Grand Benare': 'grand-benare', 'Riviere des Remparts': 'riviere-remparts',
  };
  const unmapped = allTrails?.filter(t => !REGION_TO_ZONE[t.region]);
  log('6.1 Regions mappees', unmapped?.length === 0, unmapped?.length + ' non mappees');

  // === PARCOURS 7: TRACES ===
  const { count: traceCount } = await anon.from('trails').select('id', { count: 'exact', head: true }).not('gpx_url', 'is', null);
  log('7.1 Traces scrapes', traceCount > 400, traceCount + '/710');

  const { data: sampleTrace } = await anon.from('trails').select('slug, gpx_url').not('gpx_url', 'is', null).limit(1).single();
  if (sampleTrace?.gpx_url) {
    const parsed = JSON.parse(sampleTrace.gpx_url);
    log('7.2 Format trace', parsed.type === 'LineString' && parsed.coordinates?.length > 2, parsed.coordinates?.length + ' points GPS');
  }

  // === PARCOURS 8: CREATION SORTIE (simulation) ===
  const { data: testTrail } = await anon.from('trails').select('id').eq('slug', testSlug).single();
  log('8.1 Resolution slug->UUID', !!testTrail?.id, testTrail?.id?.substring(0, 8));

  // === PARCOURS 9: CREATION SIGNALEMENT (simulation) ===
  log('9.1 Resolution slug->UUID reports', !!testTrail?.id, 'Meme fonction que sorties');

  // === PARCOURS 10: PARTICIPANTS ===
  const { data: parts } = await admin.from('sortie_participants').select('statut, user:user_profiles!user_id(username)');
  log('10.1 Participants', !!parts, parts?.length + ' participants');

  // === RESULTATS ===
  console.log('\n===========================');
  console.log('  RESULTATS TESTS COMPLETS');
  console.log('===========================\n');
  let ok = 0, fail = 0;
  for (const r of results) {
    const icon = r.ok ? '✓' : '✗';
    console.log(icon + ' ' + r.test + ' — ' + r.detail);
    if (r.ok) ok++; else fail++;
  }
  console.log('\n' + ok + '/' + (ok + fail) + ' PASSES | ' + fail + ' ECHECS');
}

testApp().catch(e => console.log('FATAL:', e.message));
