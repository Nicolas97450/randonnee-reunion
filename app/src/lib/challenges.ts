// Defis thematiques pre-configures pour La Reunion
// Chaque defi a une fonction getProgress() qui calcule la progression

import type { Trail } from '@/types';
import { COLORS } from '@/constants';

/** Minimal trail fields needed by challenge logic */
export type ChallengeTrail = Pick<
  Trail,
  'slug' | 'name' | 'region' | 'difficulty' | 'distance_km' | 'elevation_gain_m' | 'duration_min'
>;

export interface ChallengeProgress {
  current: number;
  target: number;
  completed: boolean;
  /** Trail slugs that count toward this challenge */
  matchingSlugs: string[];
}

export interface Challenge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  getProgress: (
    completedSlugs: string[],
    allTrails: ChallengeTrail[],
    completionTimestamps: string[],
    totalKm: number,
  ) => ChallengeProgress;
}

/**
 * Check if regions list includes all three cirques.
 * Uses the trail's region field from Supabase.
 */
function getRegionsFromCompletedTrails(
  completedSlugs: string[],
  allTrails: ChallengeTrail[],
): string[] {
  const completedSet = new Set(completedSlugs);
  const regions = new Set<string>();
  for (const trail of allTrails) {
    if (completedSet.has(trail.slug)) {
      regions.add(trail.region);
    }
  }
  return Array.from(regions);
}

function getCompletedTrailsInRegion(
  completedSlugs: string[],
  allTrails: ChallengeTrail[],
  region: string,
): string[] {
  const completedSet = new Set(completedSlugs);
  return allTrails
    .filter((t) => t.region === region && completedSet.has(t.slug))
    .map((t) => t.slug);
}

function getAllTrailsInRegion(allTrails: ChallengeTrail[], region: string): string[] {
  return allTrails.filter((t) => t.region === region).map((t) => t.slug);
}

/** Check if N completions happened within any 7-day window */
function countInSevenDayWindow(timestamps: string[]): number {
  if (timestamps.length === 0) return 0;
  const sorted = timestamps.map((ts) => new Date(ts).getTime()).sort((a, b) => a - b);
  let maxInWindow = 0;
  for (let i = 0; i < sorted.length; i++) {
    const windowEnd = sorted[i] + 7 * 24 * 60 * 60 * 1000;
    let count = 0;
    for (let j = i; j < sorted.length && sorted[j] <= windowEnd; j++) {
      count++;
    }
    if (count > maxInWindow) maxInWindow = count;
  }
  return maxInWindow;
}

