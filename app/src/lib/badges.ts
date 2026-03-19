// Systeme de badges, niveaux et recompenses

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  condition: (stats: UserStats) => boolean;
}

export interface HikerLevel {
  level: number;
  name: string;
  minTrails: number;
  color: string;
}

export interface UserStats {
  totalTrails: number;
  totalKm: number;
  totalElevation: number;
  zonesCompleted: number;
  totalZones: number;
  regionsVisited: string[];
  maxElevationTrail: number;
  sorties_created: number;
  reports_submitted: number;
  /** Region names where ALL trails are completed */
  regionsFullyCompleted: string[];
  /** ISO timestamps of all completions */
  completionTimestamps: string[];
}

// --- MISSION 1 : 8 niveaux de randonneur ---

export const HIKER_LEVELS: HikerLevel[] = [
  { level: 1, name: 'Ti Marcheur', minTrails: 0, color: '#94a3b8' },
  { level: 2, name: 'Randonneur', minTrails: 6, color: '#22c55e' },
  { level: 3, name: 'Explorateur', minTrails: 21, color: '#3b82f6' },
  { level: 4, name: 'Baroudeur', minTrails: 51, color: '#8b5cf6' },
  { level: 5, name: 'Maitre des Sentiers', minTrails: 101, color: '#f59e0b' },
  { level: 6, name: 'Legende de l\'Ile', minTrails: 201, color: '#ef4444' },
  { level: 7, name: 'Roi Creole', minTrails: 401, color: '#ec4899' },
  { level: 8, name: 'Gardien de La Reunion', minTrails: 601, color: '#ffd700' },
];

export function getHikerLevel(trailsCompleted: number): HikerLevel {
  return HIKER_LEVELS.filter((l) => trailsCompleted >= l.minTrails).pop() ?? HIKER_LEVELS[0];
}

export function getNextLevel(trailsCompleted: number): HikerLevel | null {
  const current = getHikerLevel(trailsCompleted);
  const nextIdx = HIKER_LEVELS.findIndex((l) => l.level === current.level) + 1;
  return nextIdx < HIKER_LEVELS.length ? HIKER_LEVELS[nextIdx] : null;
}

export function getLevelProgress(trailsCompleted: number): number {
  const current = getHikerLevel(trailsCompleted);
  const next = getNextLevel(trailsCompleted);
  if (!next) return 1; // Max level reached
  const range = next.minTrails - current.minTrails;
  const progress = trailsCompleted - current.minTrails;
  return range > 0 ? Math.min(progress / range, 1) : 1;
}

// --- MISSION 2 : Badges geographiques + temporels ---

/** Check if any completion happened before 7:00 local time */
function hasEarlyMorningCompletion(timestamps: string[]): boolean {
  return timestamps.some((ts) => {
    const date = new Date(ts);
    return date.getHours() < 7;
  });
}

/** Check if 5 completions happened within any 7-day window */
function hasFiveInOneWeek(timestamps: string[]): boolean {
  if (timestamps.length < 5) return false;
  const sorted = timestamps.map((ts) => new Date(ts).getTime()).sort((a, b) => a - b);
  for (let i = 0; i <= sorted.length - 5; i++) {
    const windowEnd = sorted[i] + 7 * 24 * 60 * 60 * 1000;
    if (sorted[i + 4] <= windowEnd) return true;
  }
  return false;
}

