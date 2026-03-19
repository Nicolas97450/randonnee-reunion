import { useState } from 'react';
import { StyleSheet, Text, View, Pressable, FlatList, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT_SIZE, SPACING, BORDER_RADIUS } from '@/constants';
import { useAuth } from '@/hooks/useAuth';
import { useSortieParticipants, useJoinSortie, useUpdateParticipant, useCancelSortie, useLeaveSortie } from '@/hooks/useSorties';
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
  const [activeTab, setActiveTab] = useState<Tab>('chat');

  const { data: participants = [] } = useSortieParticipants(sortie.id);
  const joinSortie = useJoinSortie();
  const updateParticipant = useUpdateParticipant();
  const cancelSortie = useCancelSortie();
  const leaveSortie = useLeaveSortie();

  const isOrganisateur = user?.id === sortie.organisateur_id;
  const myParticipation = participants.find((p) => p.user_id === user?.id);
  const isAccepted = myParticipation?.statut === 'accepte';
  const isPending = myParticipation?.statut === 'en_attente';
  const acceptedCount = participants.filter((p) => p.statut === 'accepte').length;

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
        onSuccess: () => Alert.alert('Participant mis a jour', 'Le participant a ete accepte.'),
        onError: () => Alert.alert('Erreur', 'Impossible d\'accepter ce participant.'),
      },
    );
  };

  const handleRefuse = (participantId: string) => {
    updateParticipant.mutate(
      { participantId, statut: 'refuse' },
      {
        onSuccess: () => Alert.alert('Participant mis a jour', 'Le participant a ete refuse.'),
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
        onPress: () => cancelSortie.mutate(sortie.id),
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
        onPress: () => leaveSortie.mutate({ sortieId: sortie.id, userId: user.id }),
      },
    ]);
  };

  const renderParticipant = ({ item }: { item: SortieParticipant }) => (
    <View style={styles.participantRow}>
      <View style={styles.participantAvatar}>
        <Ionicons name="person" size={18} color={COLORS.textPrimary} />
      </View>
      <View style={styles.participantInfo}>
        <Text style={styles.participantName}>{item.user?.username?.trim() || 'Nouveau randonneur'}</Text>
        <Text style={[styles.participantStatus, { color: item.statut === 'accepte' ? COLORS.success : item.statut === 'refuse' ? COLORS.danger : COLORS.warning }]}>
          {item.statut === 'accepte' ? 'Accepte' : item.statut === 'refuse' ? 'Refuse' : 'En attente'}
        </Text>
      </View>
      {isOrganisateur && item.statut === 'en_attente' && (
        <View style={styles.participantActions}>
          <Pressable style={styles.acceptBtn} onPress={() => handleAccept(item.id)} accessibilityLabel="Accepter le participant">
            <Ionicons name="checkmark" size={22} color={COLORS.white} />
          </Pressable>
          <Pressable style={styles.refuseBtn} onPress={() => handleRefuse(item.id)} accessibilityLabel="Refuser le participant">
            <Ionicons name="close" size={22} color={COLORS.white} />
          </Pressable>
        </View>
      )}
    </View>
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
        <FlatList
          data={participants}
          renderItem={renderParticipant}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.participantsList}
        />
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
  },
  joinButtonText: { fontSize: FONT_SIZE.md, fontWeight: '600', color: COLORS.white },
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginTop: SPACING.md,
  },
  pendingText: { fontSize: FONT_SIZE.sm, color: COLORS.warning },
  cancelButton: { marginTop: SPACING.md, alignItems: 'center' },
  cancelText: { fontSize: FONT_SIZE.sm, color: COLORS.danger },
  leaveButton: { marginTop: SPACING.sm, alignItems: 'center' },
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
  },
  tabActive: { borderBottomWidth: 2, borderBottomColor: COLORS.primary },
  tabText: { fontSize: FONT_SIZE.md, color: COLORS.textMuted },
  tabTextActive: { color: COLORS.primary, fontWeight: '600' },
  lockedChat: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.md,
  },
  lockedText: { fontSize: FONT_SIZE.md, color: COLORS.textMuted, textAlign: 'center' },
  participantsList: { padding: SPACING.md },
  participantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  participantAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  participantInfo: { flex: 1, marginLeft: SPACING.md },
  participantName: { fontSize: FONT_SIZE.md, color: COLORS.textPrimary, fontWeight: '600' },
  participantStatus: { fontSize: FONT_SIZE.xs },
  participantActions: { flexDirection: 'row', gap: SPACING.sm },
  acceptBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.success,
    justifyContent: 'center',
    alignItems: 'center',
  },
  refuseBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.danger,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
