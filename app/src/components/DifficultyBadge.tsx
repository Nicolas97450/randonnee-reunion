import { StyleSheet, Text, View } from 'react-native';
import { COLORS, FONT_SIZE, SPACING, BORDER_RADIUS } from '@/constants';
import type { Difficulty } from '@/types';
import { getDifficultyLabel } from '@/lib/formatters';

const DIFFICULTY_COLORS: Record<Difficulty, string> = {
  facile: COLORS.easy,
  moyen: COLORS.medium,
  difficile: COLORS.hard,
  expert: COLORS.expert,
};

interface Props {
  difficulty: Difficulty;
}

export default function DifficultyBadge({ difficulty }: Props) {
  const color = DIFFICULTY_COLORS[difficulty];

  return (
    <View style={[styles.badge, { backgroundColor: color + '20' }]}>
      <Text style={[styles.text, { color }]}>{getDifficultyLabel(difficulty)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
});
