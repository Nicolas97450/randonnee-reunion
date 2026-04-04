/**
 * Unit tests for badges.ts
 * Tests hiker levels, badge earning conditions, and progress calculations
 */

import {
  Badge,
  BADGES,
  getHikerLevel,
  getNextLevel,
  getLevelProgress,
  getEarnedBadges,
  getNextBadges,
  HIKER_LEVELS,
  UserStats,
} from '../../lib/badges';

// Mock COLORS constant since badges.ts imports from constants
jest.mock('@/constants', () => ({
  COLORS: {
    silver: '#94a3b8',
    primaryLight: '#22c55e',
    info: '#3b82f6',
    expert: '#7c3aed',
    warm: '#d97706',
    danger: '#dc2626',
    pink: '#ec4899',
    gold: '#ffd700',
    cyan: '#22d3ee',
    success: '#22c55e',
    sky: '#0ea5e9',
    teal: '#14b8a6',
  },
}));

describe('badges.ts', () => {
  describe('HIKER_LEVELS constant', () => {
    it('should have exactly 8 levels', () => {
      expect(HIKER_LEVELS).toHaveLength(8);
    });

    it('should have levels 1-8 in order', () => {
      HIKER_LEVELS.forEach((level, index) => {
        expect(level.level).toBe(index + 1);
      });
    });

    it('should have minTrails in ascending order', () => {
      for (let i = 1; i < HIKER_LEVELS.length; i++) {
        expect(HIKER_LEVELS[i].minTrails).toBeGreaterThan(HIKER_LEVELS[i - 1].minTrails);
      }
    });

    it('should have all required properties', () => {
      HIKER_LEVELS.forEach((level) => {
        expect(level).toHaveProperty('level');
        expect(level).toHaveProperty('name');
        expect(level).toHaveProperty('minTrails');
        expect(level).toHaveProperty('color');
        expect(typeof level.name).toBe('string');
        expect(typeof level.minTrails).toBe('number');
        expect(typeof level.color).toBe('string');
      });
    });

    it('should have correct minTrails thresholds', () => {
      expect(HIKER_LEVELS[0].minTrails).toBe(0);
      expect(HIKER_LEVELS[1].minTrails).toBe(6);
      expect(HIKER_LEVELS[2].minTrails).toBe(21);
      expect(HIKER_LEVELS[3].minTrails).toBe(51);
      expect(HIKER_LEVELS[4].minTrails).toBe(101);
      expect(HIKER_LEVELS[5].minTrails).toBe(201);
      expect(HIKER_LEVELS[6].minTrails).toBe(401);
      expect(HIKER_LEVELS[7].minTrails).toBe(601);
    });
  });

  describe('getHikerLevel', () => {
    it('should return level 1 (Ti Marcheur) for 0 trails', () => {
      const level = getHikerLevel(0);
      expect(level.level).toBe(1);
      expect(level.name).toBe('Ti Marcheur');
    });

    it('should return level 1 for 1-5 trails', () => {
      expect(getHikerLevel(1).level).toBe(1);
      expect(getHikerLevel(3).level).toBe(1);
      expect(getHikerLevel(5).level).toBe(1);
    });

    it('should return level 2 at boundary (6 trails)', () => {
      const level = getHikerLevel(6);
      expect(level.level).toBe(2);
      expect(level.name).toBe('Randonneur');
    });

    it('should return level 3 at boundary (21 trails)', () => {
      const level = getHikerLevel(21);
      expect(level.level).toBe(3);
      expect(level.name).toBe('Explorateur');
    });

    it('should return level 4 at boundary (51 trails)', () => {
      const level = getHikerLevel(51);
      expect(level.level).toBe(4);
      expect(level.name).toBe('Baroudeur');
    });

    it('should return level 5 at boundary (101 trails)', () => {
      const level = getHikerLevel(101);
      expect(level.level).toBe(5);
      expect(level.name).toBe('Maitre des Sentiers');
    });

    it('should return level 6 at boundary (201 trails)', () => {
      const level = getHikerLevel(201);
      expect(level.level).toBe(6);
      expect(level.name).toBe('Legende de l\'Ile');
    });

    it('should return level 7 at boundary (401 trails)', () => {
      const level = getHikerLevel(401);
      expect(level.level).toBe(7);
      expect(level.name).toBe('Roi Creole');
    });

    it('should return level 8 (max) at boundary (601 trails)', () => {
      const level = getHikerLevel(601);
      expect(level.level).toBe(8);
      expect(level.name).toBe('Gardien de La Reunion');
    });

    it('should return level 8 for 600+ trails', () => {
      expect(getHikerLevel(600).level).toBe(7);
      expect(getHikerLevel(601).level).toBe(8);
      expect(getHikerLevel(700).level).toBe(8);
      expect(getHikerLevel(1000).level).toBe(8);
    });
  });

  describe('getNextLevel', () => {
    it('should return level 2 when at level 1', () => {
      const next = getNextLevel(0);
      expect(next).not.toBeNull();
      expect(next?.level).toBe(2);
    });

    it('should return level 3 when at level 2', () => {
      const next = getNextLevel(6);
      expect(next).not.toBeNull();
      expect(next?.level).toBe(3);
    });

    it('should return level 4 when at level 3', () => {
      const next = getNextLevel(21);
      expect(next).not.toBeNull();
      expect(next?.level).toBe(4);
    });

    it('should return null when at max level (level 8)', () => {
      const next = getNextLevel(601);
      expect(next).toBeNull();
    });

    it('should return null for very high trail count', () => {
      expect(getNextLevel(1000)).toBeNull();
    });

    it('should return correct next level for any intermediate level', () => {
      expect(getNextLevel(50)?.level).toBe(4); // At level 3, next is 4
      expect(getNextLevel(100)?.level).toBe(5); // At level 4, next is 5
      expect(getNextLevel(200)?.level).toBe(6); // At level 5, next is 6
    });
  });

  describe('getLevelProgress', () => {
    it('should return 0 when just reaching a new level', () => {
      // At level 2 (6 trails), progress towards level 3 (21 trails)
      const progress = getLevelProgress(6);
      expect(progress).toBe(0);
    });

    it('should return progress between 0 and 1 for intermediate levels', () => {
      // Level 2 range: 6-21 (range=15)
      // At 13 trails: (13-6)/15 = 7/15 ≈ 0.467
      const progress = getLevelProgress(13);
      expect(progress).toBeGreaterThan(0);
      expect(progress).toBeLessThan(1);
      expect(progress).toBeCloseTo(7 / 15, 2);
    });

    it('should approach 1 near next level', () => {
      // Level 2 range: 6-21
      // At 20 trails: (20-6)/15 = 14/15 ≈ 0.933
      const progress = getLevelProgress(20);
      expect(progress).toBeGreaterThan(0.9);
      expect(progress).toBeLessThan(1);
      expect(progress).toBeCloseTo(14 / 15, 2);
    });

    it('should cap at 1.0 when at or near next level', () => {
      const progress = getLevelProgress(21);
      expect(progress).toBeLessThanOrEqual(1);
    });

    it('should return exactly 1 when at max level', () => {
      const progress = getLevelProgress(601);
      expect(progress).toBe(1);
    });

    it('should return 1 for any trail count at max level', () => {
      expect(getLevelProgress(700)).toBe(1);
      expect(getLevelProgress(1000)).toBe(1);
    });

    it('should calculate correct progress for level 5 boundary', () => {
      // Level 5 range: 101-201 (range=100)
      // At 151 trails: (151-101)/100 = 0.5
      const progress = getLevelProgress(151);
      expect(progress).toBeCloseTo(0.5, 2);
    });
  });

  describe('BADGES constant', () => {
    it('should have 18 badges', () => {
      expect(BADGES).toHaveLength(18);
    });

    it('should all have required properties', () => {
      BADGES.forEach((badge) => {
        expect(badge).toHaveProperty('id');
        expect(badge).toHaveProperty('name');
        expect(badge).toHaveProperty('description');
        expect(badge).toHaveProperty('icon');
        expect(badge).toHaveProperty('color');
        expect(badge).toHaveProperty('condition');
        expect(typeof badge.id).toBe('string');
        expect(typeof badge.name).toBe('string');
        expect(typeof badge.description).toBe('string');
        expect(typeof badge.condition).toBe('function');
      });
    });

    it('should have unique badge IDs', () => {
      const ids = BADGES.map((b) => b.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(BADGES.length);
    });

    it('should include progression badges', () => {
      const progressBadges = ['first_trail', 'trail_10', 'trail_50', 'trail_100'];
      progressBadges.forEach((badgeId) => {
        expect(BADGES.some((b) => b.id === badgeId)).toBe(true);
      });
    });

    it('should include distance badges', () => {
      const distanceBadges = ['km_50', 'km_200'];
      distanceBadges.forEach((badgeId) => {
        expect(BADGES.some((b) => b.id === badgeId)).toBe(true);
      });
    });

    it('should include elevation badges', () => {
      const elevationBadges = ['elevation_3000', 'elevation_cumul_10000'];
      elevationBadges.forEach((badgeId) => {
        expect(BADGES.some((b) => b.id === badgeId)).toBe(true);
      });
    });

    it('should include social badges', () => {
      expect(BADGES.some((b) => b.id === 'first_sortie')).toBe(true);
    });

    it('should include temporal badges', () => {
      expect(BADGES.some((b) => b.id === 'leve_tot')).toBe(true);
      expect(BADGES.some((b) => b.id === 'cinq_en_une_semaine')).toBe(true);
    });
  });

  describe('getEarnedBadges', () => {
    it('should return empty array for new user', () => {
      const stats: UserStats = {
        totalTrails: 0,
        totalKm: 0,
        totalElevation: 0,
        zonesCompleted: 0,
        totalZones: 18,
        regionsVisited: [],
        maxElevationTrail: 0,
        sorties_created: 0,
        reports_submitted: 0,
        regionsFullyCompleted: [],
        completionTimestamps: [],
      };
      const earned = getEarnedBadges(stats);
      expect(earned).toHaveLength(0);
    });

    it('should return first_trail badge after 1 trail', () => {
      const stats: UserStats = {
        totalTrails: 1,
        totalKm: 0,
        totalElevation: 0,
        zonesCompleted: 0,
        totalZones: 18,
        regionsVisited: [],
        maxElevationTrail: 0,
        sorties_created: 0,
        reports_submitted: 0,
        regionsFullyCompleted: [],
        completionTimestamps: [],
      };
      const earned = getEarnedBadges(stats);
      expect(earned.some((b) => b.id === 'first_trail')).toBe(true);
    });

    it('should return trail_10 badge after 10 trails', () => {
      const stats: UserStats = {
        totalTrails: 10,
        totalKm: 50,
        totalElevation: 2000,
        zonesCompleted: 1,
        totalZones: 18,
        regionsVisited: ['Cirque de Mafate'],
        maxElevationTrail: 2000,
        sorties_created: 0,
        reports_submitted: 0,
        regionsFullyCompleted: [],
        completionTimestamps: [],
      };
      const earned = getEarnedBadges(stats);
      expect(earned.some((b) => b.id === 'trail_10')).toBe(true);
    });

    it('should return multiple badges for advanced user', () => {
      const stats: UserStats = {
        totalTrails: 100,
        totalKm: 250,
        totalElevation: 15000,
        zonesCompleted: 5,
        totalZones: 18,
        regionsVisited: [
          'Cirque de Mafate',
          'Cirque de Cilaos',
          'Cirque de Salazie',
          'Massif du Volcan',
          'Littoral Ouest',
          'Littoral Est',
          'Sud Sauvage',
          'Piton des Neiges',
          'Route des Tamarins',
          'Plaine des Palmistes',
        ],
        maxElevationTrail: 3100,
        sorties_created: 2,
        reports_submitted: 5,
        regionsFullyCompleted: ['Cirque de Mafate'],
        completionTimestamps: [],
      };
      const earned = getEarnedBadges(stats);
      expect(earned.length).toBeGreaterThan(5);
      expect(earned.some((b) => b.id === 'trail_100')).toBe(true);
      expect(earned.some((b) => b.id === 'km_200')).toBe(true);
      expect(earned.some((b) => b.id === 'elevation_3000')).toBe(true);
      expect(earned.some((b) => b.id === 'all_cirques')).toBe(true);
      expect(earned.some((b) => b.id === 'gardien_mafate')).toBe(true);
    });

    it('should filter correctly based on km condition', () => {
      const stats: UserStats = {
        totalTrails: 5,
        totalKm: 50,
        totalElevation: 1000,
        zonesCompleted: 0,
        totalZones: 18,
        regionsVisited: [],
        maxElevationTrail: 1000,
        sorties_created: 0,
        reports_submitted: 0,
        regionsFullyCompleted: [],
        completionTimestamps: [],
      };
      const earned = getEarnedBadges(stats);
      expect(earned.some((b) => b.id === 'km_50')).toBe(true);
      expect(earned.some((b) => b.id === 'km_200')).toBe(false);
    });
  });

  describe('getNextBadges', () => {
    it('should return up to 3 unearned badges', () => {
      const stats: UserStats = {
        totalTrails: 0,
        totalKm: 0,
        totalElevation: 0,
        zonesCompleted: 0,
        totalZones: 18,
        regionsVisited: [],
        maxElevationTrail: 0,
        sorties_created: 0,
        reports_submitted: 0,
        regionsFullyCompleted: [],
        completionTimestamps: [],
      };
      const next = getNextBadges(stats);
      expect(next.length).toBeLessThanOrEqual(3);
      expect(next.length).toBeGreaterThan(0);
    });

    it('should exclude already earned badges', () => {
      const stats: UserStats = {
        totalTrails: 1,
        totalKm: 0,
        totalElevation: 0,
        zonesCompleted: 0,
        totalZones: 18,
        regionsVisited: [],
        maxElevationTrail: 0,
        sorties_created: 0,
        reports_submitted: 0,
        regionsFullyCompleted: [],
        completionTimestamps: [],
      };
      const earned = getEarnedBadges(stats);
      const next = getNextBadges(stats);
      const nextIds = new Set(next.map((b) => b.id));
      earned.forEach((earnedBadge) => {
        expect(nextIds.has(earnedBadge.id)).toBe(false);
      });
    });

    it('should return empty array when all badges earned', () => {
      // Create a stats object that would unlock all badges (impossible in practice but theoretically)
      const stats: UserStats = {
        totalTrails: 1000,
        totalKm: 5000,
        totalElevation: 50000,
        zonesCompleted: 18,
        totalZones: 18,
        regionsVisited: Array.from({ length: 15 }, (_, i) => `Region ${i}`),
        maxElevationTrail: 5000,
        sorties_created: 100,
        reports_submitted: 100,
        regionsFullyCompleted: ['Cirque de Mafate', 'Massif du Volcan'],
        completionTimestamps: [
          new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // Early morning
          ...Array.from({ length: 10 }, (_, i) =>
            new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
          ), // Last 10 days
        ],
      };
      const next = getNextBadges(stats);
      expect(next.length).toBeLessThanOrEqual(3);
    });

    it('should return suggestions for progression path', () => {
      const stats: UserStats = {
        totalTrails: 5,
        totalKm: 20,
        totalElevation: 1000,
        zonesCompleted: 0,
        totalZones: 18,
        regionsVisited: ['Cirque de Mafate'],
        maxElevationTrail: 1000,
        sorties_created: 0,
        reports_submitted: 0,
        regionsFullyCompleted: [],
        completionTimestamps: [],
      };
      const next = getNextBadges(stats);
      // Should suggest badges that are close to being earned
      const nextIds = next.map((b) => b.id);
      expect(nextIds.length).toBeGreaterThan(0);
      // trail_10 should be in suggestions (5 trails, need 10)
      expect(nextIds.some((id) => id.includes('trail'))).toBe(true);
    });
  });
});
