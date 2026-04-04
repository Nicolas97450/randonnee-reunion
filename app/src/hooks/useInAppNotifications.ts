import { useEffect, useRef, useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { COLORS } from '@/constants/theme';
import type { RealtimeChannel } from '@supabase/supabase-js';

// ─── Types ───────────────────────────────────────────────────

export type NotificationType =
  | 'friend_request'
  | 'friend_accepted'
  | 'direct_message'
  | 'sortie_join'
  | 'sortie_accepted'
  | 'sortie_message';

export interface InAppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  /** Color for the left border accent */
  color: string;
  /** Ionicons icon name */
  icon: string;
  /** Navigation payload when tapped */
  navigation?: {
    screen: string;
    params?: Record<string, unknown>;
  };
  createdAt: number;
}

// ─── Color / icon mapping ────────────────────────────────────

const TYPE_META: Record<NotificationType, { color: string; icon: string }> = {
  friend_request: { color: COLORS.notifFriendRequest, icon: 'person-add' },
  friend_accepted: { color: COLORS.notifFriendAccepted, icon: 'people' },
  direct_message: { color: COLORS.notifDM, icon: 'chatbubble' },
  sortie_join: { color: COLORS.notifSortie, icon: 'walk' },
  sortie_accepted: { color: COLORS.notifFriendAccepted, icon: 'checkmark-circle' },
  sortie_message: { color: COLORS.notifSortie, icon: 'chatbubbles' },
};

// ─── Helper: fetch username by id ────────────────────────────

async function fetchUsername(userId: string): Promise<string> {
  const { data } = await supabase
    .from('user_profiles')
    .select('username')
    .eq('id', userId)
    .single();
  return data?.username ?? 'Quelqu\'un';
}

// ─── Hook ────────────────────────────────────────────────────

