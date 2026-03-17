// Systeme de badges et recompenses

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  condition: (stats: UserStats) => boolean;
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
