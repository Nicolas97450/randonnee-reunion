import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';

export interface FriendStory {
  user_id: string;
  username: string | null;
  avatar_url: string | null;
  last_activity_at: string;
  is_recent: boolean; // activite < 24h
}

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const SEVEN_DAYS_MS = 7 * ONE_DAY_MS;

/**
 * Retourne la liste des amis ayant eu une activite dans les 7 derniers jours.
 * Bordure verte si < 24h, grise sinon.
 */
export function useFriendStories() {
  const currentUserId = useAuthStore((s) => s.user?.id);

  return useQuery({
    queryKey: ['friend-stories', currentUserId],
    queryFn: async (): Promise<FriendStory[]> => {
      if (!currentUserId) return [];

      // 1. Recuperer les IDs des amis
      const [asRequester, asAddressee] = await Promise.all([
        supabase
          .from('friendships')
          .select('addressee_id')
          .eq('requester_id', currentUserId)
          .eq('status', 'accepted'),
        supabase
          .from('friendships')
          .select('requester_id')
          .eq('addressee_id', currentUserId)
          .eq('status', 'accepted'),
      ]);

      const friendIds: string[] = [
        ...(asRequester.data ?? []).map((f: Record<string, unknown>) => f.addressee_id as string),
        ...(asAddressee.data ?? []).map((f: Record<string, unknown>) => f.requester_id as string),
      ];

      if (friendIds.length === 0) return [];

      // 2. Recuperer les activites recentes (7 jours) de ces amis
      const sevenDaysAgo = new Date(Date.now() - SEVEN_DAYS_MS).toISOString();

      const { data: activities, error } = await supabase
        .from('user_activities')
        .select('user_id, completed_at')
        .in('user_id', friendIds)
        .gte('completed_at', sevenDaysAgo)
        .order('completed_at', { ascending: false });

      if (error) throw error;

      // 3. Garder la derniere activite par ami
      const latestByUser = new Map<string, string>();
      for (const act of activities ?? []) {
        const uid = act.user_id as string;
        if (!latestByUser.has(uid)) {
          latestByUser.set(uid, act.completed_at as string);
        }
      }

      if (latestByUser.size === 0) return [];

      // 4. Recuperer les profils
      const activeIds = Array.from(latestByUser.keys());
      const { data: profiles, error: profileErr } = await supabase
        .from('user_profiles')
        .select('id, username, avatar_url')
        .in('id', activeIds);

      if (profileErr) throw profileErr;

      const now = Date.now();

      const stories: FriendStory[] = (profiles ?? []).map((p: Record<string, unknown>) => {
        const lastAt = latestByUser.get(p.id as string) ?? '';
        const diffMs = now - new Date(lastAt).getTime();

        return {
          user_id: p.id as string,
          username: p.username as string | null,
          avatar_url: p.avatar_url as string | null,
          last_activity_at: lastAt,
          is_recent: diffMs < ONE_DAY_MS,
        };
      });

      // Trier : recents d'abord, puis par date
      stories.sort((a, b) => {
        if (a.is_recent !== b.is_recent) return a.is_recent ? -1 : 1;
        return new Date(b.last_activity_at).getTime() - new Date(a.last_activity_at).getTime();
      });

      return stories;
    },
    enabled: !!currentUserId,
    staleTime: 60 * 1000, // 1 min
  });
}
