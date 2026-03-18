-- ============================================================
-- Migration 004 : Social Features (Amis, Feed, Posts)
-- Mars 2026
-- ============================================================

-- Systeme d'amis
CREATE TABLE IF NOT EXISTS friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  addressee_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(requester_id, addressee_id)
);

CREATE INDEX IF NOT EXISTS friendships_requester_idx ON friendships(requester_id);
CREATE INDEX IF NOT EXISTS friendships_addressee_idx ON friendships(addressee_id);

-- Posts (feed social)
CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  content TEXT,
  image_url TEXT,
  post_type TEXT NOT NULL DEFAULT 'text' CHECK (post_type IN ('text', 'achievement', 'sortie_recap', 'photo')),
  trail_id UUID REFERENCES trails(id) ON DELETE SET NULL,
  stats JSONB,
  visibility TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'friends', 'private')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS posts_user_idx ON posts(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS posts_visibility_idx ON posts(visibility, created_at DESC);

-- Likes sur les posts
CREATE TABLE IF NOT EXISTS post_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(post_id, user_id)
);

-- RLS Friendships
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own friendships" ON friendships FOR SELECT USING (requester_id = auth.uid() OR addressee_id = auth.uid());
CREATE POLICY "Users can send friend requests" ON friendships FOR INSERT WITH CHECK (requester_id = auth.uid());
CREATE POLICY "Users can update own friendships" ON friendships FOR UPDATE USING (addressee_id = auth.uid() OR requester_id = auth.uid());
CREATE POLICY "Users can delete own friendships" ON friendships FOR DELETE USING (requester_id = auth.uid() OR addressee_id = auth.uid());

-- RLS Posts
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public posts visible by all" ON posts FOR SELECT USING (visibility = 'public' OR user_id = auth.uid());
CREATE POLICY "Users can create posts" ON posts FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own posts" ON posts FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own posts" ON posts FOR DELETE USING (user_id = auth.uid());

-- RLS Likes
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Likes visible by all" ON post_likes FOR SELECT USING (true);
CREATE POLICY "Users can like" ON post_likes FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can unlike" ON post_likes FOR DELETE USING (user_id = auth.uid());
