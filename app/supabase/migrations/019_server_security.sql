-- 019_server_security.sql
-- Date: 2026-03-22
-- Description: Server-side security hardening
--   1. Content moderation trigger on sortie_messages and direct_messages
--   2. Rate limiting on direct_messages (max 30/min per user)
--   3. RGPD auto-expiration on live_tracking (90 days)

-- ============================================================
-- 1. Trigger modération serveur sur messages
-- ============================================================

CREATE OR REPLACE FUNCTION check_message_content()
RETURNS TRIGGER AS $$
DECLARE
  blocked_words TEXT[] := ARRAY[
    'putain', 'merde', 'connard', 'connasse', 'enculé', 'enculer',
    'nique', 'niquer', 'ntm', 'fdp', 'pd', 'salope', 'pute',
    'batard', 'bâtard', 'négro', 'nègre', 'bougnoule', 'youpin',
    'sale arabe', 'sale noir', 'sale blanc', 'crève', 'suicide',
    'nazi', 'hitler', 'viol', 'violer', 'pédophile', 'terroriste'
  ];
  word TEXT;
  content_lower TEXT;
BEGIN
  content_lower := lower(COALESCE(NEW.content, ''));
  FOREACH word IN ARRAY blocked_words LOOP
    IF content_lower LIKE '%' || word || '%' THEN
      RAISE EXCEPTION 'Message contains inappropriate content';
    END IF;
  END LOOP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_sortie_message_content
  BEFORE INSERT OR UPDATE ON sortie_messages
  FOR EACH ROW EXECUTE FUNCTION check_message_content();

CREATE TRIGGER check_dm_content
  BEFORE INSERT OR UPDATE ON direct_messages
  FOR EACH ROW EXECUTE FUNCTION check_message_content();

-- ============================================================
-- 2. Rate limiting DMs côté serveur (max 30 messages/minute)
-- ============================================================

CREATE OR REPLACE FUNCTION check_dm_rate_limit()
RETURNS TRIGGER AS $$
DECLARE
  msg_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO msg_count
  FROM direct_messages
  WHERE sender_id = NEW.sender_id
    AND created_at > NOW() - INTERVAL '1 minute';

  IF msg_count >= 30 THEN
    RAISE EXCEPTION 'Rate limit exceeded: max 30 messages per minute';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER dm_rate_limit
  BEFORE INSERT ON direct_messages
  FOR EACH ROW EXECUTE FUNCTION check_dm_rate_limit();

-- ============================================================
-- 3. Expiration live_tracking RGPD (90 jours)
-- ============================================================

ALTER TABLE live_tracking
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '90 days';

COMMENT ON COLUMN live_tracking.expires_at IS 'RGPD: auto-expiration after 90 days';
