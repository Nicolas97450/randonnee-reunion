-- ============================================================================
-- Migration 016: Server-side Gamification Validation (Sprint E — Post-Audit V2)
-- Date: 20 mars 2026
-- Fixes: SEC-01, GAM-01, GAM-02, GAM-03
-- ============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- E1. RPC validate_and_complete_trail
-- Server-side validation: checks trail exists, no duplicate, min duration.
-- Returns the inserted activity row with XP awarded.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION validate_and_complete_trail(
  p_user_id UUID,
  p_trail_id UUID,
  p_validation_type TEXT DEFAULT 'gps',
  p_distance_km NUMERIC DEFAULT 0,
  p_duration_min INT DEFAULT 0,
  p_elevation_gain_m INT DEFAULT 0,
  p_average_speed_kmh NUMERIC DEFAULT 0,
  p_trace_geojson JSONB DEFAULT NULL
)
RETURNS TABLE(
  activity_id UUID,
  xp_awarded INT,
  already_completed BOOLEAN
) AS $$
DECLARE
  v_trail_exists BOOLEAN;
  v_already_done BOOLEAN;
  v_activity_id UUID;
  v_xp INT;
  v_trail_distance NUMERIC;
  v_trail_elevation INT;
BEGIN
  -- 1. Check trail exists
  SELECT EXISTS(SELECT 1 FROM trails WHERE id = p_trail_id) INTO v_trail_exists;
  IF NOT v_trail_exists THEN
    RAISE EXCEPTION 'Trail not found: %', p_trail_id;
  END IF;

  -- 2. Check if already completed (allow multiple but flag it)
  SELECT EXISTS(
    SELECT 1 FROM user_activities
    WHERE user_id = p_user_id AND trail_id = p_trail_id
  ) INTO v_already_done;

  -- 3. Basic anti-cheat: duration must be >= 5 minutes for GPS validation
  IF p_validation_type = 'gps' AND p_duration_min < 5 THEN
    RAISE EXCEPTION 'Duration too short for GPS validation: % min', p_duration_min;
  END IF;

  -- 4. Get trail data for XP calculation
  SELECT distance_km, elevation_gain INTO v_trail_distance, v_trail_elevation
  FROM trails WHERE id = p_trail_id;

  -- 5. Insert the activity
  INSERT INTO user_activities (
    user_id, trail_id, validation_type, completed_at,
    distance_km, duration_min, elevation_gain_m,
    average_speed_kmh, trace_geojson
  ) VALUES (
    p_user_id, p_trail_id, p_validation_type, now(),
    p_distance_km, p_duration_min, p_elevation_gain_m,
    p_average_speed_kmh, p_trace_geojson
  )
  RETURNING id INTO v_activity_id;

  -- 6. Calculate XP awarded
  -- Base: 100 XP per completion
  -- Distance: 10 XP per km (use actual GPS distance if available, else trail distance)
  -- Elevation: 0.5 XP per meter gained
  v_xp := 100;
  v_xp := v_xp + ROUND(COALESCE(NULLIF(p_distance_km, 0), v_trail_distance, 0) * 10);
  v_xp := v_xp + ROUND(COALESCE(NULLIF(p_elevation_gain_m, 0), v_trail_elevation, 0) * 0.5);

  RETURN QUERY SELECT v_activity_id, v_xp::INT, v_already_done;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─────────────────────────────────────────────────────────────────────────────
-- E2. RPC compute_user_xp
-- Recalculates total XP from all activities server-side.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION compute_user_xp(p_user_id UUID)
RETURNS INT AS $$
DECLARE
  v_xp INT;
BEGIN
  SELECT COALESCE(
    SUM(
      100
      + ROUND(COALESCE(ua.distance_km, t.distance_km, 0) * 10)
      + ROUND(COALESCE(ua.elevation_gain_m, t.elevation_gain, 0) * 0.5)
    ),
    0
  )::INT INTO v_xp
  FROM user_activities ua
  LEFT JOIN trails t ON t.id = ua.trail_id
  WHERE ua.user_id = p_user_id;

  RETURN v_xp;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─────────────────────────────────────────────────────────────────────────────
-- E3. RPC get_user_zone_progress
-- Returns zone progress computed server-side (anti-cheat).
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION get_user_zone_progress(p_user_id UUID)
RETURNS TABLE(
  zone_slug TEXT,
  zone_name TEXT,
  completed_count BIGINT,
  total_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    mz.slug::TEXT AS zone_slug,
    mz.name::TEXT AS zone_name,
    COUNT(DISTINCT ua.trail_id)::BIGINT AS completed_count,
    COUNT(DISTINCT tz.trail_id)::BIGINT AS total_count
  FROM map_zones mz
  LEFT JOIN trail_zones tz ON tz.zone_id = mz.id
  LEFT JOIN user_activities ua
    ON ua.trail_id = tz.trail_id
    AND ua.user_id = p_user_id
  GROUP BY mz.slug, mz.name
  ORDER BY mz.slug;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─────────────────────────────────────────────────────────────────────────────
-- E4. Table user_streaks — server-side streak backup
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS user_streaks (
  user_id UUID PRIMARY KEY REFERENCES user_profiles(id) ON DELETE CASCADE,
  current_streak INT NOT NULL DEFAULT 0,
  best_streak INT NOT NULL DEFAULT 0,
  last_activity_week TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE user_streaks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own streaks" ON user_streaks
  FOR ALL USING (auth.uid() = user_id);