export const CHALLENGES: Challenge[] = [
  {
    id: 'trois-cirques',
    name: 'Les 3 Cirques',
    description: 'Completez au moins 1 sentier dans chaque cirque',
    icon: 'trophy',
    color: COLORS.gold,
    getProgress: (completedSlugs, allTrails) => {
      const regions = getRegionsFromCompletedTrails(completedSlugs, allTrails);
      const cirques = ['Cirque de Mafate', 'Cirque de Cilaos', 'Cirque de Salazie'];
      const done = cirques.filter((c) => regions.includes(c));
      const matchingSlugs: string[] = [];
      for (const cirque of cirques) {
        const slugs = getCompletedTrailsInRegion(completedSlugs, allTrails, cirque);
        if (slugs.length > 0) matchingSlugs.push(slugs[0]);
      }
      return {
        current: done.length,
        target: 3,
        completed: done.length >= 3,
        matchingSlugs,
      };
    },
  },
  {
    id: 'volcan',
    name: 'Volcanologue',
    description: 'Tous les sentiers du Massif du Volcan',
    icon: 'flame',
    color: COLORS.danger,
    getProgress: (completedSlugs, allTrails) => {
      const regionTrails = getAllTrailsInRegion(allTrails, 'Massif du Volcan');
      const completed = getCompletedTrailsInRegion(completedSlugs, allTrails, 'Massif du Volcan');
      return {
        current: completed.length,
        target: regionTrails.length,
        completed: regionTrails.length > 0 && completed.length >= regionTrails.length,
        matchingSlugs: completed,
      };
    },
  },
  {
    id: 'chasseur-cascades',
    name: 'Chasseur de cascades',
    description: '15 sentiers avec "cascade" dans le nom',
    icon: 'water',
    color: COLORS.info,
    getProgress: (completedSlugs, allTrails) => {
      const completedSet = new Set(completedSlugs);
      const cascadeTrails = allTrails.filter(
        (t) => t.name.toLowerCase().includes('cascade'),
      );
      const completed = cascadeTrails.filter((t) => completedSet.has(t.slug));
      return {
        current: completed.length,
        target: 15,
        completed: completed.length >= 15,
        matchingSlugs: completed.map((t) => t.slug),
      };
    },
  },
  {
    id: 'tour-ile',
    name: 'Tour de l\'ile',
    description: '1 sentier dans chacune des 11 regions',
    icon: 'globe',
    color: COLORS.primaryLight,
    getProgress: (completedSlugs, allTrails) => {
      const regions = getRegionsFromCompletedTrails(completedSlugs, allTrails);
      // Count unique regions in the DB
      const allRegions = new Set(allTrails.map((t) => t.region));
      const target = allRegions.size;
      const matchingSlugs: string[] = [];
      for (const region of regions) {
        const slugs = getCompletedTrailsInRegion(completedSlugs, allTrails, region);
        if (slugs.length > 0) matchingSlugs.push(slugs[0]);
      }
      return {
        current: regions.length,
        target,
        completed: regions.length >= target,
        matchingSlugs,
      };
    },
  },
  {
    id: 'altitude',
    name: 'Altitude',
    description: '5 sentiers au-dessus de 2000m de denivele',
    icon: 'trending-up',
    color: COLORS.expert,
    getProgress: (completedSlugs, allTrails) => {
      const completedSet = new Set(completedSlugs);
      const highTrails = allTrails.filter((t) => t.elevation_gain_m >= 2000);
      const completed = highTrails.filter((t) => completedSet.has(t.slug));
      return {
        current: completed.length,
        target: 5,
        completed: completed.length >= 5,
        matchingSlugs: completed.map((t) => t.slug),
      };
    },
  },
  {
    id: 'familial',
    name: 'Familial',
    description: '10 sentiers faciles de moins d\'1h',
    icon: 'people',
    color: COLORS.warning,
    getProgress: (completedSlugs, allTrails) => {
      const completedSet = new Set(completedSlugs);
      const easyShort = allTrails.filter(
        (t) => t.difficulty === 'facile' && t.duration_min <= 60,
      );
      const completed = easyShort.filter((t) => completedSet.has(t.slug));
      return {
        current: completed.length,
        target: 10,
        completed: completed.length >= 10,
        matchingSlugs: completed.map((t) => t.slug),
      };
    },
  },
  {
    id: 'semaine-intensive',
    name: 'Semaine intensive',
    description: '5 sentiers en 7 jours',
    icon: 'flash',
    color: COLORS.pink,
    getProgress: (_completedSlugs, _allTrails, completionTimestamps) => {
      const maxInWindow = countInSevenDayWindow(completionTimestamps);
      return {
        current: Math.min(maxInWindow, 5),
        target: 5,
        completed: maxInWindow >= 5,
        matchingSlugs: [],
      };
    },
  },
  {
    id: 'endurance',
    name: 'Endurance',
    description: 'Cumulez 100 km de randonnee',
    icon: 'fitness',
    color: COLORS.teal,
    getProgress: (_completedSlugs, _allTrails, _timestamps, totalKm) => {
      const capped = Math.min(Math.round(totalKm), 100);
      return {
        current: capped,
        target: 100,
        completed: totalKm >= 100,
        matchingSlugs: [],
      };
    },
  },
];
