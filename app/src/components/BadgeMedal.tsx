import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT_SIZE, SPACING, BORDER_RADIUS } from '@/constants';

interface BadgeMedalProps {
  name: string;
  icon: string;
  color: string;
  earned: boolean;
  description: string;
}

const BadgeMedal = React.memo(function BadgeMedal({
  name,
  icon,
  color,
  earned,
  description,
}: BadgeMedalProps) {
  return (
    <View
      style={styles.badgeMedal}
      accessibilityLabel={`${name}: ${earned ? 'debloque' : 'verrouille'}. ${description}`}
    >
      <View
        style={[
          styles.badgeMedalCircle,
          earned
            ? { backgroundColor: color, borderColor: color }
            : { backgroundColor: COLORS.surfaceLight, borderColor: COLORS.border },
        ]}
      >
        <Ionicons
          name={earned ? (icon as keyof typeof Ionicons.glyphMap) : 'lock-closed'}
          size={22}
          color={earned ? COLORS.white : COLORS.textMuted}
        />
      </View>
      <Text
        style={[
          styles.badgeMedalName,
          { color: earned ? COLORS.textPrimary : COLORS.textMuted },
        ]}
        numberOfLines={2}
      >
        {earned ? name : '???'}
      </Text>
    </View>
  );
});

const styles = StyleSheet.create({
  badgeMedal: {
    width: '23%',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  badgeMedalCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  badgeMedalName: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: FONT_SIZE.xs * 1.3,
  },
});

export default BadgeMedal;
