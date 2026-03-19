import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface TrailReview {
  id: string;
  trail_id: string;
  user_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  user?: { username: string };
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

// Recuperer les avis d'un sentier
export function useTrailReviews(slug: string) {
  return useQuery({
    queryKey: ['trail-reviews', slug],
    queryFn: async () => {
      const trailUuid = await resolveTrailId(slug);
      const { data, error } = await supabase
        .from('trail_reviews')
        .select('*, user:user_profiles!user_id(username)')
        .eq('trail_id', trailUuid)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as TrailReview[];
    },
    enabled: !!slug,
    staleTime: 5 * 60 * 1000,
  });
}

// Note moyenne d'un sentier
export function useAverageRating(slug: string) {
  return useQuery({
    queryKey: ['trail-avg-rating', slug],
    queryFn: async () => {
      const trailUuid = await resolveTrailId(slug);
      const { data, error } = await supabase
        .from('trail_reviews')
        .select('rating')
        .eq('trail_id', trailUuid);

      if (error) throw error;
      if (!data || data.length === 0) return { average: 0, count: 0 };

      const sum = data.reduce((acc, r) => acc + r.rating, 0);
      return {
        average: Math.round((sum / data.length) * 10) / 10,
        count: data.length,
      };
    },
    enabled: !!slug,
    staleTime: 5 * 60 * 1000,
  });
}

// Creer ou mettre a jour un avis
export function useCreateReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      slug: string;
      userId: string;
      rating: number;
      comment?: string;
    }) => {
      const trailUuid = await resolveTrailId(params.slug);
      const { data, error } = await supabase
        .from('trail_reviews')
        .upsert(
          {
            trail_id: trailUuid,
            user_id: params.userId,
            rating: params.rating,
            comment: params.comment || null,
          },
          { onConflict: 'trail_id,user_id' },
        )
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['trail-reviews', variables.slug] });
      queryClient.invalidateQueries({ queryKey: ['trail-avg-rating', variables.slug] });
    },
  });
}
