-- ============================================================
-- Migration 006 — Champs detailles pour user_activities
-- Ajoute : distance_km, elevation_gain_m, trace_geojson,
--          average_speed_kmh, plus lecture publique pour percentiles
-- ============================================================

-- Supprimer la contrainte UNIQUE(user_id, trail_id) pour permettre
-- plusieurs completions du meme sentier
ALTER TABLE user_activities DROP CONSTRAINT IF EXISTS user_activities_user_id_trail_id_key;

-- Nouveaux champs
ALTER TABLE user_activities ADD COLUMN IF NOT EXISTS distance_km DECIMAL(8,2);
ALTER TABLE user_activities ADD COLUMN IF NOT EXISTS elevation_gain_m INT;
ALTER TABLE user_activities ADD COLUMN IF NOT EXISTS trace_geojson JSONB;
ALTER TABLE user_activities ADD COLUMN IF NOT EXISTS average_speed_kmh DECIMAL(5,2);

-- RLS : permettre a tous de lire les activites (pour les percentiles)
DROP POLICY IF EXISTS "Users can view own activities" ON user_activities;
CREATE POLICY "Activities are viewable by everyone"
  ON user_activities FOR SELECT USING (true);
