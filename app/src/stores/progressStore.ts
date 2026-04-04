import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';
import { hapticSuccess } from '@/lib/haptics';
import { REGION_TO_ZONE, ZONES } from '@/lib/zones';

interface ZoneProgress {
  zoneSlug: string;
  zoneName: string;
  completedTrails: number;
  totalTrails: number;
  progress: number; // 0 to 1
}

interface TrailRegionCount {
  slug: string;
  region: string;
  zone_slug?: string; // from trail_zones join, preferred over REGION_TO_ZONE
}

interface WeeklyMonthlyStats {
  weekTrails: number;
  weekKm: number;
  weekElevation: number;
  monthTrails: number;
  monthKm: number;
  monthElevation: number;
}

interface ProgressState {
  completedTrailSlugs: string[];
  zoneProgress: ZoneProgress[];
  totalCompleted: number;
  totalTrails: number;
  overallProgress: number; // 0 to 1
  isLoading: boolean;

  // Streaks (Mission 3)
  currentStreak: number;
  bestStreak: number;
  lastActivityWeek: string; // format "2026-W12"

  // XP (Mission 4)
  totalXP: number;

  // Stats temporelles (Mission 5)
  periodStats: WeeklyMonthlyStats;

  // Regions fully completed (for badges)
  regionsFullyCompleted: string[];

  // Completion timestamps (for time-based badges)
  completionTimestamps: string[];

  loadProgress: (userId: string) => Promise<void>;
  validateTrail: (userId: string, trailSlug: string, method: 'gps' | 'manual') => Promise<void>;
  isTrailCompleted: (trailSlug: string) => boolean;
  loadStreaks: () => Promise<void>;
  saveStreaks: () => Promise<void>;
}

const STREAK_STORAGE_KEY = '@rando_streaks';

// [E4] Force timezone to Indian/Reunion (UTC+4) for streak calculations
function toReunionDate(date: Date): Date {
  // Shift to UTC+4 regardless of device timezone
  const utc = date.getTime() + date.getTimezoneOffset() * 60000;
  return new Date(utc + 4 * 3600000);
}

