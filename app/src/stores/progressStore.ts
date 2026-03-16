import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { MOCK_TRAILS } from '@/lib/mockTrails';
import { REGION_TO_ZONE, ZONES } from '@/lib/zones';

interface ZoneProgress {
  zoneSlug: string;
  zoneName: string;
  completedTrails: number;
  totalTrails: number;
  progress: number; // 0 to 1
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

function computeZoneProgress(completedSlugs: string[]): ZoneProgress[] {
  // Count trails per zone
  const zoneCounts: Record<string, { total: number; completed: number }> = {};

  for (const zone of ZONES) {
    zoneCounts[zone.slug] = { total: 0, completed: 0 };
  }

  for (const trail of MOCK_TRAILS) {
    const zoneSlug = REGION_TO_ZONE[trail.region];
    if (zoneSlug && zoneCounts[zoneSlug]) {
      zoneCounts[zoneSlug].total += 1;
      if (completedSlugs.includes(trail.slug)) {
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
  totalTrails: MOCK_TRAILS.length,
  overallProgress: 0,
  isLoading: false,

  loadProgress: async (userId: string) => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase
        .from('user_activities')
        .select('trail_id, trails(slug)')
        .eq('user_id', userId);

      if (error) throw error;

      const completedSlugs = (data ?? [])
        .map((a: Record<string, unknown>) => {
          const trails = a.trails as { slug: string } | { slug: string }[] | null;
          if (Array.isArray(trails)) return trails[0]?.slug;
          return trails?.slug;
        })
        .filter((s): s is string => !!s);

      const zoneProgress = computeZoneProgress(completedSlugs);

      set({
        completedTrailSlugs: completedSlugs,
        zoneProgress,
        totalCompleted: completedSlugs.length,
        overallProgress: completedSlugs.length / MOCK_TRAILS.length,
        isLoading: false,
      });
    } catch {
      set({ isLoading: false });
    }
  },

  validateTrail: async (userId, trailSlug, method) => {
    // Find trail ID from slug
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
      const zoneProgress = computeZoneProgress(completedSlugs);

      set({
        completedTrailSlugs: completedSlugs,
        zoneProgress,
        totalCompleted: completedSlugs.length,
        overallProgress: completedSlugs.length / MOCK_TRAILS.length,
      });
    }
  },

  isTrailCompleted: (trailSlug) => {
    return get().completedTrailSlugs.includes(trailSlug);
  },
}));
