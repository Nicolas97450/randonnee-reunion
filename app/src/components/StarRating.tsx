import React from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants';

interface StarRatingProps {
  rating: number;
  size?: number;
  gap?: number;
}

export default function StarRating({ rating, size = 14, gap = 2 }: StarRatingProps) {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    if (i <= Math.floor(rating)) {
      stars.push(
        <Ionicons key={i} name="star" size={size} color={COLORS.warm} />
      );
    } else if (i - rating < 1 && i - rating > 0) {
      stars.push(
        <Ionicons key={i} name="star-half" size={size} color={COLORS.warm} />
      );
    } else {
      stars.push(
        <Ionicons key={i} name="star-outline" size={size} color={COLORS.textMuted} />
      );
    }
  }
  return (
    <View style={{ flexDirection: 'row', gap }}>
      {stars}
    </View>
  );
}
