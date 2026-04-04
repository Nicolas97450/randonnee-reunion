import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT_SIZE, SPACING, BORDER_RADIUS } from '@/constants';
import { useSortieChat } from '@/hooks/useSortieChat';
import type { SortieMessage } from '@/types';

const OPTIMISTIC_PREFIX = '__optimistic__';

interface MessageBubbleProps {
  item: SortieMessage;
  isMe: boolean;
  onRetry: (id: string) => void;
}

const MessageBubble = React.memo(function MessageBubble({ item, isMe, onRetry }: MessageBubbleProps) {
  const username = item.user?.username ?? 'Anonyme';
  const isOptimistic = item.id.startsWith(OPTIMISTIC_PREFIX);
  const isFailed = (item as SortieMessage & { _failed?: boolean })._failed === true;
  const time = new Date(item.created_at).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <View style={[styles.messageBubble, isMe ? styles.myMessage : styles.otherMessage, isFailed && styles.failedMessage]}>
      {!isMe && <Text style={styles.username}>{username}</Text>}
      <Text style={[styles.messageText, isMe && styles.myMessageText]}>{item.contenu}</Text>
      <View style={styles.messageFooter}>
        {isFailed ? (
          <Pressable
            style={styles.retryRow}
            onPress={() => onRetry(item.id)}
            accessibilityLabel="Renvoyer le message"
          >
            <Ionicons name="alert-circle" size={12} color={COLORS.danger} />
            <Text style={styles.failedText}>Non envoye - Reessayer</Text>
          </Pressable>
        ) : isOptimistic ? (
          <View style={styles.sendingRow}>
            <Ionicons name="time-outline" size={10} color={COLORS.white + '80'} />
            <Text style={[styles.time, isMe && styles.myTime]}>Envoi...</Text>
          </View>
        ) : (
          <Text style={[styles.time, isMe && styles.myTime]}>{time}</Text>
        )}
      </View>
    </View>
  );
});

interface Props {
  sortieId: string;
  userId: string;
}

export default function SortieChat({ sortieId, userId }: Props) {
  const { messages, isLoading, sendMessage, retryMessage } = useSortieChat(sortieId, userId);
  const [input, setInput] = useState('');
  const flatListRef = useRef<FlatList>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0) {
      // Use requestAnimationFrame for smoother scroll timing
      requestAnimationFrame(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      });
    }
  }, [messages]);

  const handleSend = useCallback(() => {
    const text = input.trim();
    if (text) {
      setInput('');
      sendMessage(text);
    }
  }, [input, sendMessage]);

  const renderMessage = useCallback(
    ({ item }: { item: SortieMessage }) => (
      <MessageBubble item={item} isMe={item.user_id === userId} onRetry={retryMessage} />
    ),
    [userId, retryMessage],
  );

  const keyExtractor = useCallback((item: SortieMessage) => item.id, []);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.messagesList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="chatbubbles-outline" size={48} color={COLORS.textMuted} />
            <Text style={styles.emptyText}>
              {isLoading ? 'Chargement...' : 'Aucun message. Lance la conversation !'}
            </Text>
          </View>
        }
      />

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Ton message..."
          placeholderTextColor={COLORS.textMuted}
          value={input}
          onChangeText={setInput}
          onSubmitEditing={handleSend}
          returnKeyType="send"
          blurOnSubmit={false}
          maxLength={500}
          accessibilityLabel="Ecrire un message"
        />
        <Pressable
          style={[styles.sendButton, !input.trim() && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!input.trim()}
          accessibilityLabel="Envoyer le message"
        >
          <Ionicons name="send" size={20} color={COLORS.white} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  messagesList: { padding: SPACING.md, flexGrow: 1, justifyContent: 'flex-end' },
  messageBubble: {
    maxWidth: '80%',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.sm,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
  },
  myMessage: {
    backgroundColor: COLORS.primary,
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  otherMessage: {
    backgroundColor: COLORS.card,
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
  },
  failedMessage: {
    backgroundColor: COLORS.primary + 'AA',
    borderWidth: 1,
    borderColor: COLORS.danger,
  },
  username: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.primaryLight,
    fontWeight: '600',
    marginBottom: 2,
  },
  messageText: { fontSize: FONT_SIZE.md, color: COLORS.textPrimary, lineHeight: 20 },
  myMessageText: { color: COLORS.white },
  messageFooter: { alignSelf: 'flex-end', marginTop: 2 },
  time: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted },
  myTime: { color: COLORS.white + '99' },
  sendingRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  retryRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  failedText: { fontSize: FONT_SIZE.xs, color: COLORS.danger, fontWeight: '600' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: SPACING.md },
  emptyText: { fontSize: FONT_SIZE.md, color: COLORS.textMuted, textAlign: 'center' },
  inputRow: {
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
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.xl,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: FONT_SIZE.md,
    color: COLORS.textPrimary,
    maxHeight: 100,
  },
  sendButton: {
    width: SPACING.xxl,
    height: SPACING.xxl,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: { opacity: 0.4 },
});