export function useInAppNotifications() {
  const { user } = useAuth();
  const userId = user?.id;
  const queryClient = useQueryClient();

  const [queue, setQueue] = useState<InAppNotification[]>([]);
  const [currentNotification, setCurrentNotification] = useState<InAppNotification | null>(null);
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [readCount, setReadCount] = useState(0);
  const channelsRef = useRef<RealtimeChannel[]>([]);
  const processingRef = useRef(false);

  const unreadCount = notifications.length - readCount;

  // ── Push a notification into the queue ──
  const enqueue = useCallback((notif: Omit<InAppNotification, 'id' | 'createdAt'>) => {
    const full: InAppNotification = {
      ...notif,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      createdAt: Date.now(),
    };
    setQueue((prev) => [...prev, full]);
    setNotifications((prev) => [full, ...prev]);
  }, []);

  // ── Process queue: show next notification ──
  useEffect(() => {
    if (processingRef.current || queue.length === 0) return;

    processingRef.current = true;
    const next = queue[0];
    setCurrentNotification(next);
    setQueue((prev) => prev.slice(1));

    // Auto-dismiss after 4s — component will call dismiss() or this timeout fires
    const timer = setTimeout(() => {
      setCurrentNotification(null);
      processingRef.current = false;
    }, 4500);

    return () => clearTimeout(timer);
  }, [queue, currentNotification]);

  // ── Dismiss current notification ──
  const dismiss = useCallback(() => {
    setCurrentNotification(null);
    processingRef.current = false;
  }, []);

  // ── Mark all notifications as read ──
  const markAllRead = useCallback(() => {
    setReadCount(notifications.length);
  }, [notifications.length]);

  // ── Subscribe to Realtime channels ──
  useEffect(() => {
    if (!userId) return;

    const channels: RealtimeChannel[] = [];

    // 1. Friend request received (INSERT on friendships where addressee_id = me)
    const friendReqChannel = supabase
      .channel('notif-friend-req')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'friendships',
          filter: `addressee_id=eq.${userId}`,
        },
        async (payload) => {
          const row = payload.new as { requester_id: string; status: string };
          if (row.status !== 'pending') return;
          const name = await fetchUsername(row.requester_id);
          enqueue({
            type: 'friend_request',
            title: 'Nouvelle demande d\'ami',
            body: `${name} veut etre ton ami`,
            ...TYPE_META.friend_request,
            navigation: {
              screen: 'SocialTab',
              params: { screen: 'Friends' },
            },
          });
          queryClient.invalidateQueries({ queryKey: ['friend-requests'] });
        },
      )
      .subscribe();
    channels.push(friendReqChannel);

    // 2. Friend request accepted (UPDATE on friendships where requester_id = me)
    const friendAccChannel = supabase
      .channel('notif-friend-acc')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'friendships',
          filter: `requester_id=eq.${userId}`,
        },
        async (payload) => {
          const row = payload.new as { addressee_id: string; status: string };
          if (row.status !== 'accepted') return;
          const name = await fetchUsername(row.addressee_id);
          enqueue({
            type: 'friend_accepted',
            title: 'Demande acceptee',
            body: `${name} a accepte ta demande`,
            ...TYPE_META.friend_accepted,
            navigation: {
              screen: 'SocialTab',
              params: { screen: 'Friends' },
            },
          });
          queryClient.invalidateQueries({ queryKey: ['friends'] });
          queryClient.invalidateQueries({ queryKey: ['friend-requests'] });
        },
      )
      .subscribe();
    channels.push(friendAccChannel);

    // 3. Direct message received (INSERT on direct_messages)
    //    We listen globally and filter out our own messages
    const dmChannel = supabase
      .channel('notif-dm')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'direct_messages',
        },
        async (payload) => {
          const row = payload.new as {
            sender_id: string;
            conversation_id: string;
            content: string;
          };
          // Ignore own messages
          if (row.sender_id === userId) return;

          // Check if user is part of this conversation
          const { data: conv } = await supabase
            .from('conversations')
            .select('user1_id, user2_id')
            .eq('id', row.conversation_id)
            .single();

          if (!conv) return;
          if (conv.user1_id !== userId && conv.user2_id !== userId) return;

          const name = await fetchUsername(row.sender_id);
          const preview =
            row.content.length > 40 ? row.content.slice(0, 40) + '...' : row.content;

          enqueue({
            type: 'direct_message',
            title: 'Nouveau message',
            body: `${name} : ${preview}`,
            ...TYPE_META.direct_message,
            navigation: {
              screen: 'SocialTab',
              params: {
                screen: 'Conversation',
                params: {
                  conversationId: row.conversation_id,
                  peerUsername: name,
                  peerId: row.sender_id,
                },
              },
            },
          });
          queryClient.invalidateQueries({ queryKey: ['conversations'] });
        },
      )
      .subscribe();
    channels.push(dmChannel);

    // 4. Someone wants to join my sortie (INSERT on sortie_participants)
    const sortieJoinChannel = supabase
      .channel('notif-sortie-join')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'sortie_participants',
        },
        async (payload) => {
          const row = payload.new as {
            user_id: string;
            sortie_id: string;
            statut: string;
          };
          // Don't notify for own participation
          if (row.user_id === userId) return;

          // Check if I'm the organizer
          const { data: sortie } = await supabase
            .from('sorties')
            .select('organisateur_id, titre')
            .eq('id', row.sortie_id)
            .single();

          if (!sortie || sortie.organisateur_id !== userId) return;

          const name = await fetchUsername(row.user_id);
          enqueue({
            type: 'sortie_join',
            title: 'Demande de participation',
            body: `${name} veut rejoindre "${sortie.titre}"`,
            ...TYPE_META.sortie_join,
          });
          queryClient.invalidateQueries({ queryKey: ['sortie-participants'] });
        },
      )
      .subscribe();
    channels.push(sortieJoinChannel);

    // 5. My sortie participation got accepted (UPDATE on sortie_participants where user_id = me)
    const sortieAccChannel = supabase
      .channel('notif-sortie-acc')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'sortie_participants',
          filter: `user_id=eq.${userId}`,
        },
        async (payload) => {
          const row = payload.new as { sortie_id: string; statut: string };
          if (row.statut !== 'accepte') return;

          const { data: sortie } = await supabase
            .from('sorties')
            .select('titre')
            .eq('id', row.sortie_id)
            .single();

          enqueue({
            type: 'sortie_accepted',
            title: 'Participation acceptee',
            body: `Tu as ete accepte pour "${sortie?.titre ?? 'une sortie'}"`,
            ...TYPE_META.sortie_accepted,
          });
          queryClient.invalidateQueries({ queryKey: ['sortie-participants'] });
        },
      )
      .subscribe();
    channels.push(sortieAccChannel);

    // 6. New message in a sortie group chat (INSERT on sortie_messages)
    const sortieMsgChannel = supabase
      .channel('notif-sortie-msg')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'sortie_messages',
        },
        async (payload) => {
          const row = payload.new as {
            user_id: string;
            sortie_id: string;
            contenu: string;
          };
          if (row.user_id === userId) return;

          // Check if I'm a participant or organizer of this sortie
          const [participantRes, sortieRes] = await Promise.all([
            supabase
              .from('sortie_participants')
              .select('id')
              .eq('sortie_id', row.sortie_id)
              .eq('user_id', userId)
              .eq('statut', 'accepte')
              .maybeSingle(),
            supabase
              .from('sorties')
              .select('organisateur_id, titre')
              .eq('id', row.sortie_id)
              .single(),
          ]);

          const isParticipant = !!participantRes.data;
          const isOrganizer = sortieRes.data?.organisateur_id === userId;
          if (!isParticipant && !isOrganizer) return;

          const name = await fetchUsername(row.user_id);
          const preview = row.contenu.length > 40 ? row.contenu.slice(0, 40) + '...' : row.contenu;

          enqueue({
            type: 'sortie_message',
            title: sortieRes.data?.titre ?? 'Chat sortie',
            body: `${name} : ${preview}`,
            ...TYPE_META.sortie_message,
          });
        },
      )
      .subscribe();
    channels.push(sortieMsgChannel);

    channelsRef.current = channels;

    return () => {
      channels.forEach((ch) => supabase.removeChannel(ch));
      channelsRef.current = [];
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps -- enqueue is stable (useCallback with []), queryClient ref is stable
  }, [userId]);

  return { currentNotification, dismiss, notifications, unreadCount, markAllRead };
}
