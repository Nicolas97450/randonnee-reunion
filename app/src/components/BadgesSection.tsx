import React, { useCallback } from 'react';
import { StyleSheet, Text, View, FlatList } from 'react-native';
import { COLORS, FONT_SIZE, SPACING, BORDER_RADIUS } from '@/constants';
import { BADGES } from '@/lib/badges';
import BadgeMedal from './BadgeMedal';

interface BadgesSectionProps {
  earnedIds: Set<string>;
}

const BadgesSection = React.memo(function BadgesSection({
  earnedIds,
}: BadgesSectionProps) {
  const renderBadge = useCallback(
    ({ item }: { item: (typeof BADGES)[number] }) => (
      <BadgeMedal
        key={item.id}
        name={item.name}
        icon={item.icon}
        color={item.color}
        earned={earnedIds.has(item.id)}
        description={item.description}
      />
    ),
    [earnedIds],
  );

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>
        Badges ({earnedIds.size}/{BADGES.length})
      </Text>
      <FlatList
        data={BADGES}
        renderItem={renderBadge}
        keyExtractor={(item) => item.id}
        numColumns={4}
        scrollEnabled={false}
        columnWrapperStyle={styles.badgesMedalRow}
        contentContainerStyle={styles.badgesMedalGrid}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: SPACING.md,
    marginTop: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  badgesMedalGrid: {
    gap: SPACING.md,
  },
  badgesMedalRow: {
    justifyContent: 'space-between',
  },
});

export default BadgesSection;
