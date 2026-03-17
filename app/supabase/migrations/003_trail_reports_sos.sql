-- ============================================================
-- Migration 003 : Trail Reports (Waze de la rando) + SOS
-- V2 — Mars 2026
-- ============================================================

-- Signalements terrain par les randonneurs
CREATE TABLE trail_reports (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trail_id      UUID NOT NULL REFERENCES trails(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  report_type   TEXT NOT NULL CHECK (report_type IN (
    'boue', 'arbre_tombe', 'eau_haute', 'brouillard',
    'glissant', 'eboulement', 'neige', 'danger',
    'sentier_degrade', 'balisage_manquant', 'autre'
  )),
  message       TEXT,
  latitude      DECIMAL(9,6) NOT NULL,
  longitude     DECIMAL(9,6) NOT NULL,
  photo_url     TEXT,
  is_active     BOOLEAN DEFAULT TRUE,
  expires_at    TIMESTAMPTZ DEFAULT (now() + interval '48 hours'),
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX trail_reports_trail_id_idx ON trail_reports (trail_id);
CREATE INDEX trail_reports_active_idx ON trail_reports (is_active, expires_at);

-- Contacts d'urgence de l'utilisateur
CREATE TABLE user_emergency_contacts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  phone       TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX emergency_contacts_user_idx ON user_emergency_contacts (user_id);

-- RLS
ALTER TABLE trail_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Reports visibles par tous" ON trail_reports FOR SELECT USING (true);
CREATE POLICY "Utilisateur peut signaler" ON trail_reports FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Utilisateur peut supprimer son signalement" ON trail_reports FOR DELETE USING (auth.uid() = user_id);

ALTER TABLE user_emergency_contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Voir ses contacts" ON user_emergency_contacts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Ajouter ses contacts" ON user_emergency_contacts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Supprimer ses contacts" ON user_emergency_contacts FOR DELETE USING (auth.uid() = user_id);

-- Auto-desactiver les signalements expires (via pg_cron si disponible)
-- CREATE EXTENSION IF NOT EXISTS pg_cron;
-- SELECT cron.schedule('expire-reports', '0 * * * *', $$
--   UPDATE trail_reports SET is_active = false WHERE expires_at < now() AND is_active = true;
-- $$);