export const BADGES: Badge[] = [
  // Progression
  {
    id: 'first_trail',
    name: 'Premier Pas',
    description: 'Valide ton premier sentier',
    icon: 'footsteps',
    color: '#4ADE80',
    condition: (s) => s.totalTrails >= 1,
  },
  {
    id: 'trail_10',
    name: 'Randonneur',
    description: 'Valide 10 sentiers',
    icon: 'walk',
    color: '#22D3EE',
    condition: (s) => s.totalTrails >= 10,
  },
  {
    id: 'trail_50',
    name: 'Explorateur',
    description: 'Valide 50 sentiers',
    icon: 'compass',
    color: '#F59E0B',
    condition: (s) => s.totalTrails >= 50,
  },
  {
    id: 'trail_100',
    name: 'Legendaire',
    description: 'Valide 100 sentiers',
    icon: 'trophy',
    color: '#EF4444',
    condition: (s) => s.totalTrails >= 100,
  },

  // Distance
  {
    id: 'km_50',
    name: '50 km',
    description: 'Cumule 50 km de randonnee',
    icon: 'speedometer',
    color: '#60A5FA',
    condition: (s) => s.totalKm >= 50,
  },
  {
    id: 'km_200',
    name: '200 km',
    description: 'Cumule 200 km de randonnee',
    icon: 'speedometer',
    color: '#A78BFA',
    condition: (s) => s.totalKm >= 200,
  },

  // Denivele
  {
    id: 'elevation_3000',
    name: 'Sommet 3000m',
    description: 'Atteins le Piton des Neiges (3071m)',
    icon: 'triangle',
    color: '#F97316',
    condition: (s) => s.maxElevationTrail >= 3000,
  },
  {
    id: 'elevation_cumul_10000',
    name: 'Grimpeur',
    description: 'Cumule 10 000m de denivele positif',
    icon: 'trending-up',
    color: '#DC2626',
    condition: (s) => s.totalElevation >= 10000,
  },

  // Zones / Regions
  {
    id: 'all_cirques',
    name: 'Maitre des Cirques',
    description: 'Randonne dans les 3 cirques (Mafate, Cilaos, Salazie)',
    icon: 'globe',
    color: '#8B5CF6',
    condition: (s) =>
      s.regionsVisited.includes('Cirque de Mafate') &&
      s.regionsVisited.includes('Cirque de Cilaos') &&
      s.regionsVisited.includes('Cirque de Salazie'),
  },
  {
    id: 'zone_complete_1',
    name: 'Zone Complete',
    description: 'Complete tous les sentiers d\'une zone',
    icon: 'checkmark-circle',
    color: '#16A34A',
    condition: (s) => s.zonesCompleted >= 1,
  },
  {
    id: 'all_regions',
    name: 'Tour de l\'Ile',
    description: 'Randonne dans toutes les regions de La Reunion',
    icon: 'earth',
    color: '#0EA5E9',
    condition: (s) => s.regionsVisited.length >= 10,
  },

  // Geographiques La Reunion
  {
    id: 'gardien_mafate',
    name: 'Gardien de Mafate',
    description: 'Complete tous les sentiers du Cirque de Mafate',
    icon: 'shield-checkmark',
    color: '#2ECC71',
    condition: (s) => s.regionsFullyCompleted.includes('Cirque de Mafate'),
  },
  {
    id: 'volcanologue',
    name: 'Volcanologue',
    description: 'Complete tous les sentiers du Massif du Volcan',
    icon: 'flame',
    color: '#E74C3C',
    condition: (s) => s.regionsFullyCompleted.includes('Massif du Volcan'),
  },

  // Temporels
  {
    id: 'leve_tot',
    name: 'Leve-tot',
    description: 'Valide un sentier avant 7h du matin',
    icon: 'sunny',
    color: '#FBBF24',
    condition: (s) => hasEarlyMorningCompletion(s.completionTimestamps),
  },
  {
    id: 'cinq_en_une_semaine',
    name: '5 en 1 Semaine',
    description: 'Valide 5 sentiers en 7 jours',
    icon: 'flash',
    color: '#F97316',
    condition: (s) => hasFiveInOneWeek(s.completionTimestamps),
  },

  // Social
  {
    id: 'first_sortie',
    name: 'Leader',
    description: 'Organise ta premiere sortie de groupe',
    icon: 'people',
    color: '#EC4899',
    condition: (s) => s.sorties_created >= 1,
  },

  // Communaute
  {
    id: 'first_report',
    name: 'Sentinelle',
    description: 'Envoie ton premier signalement terrain',
    icon: 'alert-circle',
    color: '#F59E0B',
    condition: (s) => s.reports_submitted >= 1,
  },
  {
    id: 'reports_10',
    name: 'Veilleur',
    description: 'Envoie 10 signalements terrain',
    icon: 'eye',
    color: '#14B8A6',
    condition: (s) => s.reports_submitted >= 10,
  },
];

export function getEarnedBadges(stats: UserStats): Badge[] {
  return BADGES.filter((badge) => badge.condition(stats));
}

export function getNextBadges(stats: UserStats): Badge[] {
  return BADGES.filter((badge) => !badge.condition(stats)).slice(0, 3);
}
