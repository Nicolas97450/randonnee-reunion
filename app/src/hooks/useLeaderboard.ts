import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';

export interface LeaderboardEntry {
  user_id: string;
  username: string | null;
  avatar_url: string | null;
  trails_completed: number;
  total_distance_km: number;
  rank: number;
}

const LEADERBOARD_STALE_TIME = 5 * 60 * 1000; // 5 min

/**
 * Retourne le top 10 des randonneurs par nombre de sentiers completes.
 *
 * NOTE : la RLS sur user_activities limite le SELECT a auth.uid() = user_id.
 * Pour que ce leaderboard fonctionne, il faut soit :
 *   - Ajouter une policy SELECT publique sur user_activities
 *   - Soit creer une fonction RPC Supabase (SECURITY DEFINER) qui agrege les stats.
 *
 * Exemple de RPC a deployer :
 *   CREATE OR REPLACE FUNCTION get_leaderboard(lim INT DEFAULT 10)
 *   RETURNS TABLE(user_id UUID, username TEXT, avatar_url TEXT,
 *                 trails_completed BIGINT, total_distance_km NUMERIC) AS $$
 *     SELECT ua.user_id, up.username, up.avatar_url,
 *            COUNT(DISTINCT ua.trail_id) AS trails_completed,
 *            COALESCE(SUM(t.distance_km), 0) AS total_distance_km
 *     FROM user_activities ua
 *     JOIN user_profiles up ON up.id = ua.user_id
 *     JOIN trails t ON t.id = ua.trail_id
 *     GROUP BY ua.user_id, up.username, up.avatar_url
 *     ORDER BY trails_completed DESC
 *     LIMIT lim;
 *   $$ LANGUAGE sql SECURITY DEFINER;
 */
export function useLeaderboard() {
  const currentUserId = useAuthStore((s) => s.user?.id);

  return useQuery({
    queryKey: ['leaderboard'],
    queryFn: async (): Promise<LeaderboardEntry[]> => {
      // Appel RPC — renvoie le top 10 agrege
      const { data, error } = await supabase.rpc('get_leaderboard', { lim: 10 });

      if (error) throw error;

      const entries = (data ?? []) as Array<{
        user_id: string;
        username: string | null;
        avatar_url: string | null;
        trails_completed: number;
        total_distance_km: number;
      }>;

      return entries.map((entry, index) => ({
        ...entry,
        total_distance_km: Number(entry.total_distance_km),
        rank: index + 1,
      }));
    },
    staleTime: LEADERBOARD_STALE_TIME,
  });
}

/**
 * Retourne le rang de l'utilisateur courant s'il n'est pas dans le top 10.
 */
export function useCurrentUserRank() {
  const currentUserId = useAuthStore((s) => s.user?.id);

  return useQuery({
    queryKey: ['leaderboard-my-rank', currentUserId],
    queryFn: async (): Promise<LeaderboardEntry | null> => {
      if (!currentUserId) return null;

      const { data, error } = await supabase.rpc('get_user_rank', {
        uid: currentUserId,
      });

      if (error) throw error;

      const row = Array.isArray(data) ? data[0] : data;
      if (!row) return null;

      return {
        user_id: row.user_id as string,
        username: row.username as string | null,
        avatar_url: row.avatar_url as string | null,
        trails_completed: Number(row.trails_completed),
        total_distance_km: Number(row.total_distance_km),
        rank: Number(row.rank),
      };
    },
    enabled: !!currentUserId,
    staleTime: LEADERBOARD_STALE_TIME,
  });
}
