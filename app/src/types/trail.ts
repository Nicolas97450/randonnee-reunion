export type Difficulty = 'facile' | 'moyen' | 'difficile' | 'expert';
export type TrailType = 'boucle' | 'aller-retour' | 'point-a-point';
export type TrailStatus = 'ouvert' | 'ferme' | 'degrade' | 'inconnu';
export type ValidationMethod = 'gps' | 'manual';

export interface Trail {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  difficulty: Difficulty;
  distance_km: number;
  elevation_gain_m: number;
  duration_min: number;
  trail_type: TrailType;
  region: string;
  start_point: { latitude: number; longitude: number };
  end_point: { latitude: number; longitude: number } | null;
  gpx_url: string | null;
  tiles_url: string | null;
  tiles_size_mb: number | null;
  omf_trail_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface TrailCondition {
  id: string;
  trail_id: string;
  status: TrailStatus;
  message: string | null;
  source: string;
  fetched_at: string;
  valid_until: string | null;
}
