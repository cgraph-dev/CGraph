import React, { useEffect, useRef, useState } from 'react';
import { Text, Animated, Easing, TextStyle, StyleSheet } from 'react-native';

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
  const animValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animate to the new value
    Animated.timing(animValue, {
      toValue: value,
      duration,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();

    // Listen to animation updates and update display value
    const listener = animValue.addListener(({ value: v }) => {
      setDisplayValue(Math.floor(v));
    });

    return () => {
      animValue.removeListener(listener);
    };
  }, [value, animValue, duration]);

  return <Text style={[styles.defaultText, style]}>{displayValue.toLocaleString()}</Text>;
}

const styles = StyleSheet.create({
  defaultText: {
    fontVariant: ['tabular-nums'],
  },
});

export default AnimatedCounter;
