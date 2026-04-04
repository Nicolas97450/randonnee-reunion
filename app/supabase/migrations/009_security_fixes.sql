-- ============================================================
-- Migration 009 — Corrections securite audit 20 mars 2026
-- ============================================================

-- 1. RLS user_activities : restreindre aux amis + soi-meme
--    (remplace la policy "viewable by everyone" de migration 006)
DROP POLICY IF EXISTS "Activities are viewable by everyone" ON user_activities;

CREATE POLICY "Users can view own or friend activities"
  ON user_activities FOR SELECT USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM friendships
      WHERE status = 'accepted'
      AND (
        (requester_id = auth.uid() AND addressee_id = user_activities.user_id)
        OR (addressee_id = auth.uid() AND requester_id = user_activities.user_id)
      )
    )
  );

-- 2. Index manquant sur post_likes(user_id)
CREATE INDEX IF NOT EXISTS idx_post_likes_user_id ON post_likes(user_id);

-- 3. Index manquant sur post_likes(post_id, user_id) pour lookups rapides
CREATE INDEX IF NOT EXISTS idx_post_likes_post_user ON post_likes(post_id, user_id);

-- 4. Index manquant sur live_tracking(user_id)
CREATE INDEX IF NOT EXISTS idx_live_tracking_user_id ON live_tracking(user_id);

-- 5. Policy UPDATE manquante sur post_comments
CREATE POLICY "Users can update own comments" ON post_comments
  FOR UPDATE USING (auth.uid() = user_id);

-- 6. Policy UPDATE manquante sur trail_reports
CREATE POLICY "Users can update own reports" ON trail_reports
  FOR UPDATE USING (auth.uid() = user_id);
