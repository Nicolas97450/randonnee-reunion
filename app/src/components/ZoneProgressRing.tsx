import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle as SvgCircle } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT_SIZE, SPACING } from '@/constants';

interface ZoneProgressRingProps {
  zoneName: string;
  completed: number;
  total: number;
  progress: number;
}

const ZoneProgressRing = React.memo(function ZoneProgressRing({
  zoneName,
  completed,
  total,
  progress,
}: ZoneProgressRingProps) {
  const isComplete = progress >= 1;
  const notStarted = progress === 0;
  const circumference = 2 * Math.PI * 25; // r=25 => ~157
  const strokeColor = isComplete ? COLORS.gold : notStarted ? COLORS.textMuted : COLORS.primaryLight;
  const pct = Math.round(progress * 100);

  return (
    <View style={styles.zoneRingItem}>
      <View style={styles.zoneRingCircle}>
        <Svg width={60} height={60}>
          {/* Background circle */}
          <SvgCircle
            cx={30}
            cy={30}
            r={25}
            stroke={COLORS.surfaceLight}
            strokeWidth={4}
            fill="none"
          />
          {/* Progress arc */}
          {progress > 0 && (
            <SvgCircle
              cx={30}
              cy={30}
              r={25}
              stroke={strokeColor}
              strokeWidth={4}
              fill="none"
              strokeDasharray={`${progress * circumference} ${circumference}`}
              strokeLinecap="round"
              rotation={-90}
              origin="30, 30"
            />
          )}
        </Svg>
        {/* Center content */}
        <View style={styles.zoneRingCenter}>
          {isComplete ? (
            <Ionicons name="checkmark" size={18} color={COLORS.gold} />
          ) : (
            <Text style={[styles.zoneRingPct, { color: strokeColor }]}>
              {pct}%
            </Text>
          )}
        </View>
      </View>
      <Text style={styles.zoneRingName} numberOfLines={2}>{zoneName}</Text>
      <Text style={styles.zoneRingCount}>{completed}/{total}</Text>
    </View>
  );
});

const styles = StyleSheet.create({
  zoneRingItem: {
    width: 76,
    alignItems: 'center',
    gap: 2,
  },
  zoneRingCircle: {
    width: 60,
    height: 60,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoneRingCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoneRingPct: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
  },
  zoneRingName: {
    fontSize: 9,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 11,
  },
  zoneRingCount: {
    fontSize: 9,
    color: COLORS.textMuted,
  },
});

export default ZoneProgressRing;
