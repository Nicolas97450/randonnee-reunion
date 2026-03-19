-- 008_live_community.sql
-- Partage de position en direct + Defis communautaires

-- ======================
-- LIVE TRACKING
-- ======================
CREATE TABLE IF NOT EXISTS live_tracking (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  trail_slug TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  altitude DOUBLE PRECISION,
  speed_kmh DOUBLE PRECISION,
  is_active BOOLEAN DEFAULT true,
  started_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE live_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active tracking"
  ON live_tracking FOR SELECT
  USING (is_active = true);

CREATE POLICY "Users manage own tracking"
  ON live_tracking FOR ALL
  USING (auth.uid() = user_id);

-- Enable Realtime on live_tracking
ALTER PUBLICATION supabase_realtime ADD TABLE live_tracking;

-- ======================
-- COMMUNITY CHALLENGES
-- ======================
CREATE TABLE IF NOT EXISTS community_challenges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  target_km DOUBLE PRECISION,
  current_km DOUBLE PRECISION DEFAULT 0,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT true
);

ALTER TABLE community_challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read challenges"
  ON community_challenges FOR SELECT
  USING (true);

-- Seed : premier defi communautaire Mars 2026
INSERT INTO community_challenges (title, description, target_km, current_km, start_date, end_date, is_active)
VALUES (
  'Mars : 1000 km collectifs',
  'Ensemble, parcourons 1000 km sur les sentiers de La Reunion ce mois-ci.',
  1000,
  0,
  '2026-03-01',
  '2026-03-31',
  true
);
