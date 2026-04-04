import { useState, useMemo, useCallback } from 'react';
import { StyleSheet, Text, View, Pressable, ScrollView, Alert, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { COLORS, FONT_SIZE, SPACING, BORDER_RADIUS } from '@/constants';
import { useAuth } from '@/hooks/useAuth';
import type { ProfileStackParamList } from '@/navigation/types';
import { useSortieParticipants, useJoinSortie, useUpdateParticipant, useCancelSortie, useLeaveSortie } from '@/hooks/useSorties';
import { useSendFriendRequest, useFriends } from '@/hooks/useFriends';
import SortieChat from '@/components/SortieChat';
import type { Sortie, SortieParticipant } from '@/types';

interface Props {
  route: {
    params: {
      sortie: Sortie;
    };
  };
}

type Tab = 'chat' | 'participants';

export default function SortieDetailScreen({ route }: Props) {
  const { sortie } = route.params;
  const { user } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
  const [activeTab, setActiveTab] = useState<Tab>('chat');

  const { data: participants = [] } = useSortieParticipants(sortie.id);
  const joinSortie = useJoinSortie();
  const updateParticipant = useUpdateParticipant();
  const cancelSortie = useCancelSortie();
  const leaveSortie = useLeaveSortie();
  const sendFriendRequest = useSendFriendRequest();
  const { data: friendsList = [] } = useFriends(user?.id);

  const isOrganisateur = user?.id === sortie.organisateur_id;
  const myParticipation = participants.find((p) => p.user_id === user?.id);
  const isAccepted = myParticipation?.statut === 'accepte';
  const isPending = myParticipation?.statut === 'en_attente';

  const pendingParticipants = useMemo(
    () => participants.filter((p) => p.statut === 'en_attente'),
    [participants],
  );
  const acceptedParticipants = useMemo(
    () => participants.filter((p) => p.statut === 'accepte'),
    [participants],
  );

  const acceptedCount = acceptedParticipants.length;
  const pendingCount = pendingParticipants.length;

  // Build a set of friend user IDs for quick lookup
  const friendUserIds = useMemo(() => {
    const ids = new Set<string>();
    friendsList.forEach((f) => {
      if (f.friend?.id) ids.add(f.friend.id);
    });
    return ids;
  }, [friendsList]);

  const handleJoin = async () => {
    if (!user) return;
    try {
      await joinSortie.mutateAsync({ sortieId: sortie.id, userId: user.id });
      Alert.alert('Demande envoyee', "L'organisateur va valider ta participation.");
    } catch {
      Alert.alert('Erreur', 'Impossible de rejoindre cette sortie.');
    }
  };

  const handleAccept = (participantId: string) => {
    updateParticipant.mutate(
      { participantId, statut: 'accepte' },
      {
        onError: () => Alert.alert('Erreur', 'Impossible d\'accepter ce participant.'),
      },
    );
  };

  const handleRefuse = (participantId: string) => {
    updateParticipant.mutate(
      { participantId, statut: 'refuse' },
      {
        onError: () => Alert.alert('Erreur', 'Impossible de refuser ce participant.'),
      },
    );
  };

  const handleCancel = () => {
    Alert.alert('Annuler la sortie ?', 'Tous les participants seront notifies.', [
      { text: 'Non', style: 'cancel' },
      {
        text: 'Oui, annuler',
        style: 'destructive',
        onPress: () => cancelSortie.mutate(sortie.id, {
          onError: () => Alert.alert('Erreur', 'Impossible d\'annuler cette sortie.'),
        }),
      },
    ]);
  };

  const handleLeave = () => {
    if (!user) return;
    Alert.alert('Quitter la sortie ?', 'Tu ne participeras plus a cette sortie.', [
      { text: 'Non', style: 'cancel' },
      {
        text: 'Quitter',
        style: 'destructive',
        onPress: () => leaveSortie.mutate({ sortieId: sortie.id, userId: user.id }, {
          onError: () => Alert.alert('Erreur', 'Impossible de quitter cette sortie.'),
        }),
      },
    ]);
  };

  const handleAddFriend = (participantUserId: string) => {
    if (!user) return;
    sendFriendRequest.mutate(
      { requesterId: user.id, addresseeId: participantUserId },
      {
        onError: () => Alert.alert('Erreur', 'Impossible d\'envoyer la demande d\'ami.'),
      },
    );
  };

  const isFriend = (participantUserId: string): boolean => {
    return friendUserIds.has(participantUserId);
  };

  const handleProfilePress = useCallback((userId: string, username?: string | null) => {
    navigation.navigate('UserProfile', { userId, username: username ?? undefined });
  }, [navigation]);

  const renderPendingParticipant = ({ item }: { item: SortieParticipant }) => (
    <View style={styles.participantRow}>
      <TouchableOpacity
        style={styles.participantTouchable}
        onPress={() => handleProfilePress(item.user_id, item.user?.username)}
        activeOpacity={0.6}
        accessibilityLabel={`Voir le profil de ${item.user?.username?.trim() || 'ce randonneur'}`}
      >
        <View style={styles.participantAvatar}>
          {item.user?.avatar_url ? (
            <Image source={{ uri: item.user.avatar_url }} style={styles.avatarImage} />
          ) : (
            <Ionicons name="person-circle-outline" size={24} color={COLORS.textMuted} />
          )}
        </View>
        <View style={styles.participantInfo}>
          <Text style={styles.participantName}>{item.user?.username?.trim() || 'Nouveau randonneur'}</Text>
          <Text style={[styles.participantStatus, { color: COLORS.warning }]}>En attente</Text>
        </View>
      </TouchableOpacity>
      {isOrganisateur && (
        <View style={styles.participantActions}>
          <TouchableOpacity
            style={styles.acceptBtn}
            onPress={() => {
              handleAccept(item.id);
            }}
            accessibilityLabel="Accepter le participant"
            activeOpacity={0.6}
          >
            <Ionicons name="checkmark" size={18} color={COLORS.white} />
            <Text style={styles.actionBtnText}>Oui</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.refuseBtn}
            onPress={() => {
              handleRefuse(item.id);
            }}
            accessibilityLabel="Refuser le participant"
            activeOpacity={0.6}
          >
            <Ionicons name="close" size={18} color={COLORS.white} />
            <Text style={styles.actionBtnText}>Non</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderAcceptedParticipant = ({ item }: { item: SortieParticipant }) => {
    const isMe = item.user_id === user?.id;
    const isAlreadyFriend = isFriend(item.user_id);
    const isOrgaUser = item.user_id === sortie.organisateur_id;
    const showAddFriend = user && !isMe && !isAlreadyFriend && !isOrgaUser;

    return (
      <View style={styles.participantRow}>
        <TouchableOpacity
          style={styles.participantTouchable}
          onPress={() => handleProfilePress(item.user_id, item.user?.username)}
          activeOpacity={0.6}
          accessibilityLabel={`Voir le profil de ${item.user?.username?.trim() || 'ce randonneur'}`}
        >
          <View style={styles.participantAvatar}>
            {item.user?.avatar_url ? (
              <Image source={{ uri: item.user.avatar_url }} style={styles.avatarImage} />
            ) : (
              <Ionicons name="person-circle-outline" size={24} color={COLORS.textMuted} />
            )}
          </View>
          <View style={styles.participantInfo}>
            <Text style={styles.participantName}>{item.user?.username?.trim() || 'Nouveau randonneur'}</Text>
            <Text style={[styles.participantStatus, { color: COLORS.success }]}>Accepte</Text>
          </View>
        </TouchableOpacity>
        {showAddFriend && (
          <Pressable
            style={[styles.addFriendBtn, sendFriendRequest.isPending && { opacity: 0.5 }]}
            onPress={() => handleAddFriend(item.user_id)}
            accessibilityLabel={`Ajouter ${item.user?.username?.trim() || 'ce participant'} en ami`}
            disabled={sendFriendRequest.isPending}
          >
            <Ionicons name="person-add" size={18} color={COLORS.primary} />
          </Pressable>
        )}
      </View>
    );
  };

  const renderParticipantsContent = () => (
    <ScrollView style={styles.participantsList} contentContainerStyle={{ paddingBottom: SPACING.xl }} keyboardShouldPersistTaps="handled">
      {/* Demandes en attente */}
      {pendingCount > 0 && (
        <View style={styles.participantSection}>
          <View style={styles.sectionHeader}>
            <Ionicons name="time" size={16} color={COLORS.warning} />
            <Text style={styles.sectionTitle}>Demandes en attente ({pendingCount})</Text>
          </View>
          {pendingParticipants.map((p) => (
            <View key={p.id}>{renderPendingParticipant({ item: p })}</View>
          ))}
        </View>
      )}

      {/* Participants acceptes */}
      <View style={styles.participantSection}>
        <View style={styles.sectionHeader}>
          <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
          <Text style={styles.sectionTitle}>Participants ({acceptedCount})</Text>
        </View>
        {acceptedParticipants.length > 0 ? (
          acceptedParticipants.map((p) => (
            <View key={p.id}>{renderAcceptedParticipant({ item: p })}</View>
          ))
        ) : (
          <Text style={styles.noParticipantsText}>Aucun participant accepte pour le moment.</Text>
        )}
      </View>
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.titre}>{sortie.titre}</Text>

        {/* Trail info */}
        {sortie.trail?.name && (
          <View style={styles.trailInfoRow}>
            <Ionicons name="trail-sign" size={14} color={COLORS.primary} />
            <Text style={styles.trailInfoText} numberOfLines={2}>{sortie.trail.name}</Text>
            {sortie.trail.region && (
              <Text style={styles.trailRegionText}>({sortie.trail.region})</Text>
            )}
          </View>
        )}

        <View style={styles.metaRow}>
          <Ionicons name="calendar" size={14} color={COLORS.textSecondary} />
          <Text style={styles.metaText}>{sortie.date_sortie} a {sortie.heure_depart}</Text>
          <Ionicons name="people" size={14} color={COLORS.textSecondary} />
          <Text style={styles.metaText}>{acceptedCount}/{sortie.places_max}</Text>
        </View>

        {/* Full indicator */}
        {acceptedCount >= sortie.places_max && sortie.statut === 'ouvert' && (
          <View style={styles.fullBadge}>
            <Ionicons name="alert-circle" size={14} color={COLORS.warning} />
            <Text style={styles.fullBadgeText}>Sortie complete</Text>
          </View>
        )}

        {/* Actions */}
        {!isOrganisateur && !myParticipation && sortie.statut === 'ouvert' && (
          <Pressable style={styles.joinButton} onPress={handleJoin} accessibilityLabel="Rejoindre la sortie">
            <Text style={styles.joinButtonText}>Rejoindre</Text>
          </Pressable>
        )}
        {isPending && (
          <View style={styles.pendingBadge}>
            <Ionicons name="time" size={14} color={COLORS.warning} />
            <Text style={styles.pendingText}>Demande en attente</Text>
          </View>
        )}
        {!isOrganisateur && (isAccepted || isPending) && (
          <Pressable style={styles.leaveButton} onPress={handleLeave} accessibilityLabel="Quitter la sortie">
            <Text style={styles.leaveText}>Quitter la sortie</Text>
          </Pressable>
        )}
        {isOrganisateur && (
          <Pressable style={styles.cancelButton} onPress={handleCancel} accessibilityLabel="Annuler la sortie">
            <Text style={styles.cancelText}>Annuler la sortie</Text>
          </Pressable>
        )}
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <Pressable
          style={[styles.tab, activeTab === 'chat' && styles.tabActive]}
          onPress={() => setActiveTab('chat')}
          accessibilityLabel="Onglet chat"
        >
          <Ionicons name="chatbubbles" size={18} color={activeTab === 'chat' ? COLORS.primary : COLORS.textMuted} />
          <Text style={[styles.tabText, activeTab === 'chat' && styles.tabTextActive]}>Chat</Text>
        </Pressable>
        <Pressable
          style={[styles.tab, activeTab === 'participants' && styles.tabActive]}
          onPress={() => setActiveTab('participants')}
          accessibilityLabel="Onglet participants"
        >
          <Ionicons name="people" size={18} color={activeTab === 'participants' ? COLORS.primary : COLORS.textMuted} />
          <Text style={[styles.tabText, activeTab === 'participants' && styles.tabTextActive]}>
            Participants ({acceptedCount})
          </Text>
          {pendingCount > 0 && isOrganisateur && (
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationBadgeText}>{pendingCount}</Text>
            </View>
          )}
        </Pressable>
      </View>

      {/* Content */}
      {activeTab === 'chat' && user && (isAccepted || isOrganisateur) ? (
        <SortieChat sortieId={sortie.id} userId={user.id} />
      ) : activeTab === 'chat' ? (
        <View style={styles.lockedChat}>
          <Ionicons name="lock-closed" size={32} color={COLORS.textMuted} />
          <Text style={styles.lockedText}>Le chat est accessible aux participants acceptes</Text>
        </View>
      ) : (
        renderParticipantsContent()
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { padding: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  titre: { fontSize: FONT_SIZE.xl, fontWeight: '700', color: COLORS.textPrimary },
  trailInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginTop: SPACING.sm,
    backgroundColor: COLORS.primary + '15',
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    alignSelf: 'flex-start',
  },
  trailInfoText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.primary,
    fontWeight: '600',
  },
  trailRegionText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
  },
  fullBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginTop: SPACING.sm,
    backgroundColor: COLORS.warning + '20',
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    alignSelf: 'flex-start',
  },
  fullBadgeText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.warning,
    fontWeight: '600',
  },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginTop: SPACING.xs },
  metaText: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, marginRight: SPACING.sm },
  joinButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    marginTop: SPACING.md,
    minHeight: SPACING.xxl,
    justifyContent: 'center',
  },
  joinButtonText: { fontSize: FONT_SIZE.md, fontWeight: '600', color: COLORS.white },
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginTop: SPACING.md,
  },
  pendingText: { fontSize: FONT_SIZE.sm, color: COLORS.warning },
  cancelButton: { marginTop: SPACING.md, alignItems: 'center', minHeight: SPACING.xxl, justifyContent: 'center' },
  cancelText: { fontSize: FONT_SIZE.sm, color: COLORS.danger },
  leaveButton: { marginTop: SPACING.sm, alignItems: 'center', minHeight: SPACING.xxl, justifyContent: 'center' },
  leaveText: { fontSize: FONT_SIZE.sm, color: COLORS.warning },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.md,
    minHeight: SPACING.xxl,
  },
  tabActive: { borderBottomWidth: 2, borderBottomColor: COLORS.primary },
  tabText: { fontSize: FONT_SIZE.md, color: COLORS.textMuted },
  tabTextActive: { color: COLORS.primary, fontWeight: '600' },
  notificationBadge: {
    backgroundColor: COLORS.danger,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
    marginLeft: SPACING.xs,
  },
  notificationBadgeText: {
    color: COLORS.white,
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
  },
  lockedChat: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.md,
  },
  lockedText: { fontSize: FONT_SIZE.md, color: COLORS.textMuted, textAlign: 'center' },
  participantsList: { padding: SPACING.md },
  participantSection: {
    marginBottom: SPACING.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  noParticipantsText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textMuted,
    fontStyle: 'italic',
    paddingVertical: SPACING.sm,
  },
  participantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  participantTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  participantAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  participantInfo: { flex: 1, marginLeft: SPACING.md },
  participantName: { fontSize: FONT_SIZE.md, color: COLORS.textPrimary, fontWeight: '600' },
  participantStatus: { fontSize: FONT_SIZE.xs },
  participantActions: { flexDirection: 'row', gap: SPACING.sm, flexShrink: 0 },
  acceptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: SPACING.md,
    minHeight: 44,
    borderRadius: SPACING.lg,
    backgroundColor: COLORS.success,
  },
  refuseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: SPACING.md,
    minHeight: 44,
    borderRadius: SPACING.lg,
    backgroundColor: COLORS.danger,
  },
  actionBtnText: {
    color: COLORS.white,
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
  },
  addFriendBtn: {
    width: SPACING.xxl,
    height: SPACING.xxl,
    borderRadius: 24,
    backgroundColor: COLORS.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
