import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Sortie } from '@/types';

/**
 * Fetch all public sorties (future only, open status).
 */
export function useAllSorties() {
  return useQuery({
    queryKey: ['sorties', 'all'],
    queryFn: async () => {
      const today = new Date().toLocaleDateString('sv-SE');
      const { data, error } = await supabase
        .from('sorties')
        .select('*, trail:trails!trail_id(name, slug, region, difficulty), organisateur:user_profiles!organisateur_id(username)')
        .eq('statut', 'ouvert')
        .eq('is_public', true)
        .gte('date_sortie', today)
        .order('date_sortie', { ascending: true });
      if (error) throw error;
      return data as Sortie[];
    },
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Fetch sorties from friends (accepted friendships).
 * Returns future, open sorties organised by friends.
 */
export function useFriendsSorties(userId: string | undefined) {
  return useQuery({
    queryKey: ['sorties', 'friends', userId],
    queryFn: async () => {
      if (!userId) return [];
      const today = new Date().toLocaleDateString('sv-SE');

      // Get friend IDs
      const [asRequester, asAddressee] = await Promise.all([
        supabase
          .from('friendships')
          .select('addressee_id')
          .eq('requester_id', userId)
          .eq('status', 'accepted'),
        supabase
          .from('friendships')
          .select('requester_id')
          .eq('addressee_id', userId)
          .eq('status', 'accepted'),
      ]);

      // [F3] Typed instead of Record<string, unknown>
      const friendIds: string[] = [];
      (asRequester.data ?? []).forEach((f) => {
        friendIds.push((f as { addressee_id: string }).addressee_id);
      });
      (asAddressee.data ?? []).forEach((f) => {
        friendIds.push((f as { requester_id: string }).requester_id);
      });

      if (friendIds.length === 0) return [];

      const { data, error } = await supabase
        .from('sorties')
        .select('*, trail:trails!trail_id(name, slug, region, difficulty), organisateur:user_profiles!organisateur_id(username)')
        .in('organisateur_id', friendIds)
        .eq('statut', 'ouvert')
        .gte('date_sortie', today)
        .order('date_sortie', { ascending: true });

      if (error) throw error;
      return data as Sortie[];
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Fetch user's own sorties (organised + joined), future only.
 */
export function useMyUpcomingSorties(userId: string | undefined) {
  return useQuery({
    queryKey: ['sorties', 'mine', userId],
    queryFn: async () => {
      if (!userId) return [];
      const today = new Date().toLocaleDateString('sv-SE');

      // Sorties organisees (future only)
      const { data: organised, error: e1 } = await supabase
        .from('sorties')
        .select('*, trail:trails!trail_id(name, slug, region, difficulty), organisateur:user_profiles!organisateur_id(username)')
        .eq('organisateur_id', userId)
        .eq('statut', 'ouvert')
        .gte('date_sortie', today)
        .order('date_sortie', { ascending: true });

      if (e1) throw e1;

      // Sorties rejointes (future only)
      const { data: joined, error: e2 } = await supabase
        .from('sortie_participants')
        .select('sorties:sorties!sortie_id(*, trail:trails!trail_id(name, slug, region, difficulty), organisateur:user_profiles!organisateur_id(username))')
        .eq('user_id', userId)
        .eq('statut', 'accepte');

      if (e2) throw e2;

      const organisedList = (organised ?? []) as Sortie[];
      const joinedList = (joined ?? [])
        // [F3] Typed instead of Record<string, unknown>
        .map((p) => (p as { sorties: Sortie }).sorties)
        .filter(Boolean)
        .filter((s) => {
          const sortie = s as Sortie;
          return sortie.date_sortie >= today && sortie.statut === 'ouvert';
        }) as Sortie[];

      // Deduplicate by id
      const seen = new Set<string>();
      const all: Sortie[] = [];
      for (const s of [...organisedList, ...joinedList]) {
        if (!seen.has(s.id)) {
          seen.add(s.id);
          all.push(s);
        }
      }

      all.sort((a, b) => a.date_sortie.localeCompare(b.date_sortie));
      return all;
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
  });
}
