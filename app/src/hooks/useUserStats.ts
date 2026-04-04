import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { getHikerLevel, getEarnedBadges, type UserStats, type Badge, type HikerLevel } from '@/lib/badges';

export interface UserStatsResult {
  totalTrails: number;
  totalKm: number;
  totalElevation: number;
  hikerLevel: HikerLevel;
  earnedBadges: Badge[];
}

export function useUserFullStats(userId: string) {
  return useQuery({
    queryKey: ['user-full-stats', userId],
    queryFn: async (): Promise<UserStatsResult> => {
      // Fetch all user activities with trail data
      const { data, error } = await supabase
        .from('user_activities')
        .select('trail_id, completed_at, trails(slug, distance_km, elevation_gain, region)')
        .eq('user_id', userId);

      if (error) throw error;

      const activities = data ?? [];
      const totalTrails = activities.length;

      let totalKm = 0;
      let totalElevation = 0;
      const regionsVisited = new Set<string>();

      for (const activity of activities) {
        const trail = activity.trails as unknown as {
          slug: string;
          distance_km?: number;
          elevation_gain?: number;
          region?: string;
        } | null;

        if (trail) {
          totalKm += trail.distance_km ?? 0;
          totalElevation += trail.elevation_gain ?? 0;
          if (trail.region) {
            regionsVisited.add(trail.region);
          }
        }
      }

      totalKm = Math.round(totalKm * 10) / 10;
      totalElevation = Math.round(totalElevation);

      const hikerLevel = getHikerLevel(totalTrails);

      // Build UserStats for badge evaluation
      const completionTimestamps = activities
        .map((a) => (a.completed_at as string) ?? '')
        .filter((ts): ts is string => !!ts);

      const userStats: UserStats = {
        totalTrails,
        totalKm,
        totalElevation,
        zonesCompleted: 0,
        totalZones: 0,
        regionsVisited: Array.from(regionsVisited),
        maxElevationTrail: 0,
        sorties_created: 0,
        reports_submitted: 0,
        regionsFullyCompleted: [],
        completionTimestamps,
      };

      const earnedBadges = getEarnedBadges(userStats);

      return {
        totalTrails,
        totalKm,
        totalElevation,
        hikerLevel,
        earnedBadges,
      };
    },
  });
}
