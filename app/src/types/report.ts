export type ReportType =
  | 'boue'
  | 'arbre_tombe'
  | 'eau_haute'
  | 'brouillard'
  | 'glissant'
  | 'eboulement'
  | 'neige'
  | 'danger'
  | 'sentier_degrade'
  | 'balisage_manquant'
  | 'autre';

export interface TrailReport {
  id: string;
  trail_id: string;
  user_id: string;
  report_type: ReportType;
  message: string | null;
  latitude: number;
  longitude: number;
  photo_url: string | null;
  is_active: boolean;
  expires_at: string;
  created_at: string;
  user?: { username: string | null };
}

export interface EmergencyContact {
  id: string;
  user_id: string;
  name: string;
  phone: string;
}

export const REPORT_LABELS: Record<ReportType, { label: string; icon: string; color: string }> = {
  boue: { label: 'Sentier boueux', icon: 'water', color: '#92400E' },
  arbre_tombe: { label: 'Arbre tombe', icon: 'leaf', color: '#065F46' },
  eau_haute: { label: 'Eau haute / Gue difficile', icon: 'water', color: '#1E40AF' },
  brouillard: { label: 'Brouillard epais', icon: 'cloud', color: '#6B7280' },
  glissant: { label: 'Terrain glissant', icon: 'warning', color: '#D97706' },
  eboulement: { label: 'Eboulement / Pierres', icon: 'alert-circle', color: '#DC2626' },
  neige: { label: 'Neige / Verglas', icon: 'snow', color: '#60A5FA' },
  danger: { label: 'Danger', icon: 'alert-circle', color: '#DC2626' },
  sentier_degrade: { label: 'Sentier degrade', icon: 'construct', color: '#F59E0B' },
  balisage_manquant: { label: 'Balisage manquant', icon: 'eye-off', color: '#8B5CF6' },
  autre: { label: 'Autre', icon: 'information-circle', color: '#6B7280' },
};
