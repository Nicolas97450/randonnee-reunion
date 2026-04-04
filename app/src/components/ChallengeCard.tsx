import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT_SIZE, SPACING, BORDER_RADIUS } from '@/constants';
import type { CommunityChallenge } from '@/hooks/useCommunityChallenge';

interface ChallengeCardProps {
  challenge: CommunityChallenge;
}

const ChallengeCard = React.memo(function ChallengeCard({
  challenge,
}: ChallengeCardProps) {
  const progressWidth = `${Math.min(100, challenge.progressPercent)}%`;

  return (
    <View style={styles.challengeCard} accessibilityLabel={`Defi: ${challenge.title}, ${challenge.progressPercent}% complete`}>
      <View style={styles.challengeHeader}>
        <Ionicons name="people-circle-outline" size={22} color={COLORS.info} />
        <Text style={styles.challengeTitle} numberOfLines={1}>{challenge.title}</Text>
      </View>
      {challenge.description ? (
        <Text style={styles.challengeDescription} numberOfLines={2}>{challenge.description}</Text>
      ) : null}
      <View style={styles.challengeBarBg}>
        <View style={[styles.challengeBarFill, { width: progressWidth }]} />
      </View>
      <View style={styles.challengeStatsRow}>
        <Text style={styles.challengeProgress}>
          {challenge.current_km.toFixed(0)} / {challenge.target_km.toFixed(0)} km
        </Text>
        <Text style={styles.challengePercent}>{challenge.progressPercent}%</Text>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  challengeCard: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  challengeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  challengeTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
    color: COLORS.textPrimary,
    flex: 1,
  },
  challengeDescription: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  challengeBarBg: {
    height: 8,
    backgroundColor: COLORS.border,
    borderRadius: BORDER_RADIUS.full,
    overflow: 'hidden',
  },
  challengeBarFill: {
    height: '100%',
    backgroundColor: COLORS.info,
    borderRadius: BORDER_RADIUS.full,
  },
  challengeStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.xs,
  },
  challengeProgress: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  challengePercent: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.info,
    fontWeight: '700',
  },
});

export default ChallengeCard;
