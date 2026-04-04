import React, { useState, useEffect, useRef, useCallback } from 'react';
import { StyleSheet, Text, View, FlatList, Pressable, Image, TextInput, Alert, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { COLORS, FONT_SIZE, SPACING, BORDER_RADIUS } from '@/constants';
import { useAuth } from '@/hooks/useAuth';
import {
  useFriends,
  useFriendRequests,
  useSendFriendRequest,
  useRespondFriendRequest,
  useRemoveFriend,
  useSearchUsers,
} from '@/hooks/useFriends';
import type { ProfileStackParamList } from '@/navigation/types';

type FriendsNavProp = NativeStackNavigationProp<ProfileStackParamList>;

type Tab = 'friends' | 'requests';

interface FriendData {
  id: string;
  friend: { id: string; username: string | null; avatar_url: string | null };
}

interface RequestData {
  id: string;
  user?: { username: string | null; avatar_url: string | null };
}

const FriendItem = React.memo(function FriendItem({
  item,
  onRemove,
  onPress,
}: {
  item: FriendData;
  onRemove: (friendshipId: string, name: string) => void;
  onPress: (userId: string, username: string | null) => void;
}) {
  return (
    <Pressable
      style={styles.userRow}
      onPress={() => onPress(item.friend.id, item.friend.username)}
      accessibilityLabel={`Voir le profil de ${item.friend.username ?? 'Randonneur'}`}
    >
      {item.friend.avatar_url ? (
        <Image source={{ uri: item.friend.avatar_url }} style={styles.avatar} />
      ) : (
        <View style={styles.avatarPlaceholder}>
          <Ionicons name="person-circle-outline" size={24} color={COLORS.textMuted} />
        </View>
      )}
      <Text style={styles.username} numberOfLines={1}>{item.friend.username ?? 'Randonneur'}</Text>
      <TouchableOpacity
        style={styles.removeButton}
        onPress={() => onRemove(item.id, item.friend.username ?? 'cet ami')}
        accessibilityLabel={`Retirer ${item.friend.username ?? 'cet ami'}`}
        activeOpacity={0.6}
      >
        <Ionicons name="close" size={16} color={COLORS.danger} />
      </TouchableOpacity>
    </Pressable>
  );
});

const RequestItem = React.memo(function RequestItem({
  item,
  onRespond,
}: {
  item: RequestData;
  onRespond: (params: { friendshipId: string; status: 'accepted' | 'declined' }) => void;
}) {
  return (
    <View style={styles.userRow}>
      {item.user?.avatar_url ? (
        <Image source={{ uri: item.user.avatar_url }} style={styles.avatar} />
      ) : (
        <View style={styles.avatarPlaceholder}>
          <Ionicons name="person-circle-outline" size={24} color={COLORS.textMuted} />
        </View>
      )}
      <Text style={styles.username} numberOfLines={1}>{item.user?.username ?? 'Randonneur'}</Text>
      <View style={styles.requestActions}>
        <TouchableOpacity
          style={styles.acceptButton}
          onPress={() => onRespond({ friendshipId: item.id, status: 'accepted' })}
          accessibilityLabel="Accepter"
          activeOpacity={0.6}
        >
          <Ionicons name="checkmark" size={18} color={COLORS.white} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.declineButton}
          onPress={() => onRespond({ friendshipId: item.id, status: 'declined' })}
          accessibilityLabel="Refuser"
          activeOpacity={0.6}
        >
          <Ionicons name="close" size={18} color={COLORS.white} />
        </TouchableOpacity>
      </View>
    </View>
  );
});

