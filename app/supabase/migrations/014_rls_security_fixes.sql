-- ============================================================================
-- Migration 014: RLS Security Fixes (Sprint B — Post-Audit V2)
-- Date: 20 mars 2026
-- Fixes: SEC-02, SEC-03, SEC-04, SEC-07, SEC-09, SEC-11, DB-01, DB-02, DB-06
-- ============================================================================

-- B1. Fix posts visibility: support 'friends' visibility [SEC-02]
DROP POLICY IF EXISTS "Public posts visible by all" ON posts;
DROP POLICY IF EXISTS "Posts visible with appropriate permissions" ON posts;
CREATE POLICY "Posts visible with appropriate permissions" ON posts
  FOR SELECT USING (
    user_id = auth.uid()
    OR visibility = 'public'
    OR (
      visibility = 'friends'
      AND EXISTS (
        SELECT 1 FROM friendships
        WHERE status = 'accepted'
        AND (
          (requester_id = auth.uid() AND addressee_id = posts.user_id)
          OR (addressee_id = auth.uid() AND requester_id = posts.user_id)
        )
      )
    )
  );

-- B2. Fix live_tracking: restrict to friends only [SEC-03]
DROP POLICY IF EXISTS "Anyone can read active tracking" ON live_tracking;
DROP POLICY IF EXISTS "Users can read own or friends active tracking" ON live_tracking;
CREATE POLICY "Users can read own or friends active tracking" ON live_tracking
  FOR SELECT USING (
    auth.uid() = user_id
    OR (
      is_active = true
      AND EXISTS (
        SELECT 1 FROM friendships
        WHERE status = 'accepted'
        AND (
          (requester_id = auth.uid() AND addressee_id = live_tracking.user_id)
          OR (addressee_id = auth.uid() AND requester_id = live_tracking.user_id)
        )
      )
    )
  );

-- Add missing INSERT policy for live_tracking
DROP POLICY IF EXISTS "Users can insert own tracking" ON live_tracking;
CREATE POLICY "Users can insert own tracking" ON live_tracking
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- B3. Add DELETE/UPDATE policies on user_profiles and sortie_messages [SEC-04]
DROP POLICY IF EXISTS "Users can delete own profile" ON user_profiles;
CREATE POLICY "Users can delete own profile" ON user_profiles
  FOR DELETE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can delete own sortie messages" ON sortie_messages;
CREATE POLICY "Users can delete own sortie messages" ON sortie_messages
  FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own sortie messages" ON sortie_messages;
CREATE POLICY "Users can update own sortie messages" ON sortie_messages
  FOR UPDATE USING (auth.uid() = user_id);

-- B4. Fix post_comments visibility: inherit from post [SEC-07]
DROP POLICY IF EXISTS "Comments are viewable by everyone" ON post_comments;
DROP POLICY IF EXISTS "Comments visible with post visibility" ON post_comments;
CREATE POLICY "Comments visible with post visibility" ON post_comments
  FOR SELECT USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM posts
      WHERE posts.id = post_comments.post_id
      AND (
        posts.visibility = 'public'
        OR posts.user_id = auth.uid()
        OR (
          posts.visibility = 'friends'
          AND EXISTS (
            SELECT 1 FROM friendships
            WHERE status = 'accepted'
            AND (
              (requester_id = auth.uid() AND addressee_id = posts.user_id)
              OR (addressee_id = auth.uid() AND requester_id = posts.user_id)
            )
          )
        )
      )
    )
  );

-- B5. Fix sortie_participants: allow users to update own status [SEC-09]
DROP POLICY IF EXISTS "Participants can update own status" ON sortie_participants;
CREATE POLICY "Participants can update own status" ON sortie_participants
  FOR UPDATE USING (auth.uid() = user_id);

-- B6. Allow users to update their own direct messages (edit) [SEC-11]
DROP POLICY IF EXISTS "Users can update own direct messages" ON direct_messages;
CREATE POLICY "Users can update own direct messages" ON direct_messages
  FOR UPDATE USING (auth.uid() = sender_id);

-- B7. Fix FK inconsistencies [DB-01]
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'live_tracking_user_profiles_fk'
    AND table_name = 'live_tracking'
  ) THEN
    ALTER TABLE live_tracking
      ADD CONSTRAINT live_tracking_user_profiles_fk
      FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'conversations_user1_profiles_fk'
    AND table_name = 'conversations'
  ) THEN
    ALTER TABLE conversations
      ADD CONSTRAINT conversations_user1_profiles_fk
      FOREIGN KEY (user1_id) REFERENCES user_profiles(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'conversations_user2_profiles_fk'
    AND table_name = 'conversations'
  ) THEN
    ALTER TABLE conversations
      ADD CONSTRAINT conversations_user2_profiles_fk
      FOREIGN KEY (user2_id) REFERENCES user_profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- B8. Add missing indexes [DB-02]
CREATE INDEX IF NOT EXISTS idx_user_activities_trail_id ON user_activities(trail_id);
CREATE INDEX IF NOT EXISTS idx_friendships_status_composite ON friendships(status, requester_id, addressee_id);
CREATE INDEX IF NOT EXISTS idx_posts_user_visibility ON posts(user_id, visibility, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_direct_messages_conversation ON direct_messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_direct_messages_sender ON direct_messages(sender_id);

-- B11. Trigger: validate sortie message author is participant [DB-06]
CREATE OR REPLACE FUNCTION validate_sortie_message_author()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM sortie_participants
    WHERE sortie_id = NEW.sortie_id AND user_id = NEW.user_id AND statut = 'accepte'
  ) AND NOT EXISTS (
    SELECT 1 FROM sorties
    WHERE id = NEW.sortie_id AND organisateur_id = NEW.user_id
  ) THEN
    RAISE EXCEPTION 'User is not an accepted participant or organizer of this sortie';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_validate_sortie_message_author ON sortie_messages;
CREATE TRIGGER trg_validate_sortie_message_author
  BEFORE INSERT ON sortie_messages
  FOR EACH ROW EXECUTE FUNCTION validate_sortie_message_author();

-- B10. Add missing UPDATE policy for user_emergency_contacts
DROP POLICY IF EXISTS "Users can update own emergency contacts" ON user_emergency_contacts;
CREATE POLICY "Users can update own emergency contacts" ON user_emergency_contacts
  FOR UPDATE USING (auth.uid() = user_id);
