import { useRef, useEffect, useState } from 'react';
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

interface Props {
  sortieId: string;
  userId: string;
}

export default function SortieChat({ sortieId, userId }: Props) {
  const { messages, isLoading, sendMessage } = useSortieChat(sortieId, userId);
  const [input, setInput] = useState('');
  const flatListRef = useRef<FlatList>(null);

  // Auto-scroll to bottom on new message
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.length]);

  const handleSend = () => {
    if (input.trim()) {
      sendMessage(input);
      setInput('');
    }
  };

  const renderMessage = ({ item }: { item: SortieMessage }) => {
    const isMe = item.user_id === userId;
    const username = item.user?.username ?? 'Anonyme';
    const time = new Date(item.created_at).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });

    return (
      <View style={[styles.messageBubble, isMe ? styles.myMessage : styles.otherMessage]}>
        {!isMe && <Text style={styles.username}>{username}</Text>}
        <Text style={[styles.messageText, isMe && styles.myMessageText]}>{item.contenu}</Text>
        <Text style={[styles.time, isMe && styles.myTime]}>{time}</Text>
      </View>
    );
  };

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
        keyExtractor={(item) => item.id}
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
          multiline
          maxLength={500}
        />
        <Pressable
          style={[styles.sendButton, !input.trim() && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!input.trim()}
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
  username: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.primaryLight,
    fontWeight: '600',
    marginBottom: 2,
  },
  messageText: { fontSize: FONT_SIZE.md, color: COLORS.textPrimary, lineHeight: 20 },
  myMessageText: { color: COLORS.white },
  time: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted, alignSelf: 'flex-end', marginTop: 2 },
  myTime: { color: 'rgba(255,255,255,0.6)' },
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
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: { opacity: 0.4 },
});
