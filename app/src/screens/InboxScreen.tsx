import React, { useState, useEffect, useRef, useCallback } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, Pressable, Image, ActivityIndicator, TextInput, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { COLORS, FONT_SIZE, SPACING, BORDER_RADIUS } from '@/constants';
import { useAuth } from '@/hooks/useAuth';
import { useConversations, type Conversation } from '@/hooks/useDirectMessages';
import { useSearchUsers, useSendFriendRequest, useFriends } from '@/hooks/useFriends';
import type { SocialStackParamList } from '@/navigation/types';

type NavProp = NativeStackNavigationProp<SocialStackParamList>;

// ─── Conversation row ────────────────────────────────────────

const ConversationItem = React.memo(function ConversationItem({
  item,
  onPress,
  onAvatarPress,
}: {
  item: Conversation;
  onPress: (conv: Conversation) => void;
  onAvatarPress: (userId: string, username: string | null) => void;
}) {
  const timeAgo = formatTimeAgo(item.last_message_at);

  return (
    <TouchableOpacity
      style={styles.row}
      onPress={() => onPress(item)}
      activeOpacity={0.6}
      accessibilityLabel={`Conversation avec ${item.peer.username ?? 'Randonneur'}`}
    >
      <TouchableOpacity
        onPress={() => onAvatarPress(item.peer.id, item.peer.username)}
        activeOpacity={0.7}
        accessibilityLabel={`Voir le profil de ${item.peer.username ?? 'Randonneur'}`}
      >
        {item.peer.avatar_url ? (
          <Image source={{ uri: item.peer.avatar_url }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Ionicons name="person-circle-outline" size={24} color={COLORS.textMuted} />
          </View>
        )}
      </TouchableOpacity>
      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text style={styles.username} numberOfLines={1}>
            {item.peer.username ?? 'Randonneur'}
          </Text>
          <Text style={styles.time}>{timeAgo}</Text>
        </View>
        {item.lastMessage && (
          <Text style={styles.preview} numberOfLines={1}>
            {item.lastMessage}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
});

// ─── Main screen ─────────────────────────────────────────────

export default function InboxScreen() {
  const { user } = useAuth();
  const navigation = useNavigation<NavProp>();
  const { data: conversations = [], isLoading, refetch } = useConversations(user?.id);
  const { data: friends = [] } = useFriends(user?.id);
  const sendRequest = useSendFriendRequest();

  // Search
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    debounceRef.current = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(debounceRef.current);
  }, [search]);

  const { data: searchResults = [] } = useSearchUsers(debouncedSearch, user?.id);

  const handleConversationPress = useCallback(
    (conv: Conversation) => {
      navigation.navigate('Conversation', {
        conversationId: conv.id,
        peerUsername: conv.peer.username ?? 'Randonneur',
        peerId: conv.peer.id,
      });
    },
    [navigation],
  );

  const handleProfilePress = useCallback(
    (userId: string, username: string | null) => {
      navigation.navigate('UserProfile', { userId, username: username ?? undefined });
    },
    [navigation],
  );

  const handleAddFriend = useCallback(
    (addresseeId: string) => {
      if (!user?.id) return;
      sendRequest.mutate(
        { requesterId: user.id, addresseeId },
        {
          onError: (error: Error) => {
            __DEV__ && console.error('[InboxScreen] Erreur lors de l\'envoi de la demande d\'ami:', error.message);
          },
        },
      );
    },
    [user?.id, sendRequest],
  );

  const renderConversation = useCallback(
    ({ item }: { item: Conversation }) => (
      <ConversationItem item={item} onPress={handleConversationPress} onAvatarPress={handleProfilePress} />
    ),
    [handleConversationPress, handleProfilePress],
  );

  const keyExtractor = useCallback((item: Conversation) => item.id, []);

  const showSearch = debouncedSearch.length >= 2;

  return (
    <View style={styles.container}>
      {/* Search bar */}
      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color={COLORS.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Chercher un randonneur..."
          placeholderTextColor={COLORS.textMuted}
          value={search}
          onChangeText={setSearch}
          accessibilityLabel="Chercher un utilisateur"
        />
        {search.length > 0 && (
          <TouchableOpacity
            onPress={() => setSearch('')}
            accessibilityLabel="Effacer"
            activeOpacity={0.6}
            style={styles.clearButton}
          >
            <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Search results */}
      {showSearch && (
        <View style={styles.searchResults}>
          <Text style={styles.sectionTitle}>Resultats</Text>
          {searchResults.length === 0 ? (
            <Text style={styles.emptySubtext}>Aucun utilisateur trouve</Text>
          ) : (
            searchResults.map((u) => {
              const alreadyFriend = friends.some((f) => f.friend.id === u.id);
              return (
                <TouchableOpacity
                  key={u.id}
                  style={styles.searchRow}
                  onPress={() => handleProfilePress(u.id, u.username)}
                  activeOpacity={0.6}
                  accessibilityLabel={`Voir le profil de ${u.username ?? 'Randonneur'}`}
                >
                  {u.avatar_url ? (
                    <Image source={{ uri: u.avatar_url }} style={styles.searchAvatar} />
                  ) : (
                    <View style={styles.searchAvatarPlaceholder}>
                      <Ionicons name="person-circle-outline" size={24} color={COLORS.textMuted} />
                    </View>
                  )}
                  <Text style={styles.searchUsername} numberOfLines={1}>{u.username}</Text>
                  {alreadyFriend ? (
                    <View style={styles.friendTag}>
                      <Ionicons name="checkmark" size={12} color={COLORS.success} />
                      <Text style={styles.friendTagText}>Ami</Text>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={styles.addButton}
                      onPress={() => handleAddFriend(u.id)}
                      activeOpacity={0.6}
                      accessibilityLabel={`Ajouter ${u.username}`}
                    >
                      <Ionicons name="person-add" size={14} color={COLORS.white} />
                    </TouchableOpacity>
                  )}
                </TouchableOpacity>
              );
            })
          )}
        </View>
      )}

      {/* Conversations list */}
      {!showSearch && (
        isLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={COLORS.primaryLight} />
          </View>
        ) : conversations.length === 0 ? (
          <View style={styles.centered}>
            <Ionicons name="chatbubbles-outline" size={48} color={COLORS.textMuted} />
            <Text style={styles.emptyText}>Pas encore de messages</Text>
            <Text style={styles.emptySubtext}>
              Cherche un randonneur et ajoute-le en ami pour discuter
            </Text>
            <Pressable
              style={{
                marginTop: SPACING.md,
                backgroundColor: COLORS.primary,
                paddingHorizontal: SPACING.lg,
                paddingVertical: SPACING.sm,
                borderRadius: BORDER_RADIUS.md,
              }}
              onPress={() => navigation.navigate('Friends')}
              accessibilityLabel="Chercher des amis"
              accessibilityRole="button"
            >
              <Text style={{ color: COLORS.white, fontWeight: '600', fontSize: FONT_SIZE.sm }}>
                Chercher des amis
              </Text>
            </Pressable>
          </View>
        ) : (
          <FlatList
            data={conversations}
            keyExtractor={keyExtractor}
            renderItem={renderConversation}
            contentContainerStyle={styles.list}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            initialNumToRender={10}
            maxToRenderPerBatch={15}
            removeClippedSubviews={true}
            refreshControl={
              <RefreshControl
                refreshing={isLoading}
                onRefresh={refetch}
                colors={[COLORS.primary]}
                tintColor={COLORS.primary}
              />
            }
          />
        )
      )}
    </View>
  );
}

function formatTimeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMin = Math.floor((now - then) / 60000);
  if (diffMin < 1) return 'A l\'instant';
  if (diffMin < 60) return `${diffMin}min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 7) return `${diffD}j`;
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  list: { padding: SPACING.md },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: SPACING.sm, padding: SPACING.xl },
  emptyText: { fontSize: FONT_SIZE.md, color: COLORS.textMuted },
  emptySubtext: { fontSize: FONT_SIZE.sm, color: COLORS.textMuted, textAlign: 'center' },

  // Search
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.md,
    height: 44,
    gap: SPACING.sm,
  },
  searchInput: { flex: 1, fontSize: FONT_SIZE.md, color: COLORS.textPrimary },
  clearButton: { width: 32, height: 32, justifyContent: 'center', alignItems: 'center' },
  searchResults: { marginHorizontal: SPACING.md, marginTop: SPACING.sm },
  sectionTitle: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted, fontWeight: '600', marginBottom: SPACING.xs, textTransform: 'uppercase' },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.sm,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.xs,
  },
  searchAvatar: { width: 36, height: 36, borderRadius: 18 },
  searchAvatarPlaceholder: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.surface, justifyContent: 'center', alignItems: 'center' },
  searchUsername: { flex: 1, fontSize: FONT_SIZE.md, fontWeight: '600', color: COLORS.textPrimary, marginLeft: SPACING.sm },
  addButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
  friendTag: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: COLORS.success + '20', borderRadius: BORDER_RADIUS.full, paddingHorizontal: SPACING.sm, paddingVertical: 3 },
  friendTagText: { fontSize: FONT_SIZE.xs, color: COLORS.success, fontWeight: '600' },

  // Conversations
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  avatar: { width: 48, height: 48, borderRadius: 24 },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: { flex: 1, marginLeft: SPACING.md },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  username: { fontSize: FONT_SIZE.md, fontWeight: '600', color: COLORS.textPrimary, flexShrink: 1 },
  time: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted, marginLeft: SPACING.sm },
  preview: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, marginTop: 2 },
});
