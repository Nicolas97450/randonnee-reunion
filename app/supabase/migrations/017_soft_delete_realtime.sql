-- ============================================================================
-- Migration 017: Soft Delete & Realtime Cleanup (Sprint I — Post-Audit V2)
-- Date: 20 mars 2026
-- Fixes: DB-04, DB-05
-- ============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- I6a. Soft delete on posts and direct_messages [DB-04]
-- ─────────────────────────────────────────────────────────────────────────────

-- Add deleted_at columns (nullable = not deleted)
ALTER TABLE posts ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE direct_messages ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Update RLS to exclude soft-deleted records from SELECT
-- Posts: modify existing SELECT policy to exclude deleted
DROP POLICY IF EXISTS "Posts visible with appropriate permissions" ON posts;
CREATE POLICY "Posts visible with appropriate permissions" ON posts
  FOR SELECT USING (
    deleted_at IS NULL
    AND (
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
    )
  );

-- Direct messages: update SELECT to exclude soft-deleted
DROP POLICY IF EXISTS "Users can view messages in own conversations" ON direct_messages;
CREATE POLICY "Users can view messages in own conversations" ON direct_messages
  FOR SELECT USING (
    deleted_at IS NULL
    AND EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = direct_messages.conversation_id
      AND (conversations.user1_id = auth.uid() OR conversations.user2_id = auth.uid())
    )
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- I6b. Remove post_likes from Realtime publication [DB-05]
-- Polling is sufficient for likes — reduces WAL bloat
-- ─────────────────────────────────────────────────────────────────────────────

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'post_likes'
  ) THEN
    ALTER PUBLICATION supabase_realtime DROP TABLE post_likes;
  END IF;
END $$;
