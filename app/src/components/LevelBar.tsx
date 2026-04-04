import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS, FONT_SIZE, SPACING, BORDER_RADIUS } from '@/constants';
import { getHikerLevel, getNextLevel, getLevelProgress } from '@/lib/badges';

interface LevelBarProps {
  trailsCompleted: number;
}

const LevelBar = React.memo(function LevelBar({
  trailsCompleted,
}: LevelBarProps) {
  const level = getHikerLevel(trailsCompleted);
  const next = getNextLevel(trailsCompleted);
  const progress = getLevelProgress(trailsCompleted);

  return (
    <View style={styles.levelContainer}>
      <View style={styles.levelHeader}>
        <View style={[styles.levelBadgeCircle, { backgroundColor: level.color + '20', borderColor: level.color }]}>
          <Text style={[styles.levelNumber, { color: level.color }]}>{level.level}</Text>
        </View>
        <View style={styles.levelInfo}>
          <Text style={[styles.levelName, { color: level.color }]}>{level.name}</Text>
          {next ? (
            <Text style={styles.levelSubtitle}>
              {trailsCompleted}/{next.minTrails} sentiers pour {next.name}
            </Text>
          ) : (
            <Text style={styles.levelSubtitle}>Niveau maximum atteint</Text>
          )}
        </View>
      </View>
      <View style={styles.levelBarBg}>
        <View
          style={[
            styles.levelBarFill,
            {
              width: `${Math.round(progress * 100)}%`,
              backgroundColor: level.color,
            },
          ]}
        />
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  levelContainer: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
  },
  levelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  levelBadgeCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  levelNumber: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '800',
  },
  levelInfo: {
    flex: 1,
  },
  levelName: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
  },
  levelSubtitle: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  levelBarBg: {
    height: 8,
    backgroundColor: COLORS.border,
    borderRadius: BORDER_RADIUS.full,
    overflow: 'hidden',
  },
  levelBarFill: {
    height: '100%',
    borderRadius: BORDER_RADIUS.full,
  },
});

export default LevelBar;
