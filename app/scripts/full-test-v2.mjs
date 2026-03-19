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

async function testAll() {

  // ========== 1. SENTIERS ==========
  const { data: allTrails, error: e1 } = await anon.from('trails').select('slug, name, difficulty, region, distance_km, start_point, description, gpx_url').order('name');
  log('1.1 Fetch 710 sentiers', !e1 && allTrails?.length === 710, allTrails?.length + ' sentiers');

  const regions = [...new Set(allTrails?.map(t => t.region))];
  log('1.2 11 regions', regions.length === 11, regions.join(', '));

  const withTrace = allTrails?.filter(t => t.gpx_url);
  log('1.3 Traces GPS', withTrace?.length === 710, withTrace?.length + '/710');

  // Verify trace format
  if (withTrace?.[0]?.gpx_url) {
    const trace = JSON.parse(withTrace[0].gpx_url);
    log('1.4 Format trace valide', trace.type === 'LineString' && trace.coordinates?.length >= 2, trace.coordinates?.length + ' points');
  }

  const withPhotos = allTrails?.filter(t => t.description && /\(photo \d+\)/i.test(t.description));
  log('1.5 Descriptions nettoyees', withPhotos?.length === 0, withPhotos?.length + ' avec (photo N)');

  // Search test
  const cilaos = allTrails?.filter(t => t.name.toLowerCase().includes('cilaos'));
  log('1.6 Recherche cilaos', cilaos?.length > 0, cilaos?.length + ' resultats');

  // ========== 2. PROFILS ==========
  const { data: profiles } = await anon.from('user_profiles').select('id, username, avatar_url');
  log('2.1 Profils existent', profiles?.length >= 5, profiles?.length + ' profils');
  const allUsernames = profiles?.every(p => p.username?.length > 0);
  log('2.2 Tous ont username', allUsernames, profiles?.map(p => p.username).join(', '));

  // ========== 3. SORTIES ==========
  const { data: sorties, error: e3 } = await anon.from('sorties')
    .select('*, trail:trails!trail_id(name, slug, region, difficulty), organisateur:user_profiles!organisateur_id(username)')
    .eq('statut', 'ouvert').eq('is_public', true);
  log('3.1 Sorties publiques', !e3, sorties?.length + ' sorties');
  log('3.2 Organisateur visible', sorties?.[0]?.organisateur?.username != null, sorties?.[0]?.organisateur?.username);
  log('3.3 Sentier visible', !!sorties?.[0]?.trail?.name, sorties?.[0]?.trail?.name);

  // Test slug->UUID resolution for sorties
  if (sorties?.[0]?.trail?.slug) {
    const slug = sorties[0].trail.slug;
    const { data: resolved } = await anon.from('trails').select('id').eq('slug', slug).single();
    const { data: sortiesByTrail } = await anon.from('sorties').select('*').eq('trail_id', resolved?.id).eq('statut', 'ouvert');
    log('3.4 Sorties par slug->UUID', sortiesByTrail?.length > 0, sortiesByTrail?.length + ' trouvees');
  }

  // ========== 4. SIGNALEMENTS ==========
  const { data: reports } = await anon.from('trail_reports').select('*, user:user_profiles!user_id(username)').eq('is_active', true);
  log('4.1 Signalements actifs', !!reports, reports?.length + ' signalements');
  if (reports?.[0]) {
    log('4.2 Username dans report', reports[0].user?.username != null, reports[0].user?.username);
    // Test slug->UUID for reports read
    const { data: trailInfo } = await anon.from('trails').select('slug').eq('id', reports[0].trail_id).single();
    const { data: resolvedTrail } = await anon.from('trails').select('id').eq('slug', trailInfo?.slug).single();
    const { data: reportsBySlug } = await anon.from('trail_reports').select('*').eq('trail_id', resolvedTrail?.id).eq('is_active', true);
    log('4.3 Reports par slug->UUID', reportsBySlug?.length > 0, reportsBySlug?.length + ' trouvees');
  }

  // ========== 5. CHAT ==========
  const { data: msgs } = await anon.from('sortie_messages').select('*, user:user_profiles!user_id(username)');
  log('5.1 Messages chat', !!msgs, msgs?.length + ' messages');
  if (msgs?.[0]) {
    log('5.2 Username dans message', msgs[0].user?.username != null, msgs[0].user?.username);
  }

  // ========== 6. METEO ==========
  const wRes = await fetch('https://api.open-meteo.com/v1/forecast?latitude=-21.1&longitude=55.47&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max,weather_code&timezone=Indian/Reunion&forecast_days=3');
  const w = await wRes.json();
  log('6.1 Meteo locale', !!w.daily?.time, w.daily?.temperature_2m_max?.[0] + 'C max');
  log('6.2 3 jours', w.daily?.time?.length === 3, w.daily?.time?.join(', '));

  // ========== 7. GAMIFICATION ==========
  const { data: trailRegions } = await anon.from('trails').select('slug, region');
  const REGION_TO_ZONE = {
    'Cirque de Mafate': 'mafate', 'Cirque de Cilaos': 'cilaos', 'Cirque de Salazie': 'salazie',
    'Massif du Volcan': 'volcan', 'Plaine des Cafres': 'plaine-des-cafres', 'Plaine des Palmistes': 'plaine-des-palmistes',
    'Foret de Bebour-Belouve': 'bebour-belouve', 'Cote Ouest': 'cote-ouest', 'Cote Est': 'cote-est',
    'Nord': 'nord', 'Grand Sud Sauvage': 'sud-sauvage', 'Hauts du Nord-Est': 'hauts-nord-est',
    'Grand Benare': 'grand-benare', 'Riviere des Remparts': 'riviere-remparts',
  };
  const unmapped = trailRegions?.filter(t => !REGION_TO_ZONE[t.region]);
  log('7.1 Regions mappees', unmapped?.length === 0, unmapped?.length + ' non mappees');

  // ========== 8. SOCIAL (AMIS + FEED) ==========
  const { count: friendCount, error: fErr } = await admin.from('friendships').select('*', { count: 'exact', head: true });
  log('8.1 Table friendships', !fErr, 'OK (count: ' + friendCount + ')');

  const { count: postCount, error: pErr } = await admin.from('posts').select('*', { count: 'exact', head: true });
  log('8.2 Table posts', !pErr, 'OK (count: ' + postCount + ')');

  const { count: likeCount, error: lErr } = await admin.from('post_likes').select('*', { count: 'exact', head: true });
  log('8.3 Table post_likes', !lErr, 'OK (count: ' + likeCount + ')');

  // Test creating a post (as admin, simulating app)
  const testUserId = profiles?.[0]?.id;
  if (testUserId) {
    const { error: postErr } = await admin.from('posts').insert({
      user_id: testUserId,
      content: 'TEST POST - a supprimer',
      post_type: 'text',
      visibility: 'public',
    });
    log('8.4 Creer un post', !postErr, postErr?.message ?? 'OK');

    // Read it back
    const { data: testPosts } = await anon.from('posts').select('*, user:user_profiles!user_id(username)').eq('visibility', 'public').limit(1);
    log('8.5 Lire post + username', testPosts?.[0]?.user?.username != null, testPosts?.[0]?.user?.username);

    // Cleanup
    await admin.from('posts').delete().eq('content', 'TEST POST - a supprimer');
  }

  // Test friend request
  if (profiles?.length >= 2) {
    const { error: frErr } = await admin.from('friendships').insert({
      requester_id: profiles[0].id,
      addressee_id: profiles[1].id,
      status: 'pending',
    });
    log('8.6 Demande ami', !frErr, frErr?.message ?? 'OK');

    // Accept
    if (!frErr) {
      const { data: friendship } = await admin.from('friendships').select('id').eq('requester_id', profiles[0].id).eq('addressee_id', profiles[1].id).single();
      const { error: accErr } = await admin.from('friendships').update({ status: 'accepted' }).eq('id', friendship?.id);
      log('8.7 Accepter ami', !accErr, accErr?.message ?? 'OK');

      // Read friends
      const { data: friends } = await admin.from('friendships')
        .select('*, addressee:user_profiles!addressee_id(username)')
        .eq('requester_id', profiles[0].id).eq('status', 'accepted');
      log('8.8 Lire amis', friends?.length > 0, friends?.[0]?.addressee?.username);

      // Cleanup
      await admin.from('friendships').delete().eq('requester_id', profiles[0].id).eq('addressee_id', profiles[1].id);
    }
  }

  // ========== 9. STORAGE (AVATARS) ==========
  const { data: buckets } = await admin.storage.listBuckets();
  const hasAvatars = buckets?.some(b => b.name === 'avatars');
  log('9.1 Bucket avatars', hasAvatars, hasAvatars ? 'public' : 'MANQUANT');

  // ========== 10. PARTICIPANTS ==========
  const { data: parts } = await admin.from('sortie_participants').select('statut, user:user_profiles!user_id(username)');
  log('10.1 Participants', !!parts, parts?.length + ' participants');

  // ========== 11. EAS ENV VARS ==========
  log('11.1 SUPABASE_URL', !!env.EXPO_PUBLIC_SUPABASE_URL, 'set');
  log('11.2 SUPABASE_ANON_KEY', !!env.EXPO_PUBLIC_SUPABASE_ANON_KEY, 'set');
  log('11.3 METEO_API_KEY', !!env.EXPO_PUBLIC_METEO_API_KEY, 'set (mais plus utilise)');

  // ========== RESULTATS ==========
  console.log('\n===================================');
  console.log('  AUDIT COMPLET — TESTS REELS V2');
  console.log('===================================\n');
  let ok = 0, fail = 0;
  for (const r of results) {
    const icon = r.ok ? '✓' : '✗';
    console.log(icon + ' ' + r.test + ' — ' + r.detail);
    if (r.ok) ok++; else fail++;
  }
  console.log('\n' + ok + '/' + (ok + fail) + ' PASSES | ' + fail + ' ECHECS');
}

testAll().catch(e => console.log('FATAL:', e.message));
