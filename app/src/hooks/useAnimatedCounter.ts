import { useEffect, useState } from 'react';
import { useSharedValue, useAnimatedReaction, withTiming, Easing, runOnJS } from 'react-native-reanimated';

export function useAnimatedCounter(targetValue: number): number {
  const shared = useSharedValue(0);
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    shared.value = withTiming(targetValue, {
      duration: 1000,
      easing: Easing.out(Easing.cubic),
    });
  }, [targetValue, shared]);

  useAnimatedReaction(
    () => Math.round(shared.value),
    (current, previous) => {
      if (current !== previous) {
        runOnJS(setDisplayValue)(current);
      }
    },
    [shared],
  );

  return displayValue;
}
