-- Migration 007: Commentaires sur les posts
-- Table post_comments avec RLS

CREATE TABLE IF NOT EXISTS post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) > 0 AND char_length(content) <= 1000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index pour charger les commentaires d'un post rapidement
CREATE INDEX idx_post_comments_post_id ON post_comments(post_id, created_at ASC);
CREATE INDEX idx_post_comments_user_id ON post_comments(user_id);

-- RLS
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;

-- Tout le monde peut lire les commentaires
CREATE POLICY "Comments are viewable by everyone"
  ON post_comments FOR SELECT
  USING (true);

-- Un utilisateur connecte peut commenter
CREATE POLICY "Authenticated users can insert comments"
  ON post_comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Un utilisateur peut supprimer ses propres commentaires
CREATE POLICY "Users can delete their own comments"
  ON post_comments FOR DELETE
  USING (auth.uid() = user_id);
