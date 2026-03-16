-- ============================================================
-- Randonnée Réunion — Migration 002 : Feature Sorties
-- Sprint 6 — Mars 2026
-- ============================================================

-- Sorties (événements rando planifiés)
CREATE TABLE sorties (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trail_id        UUID NOT NULL REFERENCES trails(id) ON DELETE CASCADE,
  organisateur_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  titre           TEXT NOT NULL,
  description     TEXT,
  date_sortie     DATE NOT NULL,
  heure_depart    TIME NOT NULL,
  places_max      INT NOT NULL CHECK (places_max BETWEEN 2 AND 20),
  is_public       BOOLEAN DEFAULT TRUE,
  statut          TEXT NOT NULL DEFAULT 'ouvert' CHECK (statut IN ('ouvert', 'complet', 'annule', 'termine')),
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX sorties_trail_id_idx ON sorties (trail_id);
CREATE INDEX sorties_organisateur_id_idx ON sorties (organisateur_id);
CREATE INDEX sorties_date_idx ON sorties (date_sortie);

-- Participants d'une sortie
CREATE TABLE sortie_participants (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sortie_id   UUID NOT NULL REFERENCES sorties(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  statut      TEXT NOT NULL DEFAULT 'en_attente' CHECK (statut IN ('en_attente', 'accepte', 'refuse')),
  joined_at   TIMESTAMPTZ DEFAULT now(),
  UNIQUE(sortie_id, user_id)
);

CREATE INDEX sortie_participants_sortie_id_idx ON sortie_participants (sortie_id);
CREATE INDEX sortie_participants_user_id_idx ON sortie_participants (user_id);

-- Messages du chat de groupe
CREATE TABLE sortie_messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sortie_id   UUID NOT NULL REFERENCES sorties(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  contenu     TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX sortie_messages_sortie_id_idx ON sortie_messages (sortie_id, created_at);

-- Trigger updated_at pour sorties
CREATE TRIGGER sorties_updated_at
  BEFORE UPDATE ON sorties
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- Sorties: lecture publique, creation par utilisateur connecte
ALTER TABLE sorties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sorties publiques visibles par tous"
  ON sorties FOR SELECT USING (is_public = true);

CREATE POLICY "Organisateur peut voir ses sorties privees"
  ON sorties FOR SELECT USING (organisateur_id = auth.uid());

CREATE POLICY "Utilisateur connecte peut creer une sortie"
  ON sorties FOR INSERT WITH CHECK (auth.uid() = organisateur_id);

CREATE POLICY "Organisateur peut modifier sa sortie"
  ON sorties FOR UPDATE USING (auth.uid() = organisateur_id);

CREATE POLICY "Organisateur peut supprimer sa sortie"
  ON sorties FOR DELETE USING (auth.uid() = organisateur_id);

-- Participants: visible par les participants et l'organisateur
ALTER TABLE sortie_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants visibles par les membres de la sortie"
  ON sortie_participants FOR SELECT
  USING (
    user_id = auth.uid()
    OR sortie_id IN (SELECT id FROM sorties WHERE organisateur_id = auth.uid())
    OR sortie_id IN (SELECT sortie_id FROM sortie_participants WHERE user_id = auth.uid())
  );

CREATE POLICY "Utilisateur peut rejoindre une sortie"
  ON sortie_participants FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Organisateur peut modifier les participants"
  ON sortie_participants FOR UPDATE
  USING (sortie_id IN (SELECT id FROM sorties WHERE organisateur_id = auth.uid()));

-- Messages: visibles par les participants acceptes
ALTER TABLE sortie_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Messages visibles par les participants acceptes"
  ON sortie_messages FOR SELECT
  USING (
    sortie_id IN (
      SELECT sortie_id FROM sortie_participants
      WHERE user_id = auth.uid() AND statut = 'accepte'
    )
    OR sortie_id IN (SELECT id FROM sorties WHERE organisateur_id = auth.uid())
  );

CREATE POLICY "Participants acceptes peuvent envoyer des messages"
  ON sortie_messages FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND (
      sortie_id IN (
        SELECT sortie_id FROM sortie_participants
        WHERE user_id = auth.uid() AND statut = 'accepte'
      )
      OR sortie_id IN (SELECT id FROM sorties WHERE organisateur_id = auth.uid())
    )
  );

-- ============================================================
-- REALTIME : activer pour les messages (chat live)
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE sortie_messages;
