import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Alert } from 'react-native';
import { supabase } from '@/lib/supabase';

interface FriendProfile {
  id: string;
  username: string | null;
  avatar_url: string | null;
}

interface Friendship {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: string;
  created_at: string;
  friend: FriendProfile;
}

export function useFriends(userId: string | undefined) {
  return useQuery({
    queryKey: ['friends', userId],
    queryFn: async () => {
      if (!userId) return [];
      // Get friendships where user is requester or addressee and status is accepted
      const { data: asRequester } = await supabase
        .from('friendships')
        .select('id, addressee_id, created_at, addressee:user_profiles!addressee_id(id, username, avatar_url)')
        .eq('requester_id', userId)
        .eq('status', 'accepted');

      const { data: asAddressee } = await supabase
        .from('friendships')
        .select('id, requester_id, created_at, requester:user_profiles!requester_id(id, username, avatar_url)')
        .eq('addressee_id', userId)
        .eq('status', 'accepted');

      const friends: Friendship[] = [];
      (asRequester ?? []).forEach((f: Record<string, unknown>) => {
        const profile = f.addressee as FriendProfile | FriendProfile[];
        const p = Array.isArray(profile) ? profile[0] : profile;
        if (p) friends.push({ id: f.id as string, requester_id: userId, addressee_id: f.addressee_id as string, status: 'accepted', created_at: f.created_at as string, friend: p });
      });
      (asAddressee ?? []).forEach((f: Record<string, unknown>) => {
        const profile = f.requester as FriendProfile | FriendProfile[];
        const p = Array.isArray(profile) ? profile[0] : profile;
        if (p) friends.push({ id: f.id as string, requester_id: f.requester_id as string, addressee_id: userId, status: 'accepted', created_at: f.created_at as string, friend: p });
      });
      return friends;
    },
    enabled: !!userId,
  });
}

export function useFriendRequests(userId: string | undefined) {
  return useQuery({
    queryKey: ['friend-requests', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('friendships')
        .select('id, requester_id, created_at, requester:user_profiles!requester_id(id, username, avatar_url)')
        .eq('addressee_id', userId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data ?? []).map((r: Record<string, unknown>) => {
        const profile = r.requester as FriendProfile | FriendProfile[];
        const p = Array.isArray(profile) ? profile[0] : profile;
        return { id: r.id as string, requester_id: r.requester_id as string, created_at: r.created_at as string, user: p };
      });
    },
    enabled: !!userId,
  });
}

export function useSendFriendRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ requesterId, addresseeId }: { requesterId: string; addresseeId: string }) => {
      const { error } = await supabase.from('friendships').insert({
        requester_id: requesterId,
        addressee_id: addresseeId,
        status: 'pending',
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['friends'] });
      qc.invalidateQueries({ queryKey: ['friend-requests'] });
      Alert.alert('Demande envoyee !');
    },
    onError: () => Alert.alert('Erreur', 'Impossible d\'envoyer la demande.'),
  });
}

export function useRespondFriendRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ friendshipId, status }: { friendshipId: string; status: 'accepted' | 'declined' }) => {
      const { error } = await supabase.from('friendships').update({ status }).eq('id', friendshipId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['friends'] });
      qc.invalidateQueries({ queryKey: ['friend-requests'] });
    },
  });
}

export function useRemoveFriend() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (friendshipId: string) => {
      const { error } = await supabase.from('friendships').delete().eq('id', friendshipId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['friends'] }),
  });
}

export function useSearchUsers(query: string, currentUserId: string | undefined) {
  return useQuery({
    queryKey: ['search-users', query],
    queryFn: async () => {
      if (!query || query.length < 2) return [];
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, username, avatar_url')
        .ilike('username', `%${query}%`)
        .neq('id', currentUserId ?? '')
        .limit(20);
      if (error) throw error;
      return data as FriendProfile[];
    },
    enabled: query.length >= 2 && !!currentUserId,
  });
}
