-- ============================================================
-- Migration 012 — Fix foreign keys for PostgREST joins
-- Les hooks Supabase utilisent !user_id pour joindre user_profiles
-- mais les FK pointaient vers auth.users, pas user_profiles.
-- On ajoute un second FK vers user_profiles pour que PostgREST resolve la jointure.
-- ============================================================

ALTER TABLE post_comments ADD CONSTRAINT IF NOT EXISTS post_comments_user_profiles_fk
  FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE;

ALTER TABLE posts ADD CONSTRAINT IF NOT EXISTS posts_user_profiles_fk
  FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE;

ALTER TABLE post_likes ADD CONSTRAINT IF NOT EXISTS post_likes_user_profiles_fk
  FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE;

ALTER TABLE trail_reviews ADD CONSTRAINT IF NOT EXISTS trail_reviews_user_profiles_fk
  FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE;

ALTER TABLE sortie_participants ADD CONSTRAINT IF NOT EXISTS sortie_participants_user_profiles_fk
  FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE;

ALTER TABLE direct_messages ADD CONSTRAINT IF NOT EXISTS direct_messages_user_profiles_fk
  FOREIGN KEY (sender_id) REFERENCES user_profiles(id) ON DELETE CASCADE;
