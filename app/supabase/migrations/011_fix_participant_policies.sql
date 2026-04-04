-- ============================================================
-- Migration 011 — Fix sortie_participants policies
-- L'organisateur doit pouvoir accepter/refuser les participants
-- ============================================================

-- UPDATE: l'organisateur de la sortie peut modifier le statut des participants
CREATE POLICY IF NOT EXISTS organizer_update_participants ON sortie_participants
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM sorties
      WHERE sorties.id = sortie_participants.sortie_id
      AND sorties.organisateur_id = auth.uid()
    )
  );

-- DELETE: le participant peut se retirer OU l'organisateur peut l'exclure
CREATE POLICY IF NOT EXISTS participant_or_organizer_delete ON sortie_participants
  FOR DELETE USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM sorties
      WHERE sorties.id = sortie_participants.sortie_id
      AND sorties.organisateur_id = auth.uid()
    )
  );
