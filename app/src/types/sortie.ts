export type SortieStatut = 'ouvert' | 'complet' | 'annule' | 'termine';
export type ParticipantStatut = 'en_attente' | 'accepte' | 'refuse';

export interface Sortie {
  id: string;
  trail_id: string;
  organisateur_id: string;
  titre: string;
  description: string | null;
  date_sortie: string;
  heure_depart: string;
  places_max: number;
  is_public: boolean;
  statut: SortieStatut;
  created_at: string;
  updated_at: string;
  // Joined fields
  trail?: { name: string; slug: string; region: string; difficulty: string };
  organisateur?: { username: string | null; avatar_url: string | null };
  participants_count?: number;
}

export interface SortieParticipant {
  id: string;
  sortie_id: string;
  user_id: string;
  statut: ParticipantStatut;
  joined_at: string;
  user?: { username: string | null; avatar_url: string | null };
}

export interface SortieMessage {
  id: string;
  sortie_id: string;
  user_id: string;
  contenu: string;
  created_at: string;
  user?: { username: string | null; avatar_url: string | null };
}
