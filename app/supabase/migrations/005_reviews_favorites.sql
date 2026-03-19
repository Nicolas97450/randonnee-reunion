-- ============================================================
-- Migration 005 : Trail Reviews & User Favorites
-- Mars 2026
-- ============================================================

-- Trail reviews (avis et commentaires)
CREATE TABLE IF NOT EXISTS trail_reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  trail_id UUID NOT NULL REFERENCES trails(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(trail_id, user_id)
);

CREATE INDEX IF NOT EXISTS trail_reviews_trail_idx ON trail_reviews(trail_id, created_at DESC);
CREATE INDEX IF NOT EXISTS trail_reviews_user_idx ON trail_reviews(user_id);

ALTER TABLE trail_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read reviews" ON trail_reviews FOR SELECT USING (true);
CREATE POLICY "Users can create own reviews" ON trail_reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own reviews" ON trail_reviews FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own reviews" ON trail_reviews FOR DELETE USING (auth.uid() = user_id);

-- User favorites (sentiers favoris)
CREATE TABLE IF NOT EXISTS user_favorites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trail_slug TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, trail_slug)
);

CREATE INDEX IF NOT EXISTS user_favorites_user_idx ON user_favorites(user_id);

ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own favorites" ON user_favorites FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own favorites" ON user_favorites FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own favorites" ON user_favorites FOR DELETE USING (auth.uid() = user_id);