function getISOWeek(date: Date): string {
  const d = toReunionDate(date);
  d.setHours(0, 0, 0, 0);
  // Set to nearest Thursday (ISO standard)
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  const weekNum = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${d.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
}

function getNextWeek(isoWeek: string): string {
  // Parse "2026-W12" format and compute the next week
  const [yearStr, weekStr] = isoWeek.split('-W');
  const year = parseInt(yearStr, 10);
  const week = parseInt(weekStr, 10);
  // Create a date for the Monday of this ISO week
  const jan4 = new Date(year, 0, 4);
  const dayOfWeek = jan4.getDay() || 7;
  const mondayOfWeek1 = new Date(jan4.getTime() - (dayOfWeek - 1) * 86400000);
  const targetMonday = new Date(mondayOfWeek1.getTime() + (week - 1) * 7 * 86400000);
  // Add 7 days for next week
  const nextMonday = new Date(targetMonday.getTime() + 7 * 86400000);
  return getISOWeek(nextMonday);
}

function computeZoneProgress(
  allTrails: TrailRegionCount[],
  completedSlugs: string[],
): ZoneProgress[] {
  const zoneCounts: Record<string, { total: number; completed: number }> = {};
  const completedSet = new Set(completedSlugs);

  for (const zone of ZONES) {
    zoneCounts[zone.slug] = { total: 0, completed: 0 };
  }

  for (const trail of allTrails) {
    // Prefer zone from trail_zones table (DB-level), fallback to REGION_TO_ZONE mapping
    const zoneSlug = trail.zone_slug || REGION_TO_ZONE[trail.region];
    if (zoneSlug && zoneCounts[zoneSlug]) {
      zoneCounts[zoneSlug].total += 1;
      if (completedSet.has(trail.slug)) {
        zoneCounts[zoneSlug].completed += 1;
      }
    }
  }

  return ZONES.map((zone) => {
    const counts = zoneCounts[zone.slug] ?? { total: 0, completed: 0 };
    return {
      zoneSlug: zone.slug,
      zoneName: zone.name,
      completedTrails: counts.completed,
      totalTrails: counts.total,
      progress: counts.total > 0 ? counts.completed / counts.total : 0,
    };
  });
}

function computeRegionsFullyCompleted(
  allTrails: TrailRegionCount[],
  completedSlugs: string[],
): string[] {
  const completedSet = new Set(completedSlugs);
  const regionCounts: Record<string, { total: number; completed: number }> = {};

  for (const trail of allTrails) {
    if (!regionCounts[trail.region]) {
      regionCounts[trail.region] = { total: 0, completed: 0 };
    }
    regionCounts[trail.region].total += 1;
    if (completedSet.has(trail.slug)) {
      regionCounts[trail.region].completed += 1;
    }
  }

  return Object.entries(regionCounts)
    .filter(([, counts]) => counts.total > 0 && counts.completed >= counts.total)
    .map(([region]) => region);
}

function computeXP(activities: Array<{ distance_km?: number; elevation_gain?: number }>): number {
  let xp = 0;
  for (const activity of activities) {
    // Base XP per validation
    xp += 100;
    // Distance bonus
    if (activity.distance_km && activity.distance_km > 0) {
      xp += Math.round(activity.distance_km * 10);
    }
    // Elevation bonus
    if (activity.elevation_gain && activity.elevation_gain > 0) {
      xp += Math.round(activity.elevation_gain * 0.5);
    }
  }
  return xp;
}

function computePeriodStats(
  activities: Array<{ completed_at: string; distance_km?: number; elevation_gain?: number }>,
): WeeklyMonthlyStats {
  const now = new Date();
  const currentWeek = getISOWeek(now);
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const stats: WeeklyMonthlyStats = {
    weekTrails: 0, weekKm: 0, weekElevation: 0,
    monthTrails: 0, monthKm: 0, monthElevation: 0,
  };

  for (const activity of activities) {
    const actDate = new Date(activity.completed_at);
    const actWeek = getISOWeek(actDate);
    const actMonth = `${actDate.getFullYear()}-${String(actDate.getMonth() + 1).padStart(2, '0')}`;

    if (actWeek === currentWeek) {
      stats.weekTrails += 1;
      stats.weekKm += activity.distance_km ?? 0;
      stats.weekElevation += activity.elevation_gain ?? 0;
    }
    if (actMonth === currentMonth) {
      stats.monthTrails += 1;
      stats.monthKm += activity.distance_km ?? 0;
      stats.monthElevation += activity.elevation_gain ?? 0;
    }
  }

  stats.weekKm = Math.round(stats.weekKm * 10) / 10;
  stats.monthKm = Math.round(stats.monthKm * 10) / 10;
  stats.weekElevation = Math.round(stats.weekElevation);
  stats.monthElevation = Math.round(stats.monthElevation);

  return stats;
}

export const useProgressStore = create<ProgressState>((set, get) => ({
  completedTrailSlugs: [],
  zoneProgress: [],
  totalCompleted: 0,
  totalTrails: 0,
  overallProgress: 0,
  isLoading: false,

  // Streaks
  currentStreak: 0,
  bestStreak: 0,
  lastActivityWeek: '',

  // XP
  totalXP: 0,

  // Period stats
  periodStats: {
    weekTrails: 0, weekKm: 0, weekElevation: 0,
    monthTrails: 0, monthKm: 0, monthElevation: 0,
  },

  // Regions
  regionsFullyCompleted: [],

  // Timestamps
  completionTimestamps: [],

  loadStreaks: async () => {
    try {
      const stored = await AsyncStorage.getItem(STREAK_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as {
          currentStreak: number;
          bestStreak: number;
          lastActivityWeek: string;
        };
        set({
          currentStreak: parsed.currentStreak ?? 0,
          bestStreak: parsed.bestStreak ?? 0,
          lastActivityWeek: parsed.lastActivityWeek ?? '',
        });
      } else {
        // [E4] Fallback: try loading from Supabase server backup
        const userId = (await supabase.auth.getUser()).data.user?.id;
        if (userId) {
          const { data } = await supabase
            .from('user_streaks')
            .select('current_streak, best_streak, last_activity_week')
            .eq('user_id', userId)
            .single();
          if (data) {
            set({
              currentStreak: data.current_streak ?? 0,
              bestStreak: data.best_streak ?? 0,
              lastActivityWeek: data.last_activity_week ?? '',
            });
          }
        }
      }
    } catch {
      // Silently fail — streaks will start fresh
    }
  },

  saveStreaks: async () => {
    try {
      const { currentStreak, bestStreak, lastActivityWeek } = get();
      await AsyncStorage.setItem(STREAK_STORAGE_KEY, JSON.stringify({
        currentStreak,
        bestStreak,
        lastActivityWeek,
      }));
    } catch {
      // Silently fail
    }
  },

  loadProgress: async (userId: string) => {
    set({ isLoading: true });

    // Load streaks from AsyncStorage in parallel
    get().loadStreaks();

    try {
      // Fetch all trails (slug + region), trail_zones overrides, and user completions in parallel
      const [trailsResult, trailZonesResult, activitiesResult] = await Promise.all([
        supabase.from('trails').select('slug, region'),
        supabase.from('trail_zones').select('trail:trails!trail_id(slug), zone:map_zones!zone_id(slug)'),
        supabase.from('user_activities')
          .select('trail_id, completed_at, trails(slug, distance_km, elevation_gain)')
          .eq('user_id', userId),
      ]);

      if (trailsResult.error) throw trailsResult.error;
      if (activitiesResult.error) throw activitiesResult.error;
      // trail_zones may be empty — not a fatal error
      const trailZoneOverrides: Record<string, string> = {};
      if (!trailZonesResult.error && trailZonesResult.data) {
        for (const tz of trailZonesResult.data) {
          const trail = tz.trail as unknown as { slug: string } | null;
          const zone = tz.zone as unknown as { slug: string } | null;
          if (trail?.slug && zone?.slug) {
            trailZoneOverrides[trail.slug] = zone.slug;
          }
        }
      }

      const allTrails = (trailsResult.data ?? []).map((t: { slug: string; region: string }) => ({
        ...t,
        zone_slug: trailZoneOverrides[t.slug],
      })) as TrailRegionCount[];
      const totalTrails = allTrails.length;

      const completedSlugs = (activitiesResult.data ?? [])
        .map((a: Record<string, unknown>) => {
          const trails = a.trails as { slug: string } | { slug: string }[] | null;
          if (Array.isArray(trails)) return trails[0]?.slug;
          return trails?.slug;
        })
        .filter((s): s is string => !!s);

      const zoneProgress = computeZoneProgress(allTrails, completedSlugs);
      const regionsFullyCompleted = computeRegionsFullyCompleted(allTrails, completedSlugs);

      // Extract activity data for XP and period stats
      const activityDetails = (activitiesResult.data ?? []).map((a: Record<string, unknown>) => {
        const trails = a.trails as { slug: string; distance_km?: number; elevation_gain?: number } | null;
        return {
          completed_at: (a.completed_at as string) ?? '',
          distance_km: Array.isArray(trails) ? (trails as Array<{ distance_km?: number }>)[0]?.distance_km : trails?.distance_km,
          elevation_gain: Array.isArray(trails) ? (trails as Array<{ elevation_gain?: number }>)[0]?.elevation_gain : trails?.elevation_gain,
        };
      });

      // [E2] Try server-side XP first, fallback to client computation
      let totalXP: number;
      const { data: serverXP, error: xpError } = await supabase.rpc('compute_user_xp', { p_user_id: userId });
      if (!xpError && typeof serverXP === 'number') {
        totalXP = serverXP;
      } else {
        totalXP = computeXP(activityDetails);
      }

      const periodStats = computePeriodStats(activityDetails);
      const completionTimestamps = activityDetails
        .map((a) => a.completed_at)
        .filter((ts): ts is string => !!ts);

      set({
        completedTrailSlugs: completedSlugs,
        zoneProgress,
        totalCompleted: completedSlugs.length,
        totalTrails,
        overallProgress: totalTrails > 0 ? completedSlugs.length / totalTrails : 0,
        isLoading: false,
        totalXP,
        periodStats,
        regionsFullyCompleted,
        completionTimestamps,
      });
    } catch {
      set({ isLoading: false });
    }
  },

  validateTrail: async (userId, trailSlug, method) => {
    const { data: trail } = await supabase
      .from('trails')
      .select('id')
      .eq('slug', trailSlug)
      .single();

    if (!trail) return;

    const now = new Date();

    // [E1] Use server-side RPC for validation (anti-cheat)
    const { data: rpcResult, error: rpcError } = await supabase.rpc(
      'validate_and_complete_trail',
      {
        p_user_id: userId,
        p_trail_id: trail.id,
        p_validation_type: method,
      },
    );

    // Fallback to direct insert if RPC not deployed yet
    if (rpcError?.message?.includes('function') || rpcError?.code === '42883') {
      const { error } = await supabase.from('user_activities').insert({
        user_id: userId,
        trail_id: trail.id,
        validation_type: method,
        completed_at: now.toISOString(),
      });
      if (error) return;
    } else if (rpcError) {
      return;
    }

    // Update local state optimistically
    const completedSlugs = [...get().completedTrailSlugs, trailSlug];
    const totalTrails = get().totalTrails || 710;

    // Update streak with Reunion timezone
    const currentWeek = getISOWeek(now);
    const { lastActivityWeek, currentStreak, bestStreak } = get();

    let newStreak = currentStreak;
    let newBest = bestStreak;

    if (currentWeek === lastActivityWeek) {
      // Same week — no change to streak
    } else if (lastActivityWeek && getNextWeek(lastActivityWeek) === currentWeek) {
      newStreak = currentStreak + 1;
    } else {
      newStreak = 1;
    }

    if (newStreak > newBest) {
      newBest = newStreak;
    }

    hapticSuccess(); // [UX-5] Haptic feedback on trail completion

    // XP from RPC result or estimate
    const xpAwarded = rpcResult?.[0]?.xp_awarded ?? 100;
    const newXP = get().totalXP + xpAwarded;

    set({
      completedTrailSlugs: completedSlugs,
      totalCompleted: completedSlugs.length,
      overallProgress: totalTrails > 0 ? completedSlugs.length / totalTrails : 0,
      currentStreak: newStreak,
      bestStreak: newBest,
      lastActivityWeek: currentWeek,
      totalXP: newXP,
      completionTimestamps: [...(get().completionTimestamps ?? []), now.toISOString()],
    });

    // [E4] Save streaks to AsyncStorage + Supabase backup
    get().saveStreaks();
    supabase.from('user_streaks').upsert({
      user_id: userId,
      current_streak: newStreak,
      best_streak: newBest,
      last_activity_week: currentWeek,
      updated_at: now.toISOString(),
    }).then(() => {});

    // [CODE-16] No full reload — incremental update only
  },

  isTrailCompleted: (trailSlug) => {
    return get().completedTrailSlugs.includes(trailSlug);
  },
}));
