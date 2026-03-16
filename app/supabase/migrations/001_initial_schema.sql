-- ============================================================
-- Randonnée Réunion — Schéma initial
-- Migration 001 — Mars 2026
-- ============================================================

-- Activer PostGIS
CREATE EXTENSION IF NOT EXISTS postgis;

-- ============================================================
-- SENTIERS
-- ============================================================
CREATE TABLE trails (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  slug          TEXT UNIQUE NOT NULL,
  description   TEXT,
  difficulty    TEXT NOT NULL CHECK (difficulty IN ('facile', 'moyen', 'difficile', 'expert')),
  distance_km   DECIMAL(6,2) NOT NULL,
  elevation_gain_m INT NOT NULL,
  duration_min  INT NOT NULL,
  trail_type    TEXT NOT NULL CHECK (trail_type IN ('boucle', 'aller-retour', 'point-a-point')),
  region        TEXT NOT NULL,
  start_point   GEOGRAPHY(POINT, 4326) NOT NULL,
  end_point     GEOGRAPHY(POINT, 4326),
  bbox          GEOGRAPHY(POLYGON, 4326),
  gpx_url       TEXT,
  tiles_url     TEXT,
  tiles_size_mb DECIMAL(6,2),
  omf_trail_id  TEXT,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX trails_start_point_idx ON trails USING GIST (start_point);
CREATE INDEX trails_bbox_idx ON trails USING GIST (bbox);
CREATE INDEX trails_difficulty_idx ON trails (difficulty);
CREATE INDEX trails_region_idx ON trails (region);
CREATE INDEX trails_slug_idx ON trails (slug);

-- ============================================================
-- ÉTAT DES SENTIERS (cache OMF)
-- ============================================================
CREATE TABLE trail_conditions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trail_id    UUID NOT NULL REFERENCES trails(id) ON DELETE CASCADE,
  status      TEXT NOT NULL CHECK (status IN ('ouvert', 'ferme', 'degrade', 'inconnu')),
  message     TEXT,
  source      TEXT DEFAULT 'omf',
  fetched_at  TIMESTAMPTZ DEFAULT now(),
  valid_until TIMESTAMPTZ
);

CREATE INDEX trail_conditions_trail_id_idx ON trail_conditions (trail_id);

-- ============================================================
-- PROFILS UTILISATEURS
-- ============================================================
CREATE TABLE user_profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username      TEXT UNIQUE,
  avatar_url    TEXT,
  is_premium    BOOLEAN DEFAULT FALSE,
  premium_until TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- ACTIVITÉS (sentiers réalisés)
-- ============================================================
CREATE TABLE user_activities (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  trail_id        UUID NOT NULL REFERENCES trails(id) ON DELETE CASCADE,
  completed_at    TIMESTAMPTZ DEFAULT now(),
  validation_type TEXT NOT NULL CHECK (validation_type IN ('gps', 'manual')),
  gpx_track       JSONB,
  duration_min    INT,
  notes           TEXT,
  UNIQUE(user_id, trail_id)
);

CREATE INDEX user_activities_user_id_idx ON user_activities (user_id);

-- ============================================================
-- ZONES GÉOGRAPHIQUES (gamification)
-- ============================================================
CREATE TABLE map_zones (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  slug        TEXT UNIQUE NOT NULL,
  color_hex   TEXT DEFAULT '#2ECC71',
  geojson     JSONB NOT NULL,
  order_idx   INT
);

-- ============================================================
-- LIAISON SENTIERS ↔ ZONES
-- ============================================================
CREATE TABLE trail_zones (
  trail_id UUID NOT NULL REFERENCES trails(id) ON DELETE CASCADE,
  zone_id  UUID NOT NULL REFERENCES map_zones(id) ON DELETE CASCADE,
  PRIMARY KEY (trail_id, zone_id)
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- Trails: lecture publique, écriture admin uniquement
ALTER TABLE trails ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Trails are viewable by everyone"
  ON trails FOR SELECT USING (true);

-- Trail conditions: lecture publique
ALTER TABLE trail_conditions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Trail conditions are viewable by everyone"
  ON trail_conditions FOR SELECT USING (true);

-- User profiles: lecture publique, update sur son propre profil
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles are viewable by everyone"
  ON user_profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- User activities: CRUD sur ses propres données
ALTER TABLE user_activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own activities"
  ON user_activities FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own activities"
  ON user_activities FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own activities"
  ON user_activities FOR DELETE USING (auth.uid() = user_id);

-- Map zones: lecture publique
ALTER TABLE map_zones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Map zones are viewable by everyone"
  ON map_zones FOR SELECT USING (true);

-- Trail zones: lecture publique
ALTER TABLE trail_zones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Trail zones are viewable by everyone"
  ON trail_zones FOR SELECT USING (true);

-- ============================================================
-- TRIGGER updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trails_updated_at
  BEFORE UPDATE ON trails
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (id, username)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'username');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
