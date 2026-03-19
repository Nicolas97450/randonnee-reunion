import { useState, useEffect, useCallback, useRef } from 'react';
import { Alert } from 'react-native';
import { supabase } from '@/lib/supabase';
import type { SortieMessage } from '@/types';

/** Temporary ID prefix to distinguish optimistic messages from server ones */
const OPTIMISTIC_PREFIX = '__optimistic__';

export function useSortieChat(sortieId: string, userId: string) {
  const [messages, setMessages] = useState<SortieMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  // Track which optimistic IDs map to which content, so Realtime can replace them
  const optimisticMapRef = useRef<Map<string, string>>(new Map());
  // Cache current user info for optimistic messages
  const userInfoRef = useRef<{ username: string | null; avatar_url: string | null }>({
    username: null,
    avatar_url: null,
  });

  // Load current user profile info (for optimistic messages)
  useEffect(() => {
    async function loadUserInfo() {
      const { data } = await supabase
        .from('user_profiles')
        .select('username, avatar_url')
        .eq('id', userId)
        .single();

      if (data) {
        userInfoRef.current = data;
      }
    }
    loadUserInfo();
  }, [userId]);

  // Load existing messages
  useEffect(() => {
    async function loadMessages() {
      const { data, error } = await supabase
        .from('sortie_messages')
        .select('*, user:user_profiles!user_id(username, avatar_url)')
        .eq('sortie_id', sortieId)
        .order('created_at', { ascending: true })
        .limit(100);

      if (!error && data) {
        setMessages(data as SortieMessage[]);
      }
      setIsLoading(false);
    }

    loadMessages();
  }, [sortieId]);

  // Subscribe to new messages (Realtime)
  useEffect(() => {
    const channel = supabase
      .channel(`sortie-chat-${sortieId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'sortie_messages',
          filter: `sortie_id=eq.${sortieId}`,
        },
        async (payload) => {
          const newRow = payload.new as Record<string, unknown>;
          const serverId = newRow.id as string;
          const serverUserId = newRow.user_id as string;
          const serverContenu = newRow.contenu as string;

          // Build full message with user info from payload
          // For messages from the current user, use cached user info to avoid extra fetch
          let userInfo: { username: string | null; avatar_url: string | null };
          if (serverUserId === userId) {
            userInfo = userInfoRef.current;
          } else {
            // Fetch user info for other users
            const { data: userData } = await supabase
              .from('user_profiles')
              .select('username, avatar_url')
              .eq('id', serverUserId)
              .single();
            userInfo = userData ?? { username: null, avatar_url: null };
          }

          const serverMessage: SortieMessage = {
            id: serverId,
            sortie_id: sortieId,
            user_id: serverUserId,
            contenu: serverContenu,
            created_at: newRow.created_at as string,
            user: userInfo,
          };

          setMessages((prev) => {
            // Check if this is a confirmation of an optimistic message we sent
            // Match by content + user_id to find the optimistic placeholder
            const optimisticKey = `${serverUserId}:${serverContenu}`;
            const optimisticId = optimisticMapRef.current.get(optimisticKey);

            if (optimisticId) {
              // Replace optimistic message with server-confirmed one
              optimisticMapRef.current.delete(optimisticKey);
              return prev.map((m) => (m.id === optimisticId ? serverMessage : m));
            }

            // Skip if we already have this exact server message (dedup)
            if (prev.some((m) => m.id === serverId)) return prev;

            return [...prev, serverMessage];
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sortieId, userId]);

  const sendMessage = useCallback(
    async (contenu: string) => {
      const trimmed = contenu.trim();
      if (!trimmed) return;
      if (trimmed.length > 500) {
        Alert.alert('Erreur', 'Le message est trop long (500 caracteres max).');
        return;
      }

      // --- Optimistic update: add the message to state immediately ---
      const optimisticId = `${OPTIMISTIC_PREFIX}${Date.now()}_${Math.random()}`;
      const optimisticMessage: SortieMessage = {
        id: optimisticId,
        sortie_id: sortieId,
        user_id: userId,
        contenu: trimmed,
        created_at: new Date().toISOString(),
        user: userInfoRef.current,
      };

      // Track this optimistic message so Realtime can replace it
      const optimisticKey = `${userId}:${trimmed}`;
      optimisticMapRef.current.set(optimisticKey, optimisticId);

      setMessages((prev) => [...prev, optimisticMessage]);

      // --- Send to Supabase in parallel ---
      const { error } = await supabase.from('sortie_messages').insert({
        sortie_id: sortieId,
        user_id: userId,
        contenu: trimmed,
      });

      if (error) {
        // Mark the optimistic message as failed
        optimisticMapRef.current.delete(optimisticKey);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === optimisticId
              ? { ...m, _failed: true } as SortieMessage & { _failed: boolean }
              : m,
          ),
        );
        Alert.alert('Erreur', 'Message non envoye. Verifie ta connexion.');
      }
    },
    [sortieId, userId],
  );

  const retryMessage = useCallback(
    async (failedMessageId: string) => {
      const failedMsg = messages.find((m) => m.id === failedMessageId);
      if (!failedMsg) return;

      // Remove the failed message
      setMessages((prev) => prev.filter((m) => m.id !== failedMessageId));

      // Resend it
      await sendMessage(failedMsg.contenu);
    },
    [messages, sendMessage],
  );

  return { messages, isLoading, sendMessage, retryMessage };
}
