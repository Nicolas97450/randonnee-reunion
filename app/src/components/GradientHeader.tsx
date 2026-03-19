import React from 'react';
import { StyleSheet, View } from 'react-native';
import { COLORS } from '@/constants';

interface GradientHeaderProps {
  height?: number;
}

/**
 * Simulated gradient header using stacked View layers with decreasing opacity.
 * Uses the primary forest green color fading to transparent.
 * No expo-linear-gradient dependency required.
 */
function GradientHeader({ height = 120 }: GradientHeaderProps) {
  const layerHeight = height / 5;

  return (
    <View style={[styles.container, { height }]} pointerEvents="none">
      <View style={[styles.layer, { height: layerHeight, opacity: 0.35, backgroundColor: COLORS.primary }]} />
      <View style={[styles.layer, { height: layerHeight, opacity: 0.25, backgroundColor: COLORS.primary }]} />
      <View style={[styles.layer, { height: layerHeight, opacity: 0.15, backgroundColor: COLORS.primary }]} />
      <View style={[styles.layer, { height: layerHeight, opacity: 0.08, backgroundColor: COLORS.primary }]} />
      <View style={[styles.layer, { height: layerHeight, opacity: 0.02, backgroundColor: COLORS.primary }]} />
    </View>
  );
}

export default React.memo(GradientHeader);

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1,
  },
  layer: {
    width: '100%',
  },
});
