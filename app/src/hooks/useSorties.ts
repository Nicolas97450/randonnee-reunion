import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Sortie, SortieParticipant } from '@/types';

// Fetch sorties for a trail
export function useSortiesByTrail(trailId: string) {
  return useQuery({
    queryKey: ['sorties', 'trail', trailId],
    queryFn: async () => {
      const trailUuid = await resolveTrailId(trailId);
      const { data, error } = await supabase
        .from('sorties')
        .select('*, organisateur:user_profiles!organisateur_id(username, avatar_url)')
        .eq('trail_id', trailUuid)
        .eq('statut', 'ouvert')
        .gte('date_sortie', new Date().toISOString().split('T')[0])
        .order('date_sortie', { ascending: true })
        .limit(10);

      if (error) throw error;
      return data as Sortie[];
    },
    enabled: !!trailId,
  });
}

// Fetch user's sorties (organised + joined)
export function useMesSorties(userId: string | undefined) {
  return useQuery({
    queryKey: ['sorties', 'user', userId],
    queryFn: async () => {
      // Sorties organisees
      const { data: organised, error: e1 } = await supabase
        .from('sorties')
        .select('*, trail:trails!trail_id(name, slug, region, difficulty)')
        .eq('organisateur_id', userId!)
        .order('date_sortie', { ascending: true });

      if (e1) throw e1;

      // Sorties rejointes
      const { data: joined, error: e2 } = await supabase
        .from('sortie_participants')
        .select('sortie_id, statut, sorties:sorties!sortie_id(*, trail:trails!trail_id(name, slug, region, difficulty))')
        .eq('user_id', userId!)
        .eq('statut', 'accepte');

      if (e2) throw e2;

      return {
        organised: (organised ?? []) as Sortie[],
        joined: (joined ?? []).map((p: Record<string, unknown>) => p.sorties).filter(Boolean) as Sortie[],
      };
    },
    enabled: !!userId,
  });
}

// Fetch participants of a sortie
export function useSortieParticipants(sortieId: string) {
  return useQuery({
    queryKey: ['sorties', 'participants', sortieId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sortie_participants')
        .select('*, user:user_profiles!user_id(username, avatar_url)')
        .eq('sortie_id', sortieId)
        .order('joined_at', { ascending: true });

      if (error) throw error;
      return data as SortieParticipant[];
    },
    enabled: !!sortieId,
  });
}

// Resolve trail slug to UUID
async function resolveTrailId(slugOrId: string): Promise<string> {
  // If it's already a UUID format, return as-is
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-/.test(slugOrId)) return slugOrId;

  const { data, error } = await supabase
    .from('trails')
    .select('id')
    .eq('slug', slugOrId)
    .single();

  if (error || !data) throw new Error('Sentier introuvable');
  return data.id;
}

// Create a sortie
export function useCreateSortie() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sortie: {
      trail_id: string;
      organisateur_id: string;
      titre: string;
      description?: string;
      date_sortie: string;
      heure_depart: string;
      places_max: number;
      is_public: boolean;
    }) => {
      const trailUuid = await resolveTrailId(sortie.trail_id);
      const { data, error } = await supabase
        .from('sorties')
        .insert({ ...sortie, trail_id: trailUuid })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sorties'] });
    },
  });
}

// Join a sortie
export function useJoinSortie() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ sortieId, userId }: { sortieId: string; userId: string }) => {
      const { error } = await supabase
        .from('sortie_participants')
        .insert({ sortie_id: sortieId, user_id: userId, statut: 'en_attente' });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sorties'] });
    },
  });
}

// Accept/refuse a participant (organisateur only)
export function useUpdateParticipant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ participantId, statut }: { participantId: string; statut: 'accepte' | 'refuse' }) => {
      const { error } = await supabase
        .from('sortie_participants')
        .update({ statut })
        .eq('id', participantId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sorties'] });
    },
  });
}

// Cancel a sortie
export function useCancelSortie() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sortieId: string) => {
      const { error } = await supabase
        .from('sorties')
        .update({ statut: 'annule' })
        .eq('id', sortieId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sorties'] });
    },
  });
}
