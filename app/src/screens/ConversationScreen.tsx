import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  StyleSheet, Text, View, FlatList, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT_SIZE, SPACING, BORDER_RADIUS } from '@/constants';
import { useAuth } from '@/hooks/useAuth';
import { useConversationMessages, type DirectMessage } from '@/hooks/useDirectMessages';

interface Props {
  route: {
    params: {
      conversationId: string;
      peerUsername: string;
      peerId: string;
    };
  };
}

const MessageBubble = React.memo(function MessageBubble({
  message,
  isMe,
}: {
  message: DirectMessage;
  isMe: boolean;
}) {
  return (
    <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubblePeer]}>
      <Text style={[styles.bubbleText, isMe ? styles.bubbleTextMe : styles.bubbleTextPeer]}>
        {message.content}
      </Text>
      <View style={styles.bubbleMeta}>
        {message._failed && (
          <Ionicons name="alert-circle" size={12} color={COLORS.danger} />
        )}
        {message._optimistic && !message._failed && (
          <Ionicons name="time-outline" size={12} color={COLORS.textMuted} />
        )}
        <Text style={styles.bubbleTime}>
          {new Date(message.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    </View>
  );
});

export default function ConversationScreen({ route }: Props) {
  const { conversationId, peerUsername } = route.params;
  const { user } = useAuth();
  const [text, setText] = useState('');
  const [authorized, setAuthorized] = useState(true);
  const flatListRef = useRef<FlatList>(null);

  // [D5] Verify user is part of this conversation
  useEffect(() => {
    if (!conversationId || !user?.id) return;
    const { supabase } = require('@/lib/supabase');
    supabase
      .from('conversations')
      .select('user1_id, user2_id')
      .eq('id', conversationId)
      .single()
      .then(({ data }: { data: { user1_id: string; user2_id: string } | null }) => {
        if (!data || (data.user1_id !== user?.id && data.user2_id !== user?.id)) {
          setAuthorized(false);
        }
      });
  }, [conversationId, user?.id]);

  const { messages, isLoading, sendMessage } = useConversationMessages(
    authorized ? conversationId : undefined,
    user?.id,
  );

  // Auto-scroll on new message
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.length]);

  const handleSend = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed) return;
    sendMessage(trimmed);
    setText('');
  }, [text, sendMessage]);

  const renderItem = useCallback(
    ({ item }: { item: DirectMessage }) => (
      <MessageBubble message={item} isMe={item.sender_id === user?.id} />
    ),
    [user?.id],
  );

  const keyExtractor = useCallback((item: DirectMessage) => item.id, []);

  // [D5] Block access to unauthorized conversations
  if (!authorized) {
    return (
      <View style={styles.centered}>
        <Ionicons name="lock-closed" size={40} color={COLORS.textMuted} />
        <Text style={{ color: COLORS.textSecondary, marginTop: 12, fontSize: 15 }}>
          Conversation inaccessible
        </Text>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primaryLight} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      {messages.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="chatbubble-ellipses-outline" size={48} color={COLORS.textMuted} />
          <Text style={styles.emptyText}>
            Debut de ta conversation avec {peerUsername}
          </Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          style={styles.messageList}
          data={messages}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          contentContainerStyle={styles.messageListContent}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
          initialNumToRender={10}
          maxToRenderPerBatch={15}
          removeClippedSubviews={true}
        />
      )}

      {/* Input bar */}
      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          placeholder="Ton message..."
          placeholderTextColor={COLORS.textMuted}
          value={text}
          onChangeText={setText}
          maxLength={2000}
          returnKeyType="send"
          blurOnSubmit={false}
          onSubmitEditing={handleSend}
          accessibilityLabel="Ecrire un message"
        />
        <TouchableOpacity
          style={[styles.sendButton, !text.trim() && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!text.trim()}
          activeOpacity={0.6}
          accessibilityLabel="Envoyer le message"
        >
          <Ionicons
            name="send"
            size={20}
            color={text.trim() ? COLORS.white : COLORS.textMuted}
          />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: SPACING.md, padding: SPACING.xl },
  emptyText: { fontSize: FONT_SIZE.md, color: COLORS.textMuted, textAlign: 'center' },
  messageList: { flex: 1 },
  messageListContent: { padding: SPACING.md, paddingBottom: SPACING.sm },
  bubble: {
    maxWidth: '80%',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.sm,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
  },
  bubbleMe: {
    alignSelf: 'flex-end',
    backgroundColor: COLORS.primaryLight,
    borderBottomRightRadius: 4,
  },
  bubblePeer: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.surface,
    borderBottomLeftRadius: 4,
  },
  bubbleText: {
    fontSize: FONT_SIZE.md,
    lineHeight: 20,
  },
  bubbleTextMe: { color: COLORS.black },
  bubbleTextPeer: { color: COLORS.textPrimary },
  bubbleMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
    alignSelf: 'flex-end',
  },
  bubbleTime: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.surface,
    gap: SPACING.sm,
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: FONT_SIZE.md,
    color: COLORS.textPrimary,
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: COLORS.surfaceLight,
  },
});