export default function FriendsScreen() {
  const { user } = useAuth();
  const navigation = useNavigation<FriendsNavProp>();
  const [tab, setTab] = useState<Tab>('friends');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    debounceRef.current = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(debounceRef.current);
  }, [search]);

  const { data: friends = [], isLoading: friendsLoading } = useFriends(user?.id);
  const { data: requests = [], isLoading: requestsLoading } = useFriendRequests(user?.id);
  const { data: searchResults = [] } = useSearchUsers(debouncedSearch, user?.id);

  const sendRequest = useSendFriendRequest();
  const respond = useRespondFriendRequest();
  const remove = useRemoveFriend();

  const handleRemove = useCallback((friendshipId: string, name: string) => {
    Alert.alert('Supprimer', `Retirer ${name} de tes amis ?`, [
      { text: 'Non', style: 'cancel' },
      { text: 'Oui', style: 'destructive', onPress: () => remove.mutate(friendshipId) },
    ]);
  }, [remove]);

  const handleRespond = useCallback((params: { friendshipId: string; status: 'accepted' | 'declined' }) => {
    respond.mutate(params);
  }, [respond]);

  const handleUserPress = useCallback((userId: string, username: string | null) => {
    navigation.navigate('UserProfile', { userId, username: username ?? undefined });
  }, [navigation]);

  const renderFriendItem = useCallback(
    ({ item }: { item: FriendData }) => (
      <FriendItem item={item} onRemove={handleRemove} onPress={handleUserPress} />
    ),
    [handleRemove, handleUserPress],
  );

  const renderRequestItem = useCallback(
    ({ item }: { item: RequestData }) => <RequestItem item={item} onRespond={handleRespond} />,
    [handleRespond],
  );

  const friendKeyExtractor = useCallback((item: FriendData) => item.id, []);
  const requestKeyExtractor = useCallback((item: RequestData) => item.id, []);

  return (
    <View style={styles.container}>
      {/* Search */}
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
          <Pressable
            onPress={() => setSearch('')}
            accessibilityLabel="Effacer la recherche"
            style={{ minWidth: SPACING.xxl, minHeight: SPACING.xxl, justifyContent: 'center', alignItems: 'center' }}
          >
            <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
          </Pressable>
        )}
      </View>

      {/* Search Results */}
      {debouncedSearch.length >= 2 && (
        <View style={styles.searchResults}>
          <Text style={styles.sectionTitle}>Resultats</Text>
          {searchResults.length === 0 ? (
            <Text style={styles.emptyText}>Aucun utilisateur trouve</Text>
          ) : (
            searchResults.map((u) => {
              const alreadyFriend = friends.some((f) => f.friend.id === u.id);
              return (
                <Pressable
                  key={u.id}
                  style={styles.userRow}
                  onPress={() => handleUserPress(u.id, u.username)}
                  accessibilityLabel={`Voir le profil de ${u.username ?? 'Randonneur'}`}
                >
                  {u.avatar_url ? (
                    <Image source={{ uri: u.avatar_url }} style={styles.avatar} />
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <Ionicons name="person-circle-outline" size={24} color={COLORS.textMuted} />
                    </View>
                  )}
                  <Text style={styles.username} numberOfLines={1}>{u.username}</Text>
                  {alreadyFriend ? (
                    <Text style={styles.alreadyFriend}>Deja ami</Text>
                  ) : (
                    <TouchableOpacity
                      style={styles.addButton}
                      onPress={() => user?.id && sendRequest.mutate({ requesterId: user.id, addresseeId: u.id })}
                      accessibilityLabel={`Ajouter ${u.username}`}
                      activeOpacity={0.6}
                    >
                      <Ionicons name="person-add" size={16} color={COLORS.white} />
                    </TouchableOpacity>
                  )}
                </Pressable>
              );
            })
          )}
        </View>
      )}

      {/* Tabs */}
      <View style={styles.tabs}>
        <Pressable style={[styles.tab, tab === 'friends' && styles.tabActive]} onPress={() => setTab('friends')} accessibilityLabel="Onglet amis">
          <Text style={[styles.tabText, tab === 'friends' && styles.tabTextActive]}>
            Amis ({friends.length})
          </Text>
        </Pressable>
        <Pressable style={[styles.tab, tab === 'requests' && styles.tabActive]} onPress={() => setTab('requests')} accessibilityLabel="Onglet demandes">
          <Text style={[styles.tabText, tab === 'requests' && styles.tabTextActive]}>
            Demandes ({requests.length})
          </Text>
        </Pressable>
      </View>

      {/* Content */}
      {tab === 'friends' ? (
        friendsLoading ? (
          <ActivityIndicator style={styles.loader} size="large" color={COLORS.primary} />
        ) : friends.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="people-outline" size={48} color={COLORS.textMuted} />
            <Text style={styles.emptyText}>Pas encore d'amis</Text>
            <Text style={styles.emptySubtext}>Cherche des randonneurs par leur pseudo</Text>
          </View>
        ) : (
          <FlatList
            data={friends}
            keyExtractor={friendKeyExtractor}
            contentContainerStyle={styles.list}
            renderItem={renderFriendItem}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
          />
        )
      ) : requestsLoading ? (
        <ActivityIndicator style={styles.loader} size="large" color={COLORS.primary} />
      ) : requests.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="mail-outline" size={48} color={COLORS.textMuted} />
          <Text style={styles.emptyText}>Aucune demande en attente</Text>
        </View>
      ) : (
        <FlatList
          data={requests}
          keyExtractor={requestKeyExtractor}
          contentContainerStyle={styles.list}
          renderItem={renderRequestItem}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          removeClippedSubviews={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card, marginHorizontal: SPACING.md, marginTop: SPACING.md, borderRadius: BORDER_RADIUS.lg, paddingHorizontal: SPACING.md, height: SPACING.xxl, gap: SPACING.sm },
  searchInput: { flex: 1, fontSize: FONT_SIZE.md, color: COLORS.textPrimary },
  searchResults: { marginHorizontal: SPACING.md, marginTop: SPACING.sm },
  sectionTitle: { fontSize: FONT_SIZE.sm, color: COLORS.textMuted, fontWeight: '600', marginBottom: SPACING.xs, textTransform: 'uppercase' },
  tabs: { flexDirection: 'row', marginHorizontal: SPACING.md, marginTop: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  tab: { flex: 1, paddingVertical: SPACING.sm, alignItems: 'center', minHeight: SPACING.xxl, justifyContent: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: COLORS.primary },
  tabText: { fontSize: FONT_SIZE.md, color: COLORS.textMuted },
  tabTextActive: { color: COLORS.primary, fontWeight: '600' },
  list: { padding: SPACING.md },
  loader: { marginTop: SPACING.xl },
  userRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card, borderRadius: BORDER_RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.sm },
  avatar: { width: 40, height: 40, borderRadius: 20 },
  avatarPlaceholder: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.surface, justifyContent: 'center', alignItems: 'center' },
  username: { flexShrink: 1, flexGrow: 1, fontSize: FONT_SIZE.md, fontWeight: '600', color: COLORS.textPrimary, marginLeft: SPACING.sm, marginRight: SPACING.sm },
  alreadyFriend: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted },
  addButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
  removeButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.danger + '20', justifyContent: 'center', alignItems: 'center' },
  requestActions: { flexDirection: 'row', gap: SPACING.sm, flexShrink: 0 },
  acceptButton: { width: 48, height: 48, borderRadius: 24, backgroundColor: COLORS.success, justifyContent: 'center', alignItems: 'center' },
  declineButton: { width: 48, height: 48, borderRadius: 24, backgroundColor: COLORS.danger, justifyContent: 'center', alignItems: 'center' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: SPACING.sm, paddingTop: 80 },
  emptyText: { fontSize: FONT_SIZE.md, color: COLORS.textMuted },
  emptySubtext: { fontSize: FONT_SIZE.sm, color: COLORS.textMuted },
});
