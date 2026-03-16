import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { SortieMessage } from '@/types';

export function useSortieChat(sortieId: string, userId: string) {
  const [messages, setMessages] = useState<SortieMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
          // Fetch the full message with user info
          const { data } = await supabase
            .from('sortie_messages')
            .select('*, user:user_profiles!user_id(username, avatar_url)')
            .eq('id', payload.new.id)
            .single();

          if (data) {
            setMessages((prev) => [...prev, data as SortieMessage]);
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sortieId]);

  const sendMessage = useCallback(
    async (contenu: string) => {
      if (!contenu.trim()) return;

      const { error } = await supabase.from('sortie_messages').insert({
        sortie_id: sortieId,
        user_id: userId,
        contenu: contenu.trim(),
      });

      if (error) {
        console.error('Failed to send message:', error);
      }
    },
    [sortieId, userId],
  );

  return { messages, isLoading, sendMessage };
}
