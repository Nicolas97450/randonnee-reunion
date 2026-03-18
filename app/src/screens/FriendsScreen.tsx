import { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, FlatList, Pressable, Image, TextInput, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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

type Tab = 'friends' | 'requests';

export default function FriendsScreen() {
  const { user } = useAuth();
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

  const handleRemove = (friendshipId: string, name: string) => {
    Alert.alert('Supprimer', `Retirer ${name} de tes amis ?`, [
      { text: 'Non', style: 'cancel' },
      { text: 'Oui', style: 'destructive', onPress: () => remove.mutate(friendshipId) },
    ]);
  };

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
          <Pressable onPress={() => setSearch('')}>
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
                <View key={u.id} style={styles.userRow}>
                  {u.avatar_url ? (
                    <Image source={{ uri: u.avatar_url }} style={styles.avatar} />
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <Ionicons name="person" size={16} color={COLORS.textMuted} />
                    </View>
                  )}
                  <Text style={styles.username}>{u.username}</Text>
                  {alreadyFriend ? (
                    <Text style={styles.alreadyFriend}>Deja ami</Text>
                  ) : (
                    <Pressable
                      style={styles.addButton}
                      onPress={() => user?.id && sendRequest.mutate({ requesterId: user.id, addresseeId: u.id })}
                      accessibilityLabel={`Ajouter ${u.username}`}
                    >
                      <Ionicons name="person-add" size={16} color={COLORS.white} />
                    </Pressable>
                  )}
                </View>
              );
            })
          )}
        </View>
      )}

      {/* Tabs */}
      <View style={styles.tabs}>
        <Pressable style={[styles.tab, tab === 'friends' && styles.tabActive]} onPress={() => setTab('friends')}>
          <Text style={[styles.tabText, tab === 'friends' && styles.tabTextActive]}>
            Amis ({friends.length})
          </Text>
        </Pressable>
        <Pressable style={[styles.tab, tab === 'requests' && styles.tabActive]} onPress={() => setTab('requests')}>
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
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <View style={styles.userRow}>
                {item.friend.avatar_url ? (
                  <Image source={{ uri: item.friend.avatar_url }} style={styles.avatar} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Ionicons name="person" size={16} color={COLORS.textMuted} />
                  </View>
                )}
                <Text style={styles.username}>{item.friend.username ?? 'Randonneur'}</Text>
                <Pressable
                  style={styles.removeButton}
                  onPress={() => handleRemove(item.id, item.friend.username ?? 'cet ami')}
                >
                  <Ionicons name="close" size={16} color={COLORS.danger} />
                </Pressable>
              </View>
            )}
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
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.userRow}>
              {item.user?.avatar_url ? (
                <Image source={{ uri: item.user.avatar_url }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Ionicons name="person" size={16} color={COLORS.textMuted} />
                </View>
              )}
              <Text style={styles.username}>{item.user?.username ?? 'Randonneur'}</Text>
              <View style={styles.requestActions}>
                <Pressable
                  style={styles.acceptButton}
                  onPress={() => respond.mutate({ friendshipId: item.id, status: 'accepted' })}
                  accessibilityLabel="Accepter"
                >
                  <Ionicons name="checkmark" size={16} color={COLORS.white} />
                </Pressable>
                <Pressable
                  style={styles.declineButton}
                  onPress={() => respond.mutate({ friendshipId: item.id, status: 'declined' })}
                  accessibilityLabel="Refuser"
                >
                  <Ionicons name="close" size={16} color={COLORS.white} />
                </Pressable>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card, marginHorizontal: SPACING.md, marginTop: SPACING.md, borderRadius: BORDER_RADIUS.lg, paddingHorizontal: SPACING.md, height: 44, gap: SPACING.sm },
  searchInput: { flex: 1, fontSize: FONT_SIZE.md, color: COLORS.textPrimary },
  searchResults: { marginHorizontal: SPACING.md, marginTop: SPACING.sm },
  sectionTitle: { fontSize: FONT_SIZE.sm, color: COLORS.textMuted, fontWeight: '600', marginBottom: SPACING.xs, textTransform: 'uppercase' },
  tabs: { flexDirection: 'row', marginHorizontal: SPACING.md, marginTop: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  tab: { flex: 1, paddingVertical: SPACING.sm, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: COLORS.primary },
  tabText: { fontSize: FONT_SIZE.md, color: COLORS.textMuted },
  tabTextActive: { color: COLORS.primary, fontWeight: '600' },
  list: { padding: SPACING.md },
  loader: { marginTop: SPACING.xl },
  userRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card, borderRadius: BORDER_RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.sm },
  avatar: { width: 40, height: 40, borderRadius: 20 },
  avatarPlaceholder: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.surface, justifyContent: 'center', alignItems: 'center' },
  username: { flex: 1, fontSize: FONT_SIZE.md, fontWeight: '600', color: COLORS.textPrimary, marginLeft: SPACING.sm },
  alreadyFriend: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted },
  addButton: { width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
  removeButton: { width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.danger + '20', justifyContent: 'center', alignItems: 'center' },
  requestActions: { flexDirection: 'row', gap: SPACING.sm },
  acceptButton: { width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.success, justifyContent: 'center', alignItems: 'center' },
  declineButton: { width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.danger, justifyContent: 'center', alignItems: 'center' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: SPACING.sm, paddingTop: 80 },
  emptyText: { fontSize: FONT_SIZE.md, color: COLORS.textMuted },
  emptySubtext: { fontSize: FONT_SIZE.sm, color: COLORS.textMuted },
});
