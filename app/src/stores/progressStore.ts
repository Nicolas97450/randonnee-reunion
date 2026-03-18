import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
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
}

interface ProgressState {
  completedTrailSlugs: string[];
  zoneProgress: ZoneProgress[];
  totalCompleted: number;
  totalTrails: number;
  overallProgress: number; // 0 to 1
  isLoading: boolean;

  loadProgress: (userId: string) => Promise<void>;
  validateTrail: (userId: string, trailSlug: string, method: 'gps' | 'manual') => Promise<void>;
  isTrailCompleted: (trailSlug: string) => boolean;
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
    const zoneSlug = REGION_TO_ZONE[trail.region];
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

export const useProgressStore = create<ProgressState>((set, get) => ({
  completedTrailSlugs: [],
  zoneProgress: [],
  totalCompleted: 0,
  totalTrails: 0,
  overallProgress: 0,
  isLoading: false,

  loadProgress: async (userId: string) => {
    set({ isLoading: true });
    try {
      // Fetch all trails (slug + region) and user completions in parallel
      const [trailsResult, activitiesResult] = await Promise.all([
        supabase.from('trails').select('slug, region'),
        supabase.from('user_activities').select('trail_id, trails(slug)').eq('user_id', userId),
      ]);

      if (trailsResult.error) throw trailsResult.error;
      if (activitiesResult.error) throw activitiesResult.error;

      const allTrails = (trailsResult.data ?? []) as TrailRegionCount[];
      const totalTrails = allTrails.length;

      const completedSlugs = (activitiesResult.data ?? [])
        .map((a: Record<string, unknown>) => {
          const trails = a.trails as { slug: string } | { slug: string }[] | null;
          if (Array.isArray(trails)) return trails[0]?.slug;
          return trails?.slug;
        })
        .filter((s): s is string => !!s);

      const zoneProgress = computeZoneProgress(allTrails, completedSlugs);

      set({
        completedTrailSlugs: completedSlugs,
        zoneProgress,
        totalCompleted: completedSlugs.length,
        totalTrails,
        overallProgress: totalTrails > 0 ? completedSlugs.length / totalTrails : 0,
        isLoading: false,
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

    const { error } = await supabase.from('user_activities').upsert({
      user_id: userId,
      trail_id: trail.id,
      validation_type: method,
      completed_at: new Date().toISOString(),
    }, {
      onConflict: 'user_id,trail_id',
    });

    if (!error) {
      const completedSlugs = [...get().completedTrailSlugs, trailSlug];
      const totalTrails = get().totalTrails || 710;
      // Re-fetch zone progress from stored data would be ideal,
      // but for now just update the count — full refresh on next loadProgress
      set({
        completedTrailSlugs: completedSlugs,
        totalCompleted: completedSlugs.length,
        overallProgress: totalTrails > 0 ? completedSlugs.length / totalTrails : 0,
      });
      // Trigger full refresh to update zone progress
      get().loadProgress(userId);
    }
  },

  isTrailCompleted: (trailSlug) => {
    return get().completedTrailSlugs.includes(trailSlug);
  },
}));
