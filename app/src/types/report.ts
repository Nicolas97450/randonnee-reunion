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

import { COLORS } from '@/constants/theme';

export const REPORT_LABELS: Record<ReportType, { label: string; icon: string; color: string }> = {
  boue: { label: 'Sentier boueux', icon: 'water', color: COLORS.reportMud },
  arbre_tombe: { label: 'Arbre tombe', icon: 'leaf', color: COLORS.reportTree },
  eau_haute: { label: 'Eau haute / Gue difficile', icon: 'water', color: COLORS.reportWater },
  brouillard: { label: 'Brouillard epais', icon: 'cloud', color: COLORS.reportFog },
  glissant: { label: 'Terrain glissant', icon: 'warning', color: COLORS.reportSlippery },
  eboulement: { label: 'Eboulement / Pierres', icon: 'alert-circle', color: COLORS.reportRockfall },
  neige: { label: 'Neige / Verglas', icon: 'snow', color: COLORS.reportSnow },
  danger: { label: 'Danger', icon: 'alert-circle', color: COLORS.reportDanger },
  sentier_degrade: { label: 'Sentier degrade', icon: 'construct', color: COLORS.reportDegraded },
  balisage_manquant: { label: 'Balisage manquant', icon: 'eye-off', color: COLORS.reportMissing },
  autre: { label: 'Autre', icon: 'information-circle', color: COLORS.reportOther },
};
