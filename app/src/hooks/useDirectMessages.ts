import { useEffect, useState, useCallback, useRef } from 'react';
import { Alert } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

// ─── Types ───────────────────────────────────────────────────

export interface Conversation {
  id: string;
  user1_id: string;
  user2_id: string;
  last_message_at: string;
  created_at: string;
  /** The other user in the conversation */
  peer: { id: string; username: string | null; avatar_url: string | null };
  /** Preview of the last message */
  lastMessage?: string;
}

export interface DirectMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  sender?: { username: string | null; avatar_url: string | null };
  _optimistic?: boolean;
  _failed?: boolean;
}

// ─── Conversations list ──────────────────────────────────────

export function useConversations(userId: string | undefined) {
  return useQuery({
    queryKey: ['conversations', userId],
    queryFn: async () => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
        .order('last_message_at', { ascending: false });

      if (error) throw error;
      if (!data || data.length === 0) return [];

      // Get peer profiles + last message for each conversation
      const conversations: Conversation[] = await Promise.all(
        data.map(async (conv) => {
          const peerId = conv.user1_id === userId ? conv.user2_id : conv.user1_id;

          const [profileRes, msgRes] = await Promise.all([
            supabase.from('user_profiles').select('id, username, avatar_url').eq('id', peerId).single(),
            supabase
              .from('direct_messages')
              .select('content')
              .eq('conversation_id', conv.id)
              .order('created_at', { ascending: false })
              .limit(1)
              .single(),
          ]);

          return {
            id: conv.id,
            user1_id: conv.user1_id,
            user2_id: conv.user2_id,
            last_message_at: conv.last_message_at,
            created_at: conv.created_at,
            peer: profileRes.data ?? { id: peerId, username: null, avatar_url: null },
            lastMessage: msgRes.data?.content,
          };
        }),
      );

      return conversations;
    },
    enabled: !!userId,
    staleTime: 30 * 1000,
  });
}

// ─── Get or create conversation ──────────────────────────────

export function useGetOrCreateConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, peerId }: { userId: string; peerId: string }) => {
      // Ensure consistent ordering (user1_id < user2_id)
      const [user1, user2] = userId < peerId ? [userId, peerId] : [peerId, userId];

      // Check if conversation already exists
      const { data: existing } = await supabase
        .from('conversations')
        .select('id')
        .eq('user1_id', user1)
        .eq('user2_id', user2)
        .single();

      if (existing) return existing.id as string;

      // Create new conversation
      const { data, error } = await supabase
        .from('conversations')
        .insert({ user1_id: user1, user2_id: user2 })
        .select('id')
        .single();

      if (error) throw error;
      return data.id as string;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
    onError: () => {
      Alert.alert('Erreur', 'Impossible de demarrer la conversation.');
    },
  });
}

// ─── Messages in a conversation (with Realtime) ─────────────

export function useConversationMessages(conversationId: string | undefined, userId: string | undefined) {
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const optimisticMapRef = useRef<Map<string, string>>(new Map());
  const queryClient = useQueryClient();

  // Load existing messages
  useEffect(() => {
    if (!conversationId) return;
    setIsLoading(true);

    supabase
      .from('direct_messages')
      .select('*, sender:user_profiles!sender_id(username, avatar_url)')
      .eq('conversation_id', conversationId)
      // [F8] Reduced from 200 to 50 initial messages for performance
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({ data, error }) => {
        // Reverse to ascending order for display
        if (data) data.reverse();
        if (!error && data) {
          setMessages(data as DirectMessage[]);
        }
        setIsLoading(false);
      });
  }, [conversationId]);

  // Realtime subscription
  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`dm-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'direct_messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          const newMsg = payload.new as DirectMessage;

          // Check if this is our optimistic message
          const key = `${newMsg.sender_id}:${newMsg.content}`;
          const optimisticId = optimisticMapRef.current.get(key);

          if (optimisticId) {
            // Replace optimistic with confirmed
            optimisticMapRef.current.delete(key);
            setMessages((prev) =>
              prev.map((m) => (m.id === optimisticId ? { ...newMsg, _optimistic: false } : m)),
            );
          } else {
            // New message from other user
            // Fetch sender info
            const { data: profile } = await supabase
              .from('user_profiles')
              .select('username, avatar_url')
              .eq('id', newMsg.sender_id)
              .single();

            setMessages((prev) => {
              if (prev.some((m) => m.id === newMsg.id)) return prev;
              return [...prev, { ...newMsg, sender: profile ?? undefined }];
            });
          }

          // Refresh conversations list
          queryClient.invalidateQueries({ queryKey: ['conversations'] });
        },
      )
      .subscribe((status, err) => {
        if (err) console.error('[useDirectMessages] Realtime error:', err);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps -- queryClient ref is stable, only re-subscribe on conversationId change
  }, [conversationId]);

  // [D2] Rate limiting: max 5 messages per minute
  const messageTimestamps = useRef<number[]>([]);
  const RATE_LIMIT_MAX = 5;
  const RATE_LIMIT_WINDOW_MS = 60_000;

  // Send message
  const sendMessage = useCallback(
    async (content: string) => {
      if (!conversationId || !userId || !content.trim()) return;

      const trimmed = content.trim();

      // [D8] Client-side message length validation
      if (trimmed.length > 2000) {
        Alert.alert('Message trop long', 'Le message ne peut pas depasser 2000 caracteres.');
        return;
      }

      // [D4] Content moderation
      const { moderateContent } = await import('@/lib/moderation');
      const moderationError = moderateContent(trimmed);
      if (moderationError) {
        Alert.alert('Contenu inapproprie', moderationError);
        return;
      }

      // [D2] Rate limiting check
      const now = Date.now();
      messageTimestamps.current = messageTimestamps.current.filter(
        (t) => now - t < RATE_LIMIT_WINDOW_MS,
      );
      if (messageTimestamps.current.length >= RATE_LIMIT_MAX) {
        Alert.alert('Doucement', 'Attends un peu avant d\'envoyer le prochain message.');
        return;
      }
      messageTimestamps.current.push(now);
      const optimisticId = `__optimistic__${Date.now()}`;
      const key = `${userId}:${trimmed}`;
      optimisticMapRef.current.set(key, optimisticId);

      // Optimistic update
      setMessages((prev) => [
        ...prev,
        {
          id: optimisticId,
          conversation_id: conversationId,
          sender_id: userId,
          content: trimmed,
          created_at: new Date().toISOString(),
          _optimistic: true,
        },
      ]);

      const { error } = await supabase.from('direct_messages').insert({
        conversation_id: conversationId,
        sender_id: userId,
        content: trimmed,
      });

      if (error) {
        optimisticMapRef.current.delete(key);
        setMessages((prev) =>
          prev.map((m) => (m.id === optimisticId ? { ...m, _failed: true } : m)),
        );
      }
    },
    [conversationId, userId],
  );

  return { messages, isLoading, sendMessage };
}
