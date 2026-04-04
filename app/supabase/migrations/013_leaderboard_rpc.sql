-- ============================================================
-- Randonnee Reunion -- Deploy Leaderboard RPC functions
-- Migration 013 -- Mars 2026
-- Re-create the two RPC functions needed by useLeaderboard.ts
-- (005a may not have been applied to production)
-- ============================================================

-- Top N randonneurs par nombre de sentiers completes
CREATE OR REPLACE FUNCTION get_leaderboard(lim INT DEFAULT 10)
RETURNS TABLE(
  user_id UUID,
  username TEXT,
  avatar_url TEXT,
  trails_completed BIGINT,
  total_distance_km NUMERIC
) AS $$
  SELECT
    ua.user_id,
    up.username,
    up.avatar_url,
    COUNT(DISTINCT ua.trail_id) AS trails_completed,
    COALESCE(SUM(t.distance_km), 0) AS total_distance_km
  FROM user_activities ua
  JOIN user_profiles up ON up.id = ua.user_id
  JOIN trails t ON t.id = ua.trail_id
  GROUP BY ua.user_id, up.username, up.avatar_url
  ORDER BY trails_completed DESC
  LIMIT lim;
$$ LANGUAGE sql SECURITY DEFINER;

-- Rang d'un utilisateur specifique
CREATE OR REPLACE FUNCTION get_user_rank(uid UUID)
RETURNS TABLE(
  user_id UUID,
  username TEXT,
  avatar_url TEXT,
  trails_completed BIGINT,
  total_distance_km NUMERIC,
  rank BIGINT
) AS $$
  WITH ranked AS (
    SELECT
      ua.user_id,
      up.username,
      up.avatar_url,
      COUNT(DISTINCT ua.trail_id) AS trails_completed,
      COALESCE(SUM(t.distance_km), 0) AS total_distance_km,
      ROW_NUMBER() OVER (ORDER BY COUNT(DISTINCT ua.trail_id) DESC) AS rank
    FROM user_activities ua
    JOIN user_profiles up ON up.id = ua.user_id
    JOIN trails t ON t.id = ua.trail_id
    GROUP BY ua.user_id, up.username, up.avatar_url
  )
  SELECT * FROM ranked WHERE ranked.user_id = uid;
$$ LANGUAGE sql SECURITY DEFINER;
