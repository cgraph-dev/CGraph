import React, { useEffect, useState } from 'react';
import { Text, TextStyle, StyleSheet } from 'react-native';
import {
  useSharedValue,
  withTiming,
  useAnimatedReaction,
  runOnJS,
  Easing,
} from 'react-native-reanimated';

interface AnimatedCounterProps {
  value: number;
  style?: TextStyle;
  duration?: number;
}

/**
 * Animated Counter Component
 *
 * Displays a number that animates smoothly when the value changes.
 * Features:
 * - Smooth number transitions with easing
 * - Locale-formatted output with commas
 * - Configurable animation duration
 */
export function AnimatedCounter({ value, style, duration = 1000 }: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const animValue = useSharedValue(0);

  useEffect(() => {
    animValue.value = withTiming(value, { duration, easing: Easing.out(Easing.cubic) });
  }, [value, animValue, duration]);

  useAnimatedReaction(
    () => animValue.value,
    (currentValue) => {
      runOnJS(setDisplayValue)(Math.floor(currentValue));
    }
  );

  return <Text style={[styles.defaultText, style]}>{displayValue.toLocaleString()}</Text>;
}

const styles = StyleSheet.create({
  defaultText: {
    fontVariant: ['tabular-nums'],
  },
});

export default AnimatedCounter;
