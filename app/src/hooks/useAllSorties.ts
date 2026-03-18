import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Sortie } from '@/types';

export function useAllSorties() {
  return useQuery({
    queryKey: ['sorties', 'all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sorties')
        .select('*, trail:trails!trail_id(name, slug, region, difficulty), organisateur:user_profiles!organisateur_id(username)')
        .eq('statut', 'ouvert')
        .eq('is_public', true)
        .gte('date_sortie', new Date().toISOString().split('T')[0])
        .order('date_sortie', { ascending: true });
      if (error) throw error;
      return data as Sortie[];
    },
    staleTime: 2 * 60 * 1000,
  });
}
