import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

interface CommunityChallenge {
  id: string;
  title: string;
  description: string | null;
  target_km: number;
  current_km: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
  progressPercent: number;
}

async function fetchActiveChallenges(): Promise<CommunityChallenge[]> {
  const { data, error } = await supabase
    .from('community_challenges')
    .select('*')
    .eq('is_active', true)
    .order('start_date', { ascending: false });

  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    target_km: row.target_km,
    current_km: row.current_km,
    start_date: row.start_date,
    end_date: row.end_date,
    is_active: row.is_active,
    progressPercent:
      row.target_km > 0
        ? Math.min(100, Math.round((row.current_km / row.target_km) * 100))
        : 0,
  }));
}

export function useCommunityChallenge() {
  const {
    data: challenges = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['community-challenges'],
    queryFn: fetchActiveChallenges,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return { challenges, isLoading, error, refetch };
}

export type { CommunityChallenge };
