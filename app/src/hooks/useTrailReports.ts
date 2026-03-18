import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { TrailReport, ReportType } from '@/types';

// Recuperer les signalements actifs pour un sentier
export function useTrailReports(trailId: string) {
  return useQuery({
    queryKey: ['trail-reports', trailId],
    queryFn: async () => {
      const trailUuid = await resolveTrailId(trailId);
      const { data, error } = await supabase
        .from('trail_reports')
        .select('*, user:user_profiles!user_id(username)')
        .eq('trail_id', trailUuid)
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data as TrailReport[];
    },
    enabled: !!trailId,
    staleTime: 5 * 60 * 1000, // 5 min
  });
}

// Resolve trail slug to UUID
async function resolveTrailId(slugOrId: string): Promise<string> {
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-/.test(slugOrId)) return slugOrId;
  const { data, error } = await supabase
    .from('trails')
    .select('id')
    .eq('slug', slugOrId)
    .single();
  if (error || !data) throw new Error('Sentier introuvable');
  return data.id;
}

// Creer un signalement
export function useCreateReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (report: {
      trail_id: string;
      user_id: string;
      report_type: ReportType;
      message?: string;
      latitude: number;
      longitude: number;
    }) => {
      const trailUuid = await resolveTrailId(report.trail_id);
      const { data, error } = await supabase
        .from('trail_reports')
        .insert({
          ...report,
          trail_id: trailUuid,
          expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['trail-reports', variables.trail_id] });
    },
  });
}

// Compter les signalements actifs par sentier (pour la liste)
export function useReportCounts(trailIds: string[]) {
  return useQuery({
    queryKey: ['report-counts', trailIds],
    queryFn: async () => {
      // Resolve all slugs to UUIDs
      const uuidMap: Record<string, string> = {};
      const uuids: string[] = [];
      for (const slugOrId of trailIds) {
        const uuid = await resolveTrailId(slugOrId);
        uuidMap[uuid] = slugOrId;
        uuids.push(uuid);
      }

      const { data, error } = await supabase
        .from('trail_reports')
        .select('trail_id')
        .in('trail_id', uuids)
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString());

      if (error) throw error;

      // Map back to original slug keys so callers get counts by slug
      const counts: Record<string, number> = {};
      for (const row of data ?? []) {
        const slug = uuidMap[row.trail_id] ?? row.trail_id;
        counts[slug] = (counts[slug] ?? 0) + 1;
      }
      return counts;
    },
    enabled: trailIds.length > 0,
    staleTime: 5 * 60 * 1000,
  });
}
