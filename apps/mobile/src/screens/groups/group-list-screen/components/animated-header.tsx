/**
 * AnimatedHeader Component
 *
 * Header with animated create button.
 */

import { durations } from '@cgraph/animation-constants';
import React, { useEffect } from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import type { AnimatedHeaderProps } from '../types';

/**
 * Animated Header component.
 *
 */
export function AnimatedHeader({ colors, onCreatePress }: AnimatedHeaderProps) {
  const pulseAnim = useSharedValue(1);
  const rotateAnim = useSharedValue(0);

  useEffect(() => {
    // Continuous pulse animation
    pulseAnim.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: durations.verySlow.ms }),
        withTiming(1, { duration: durations.verySlow.ms })
      ),
      -1,
      false
    );
  }, [pulseAnim]);

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    rotateAnim.value = withSequence(
      withTiming(1, { duration: durations.normal.ms, easing: Easing.out(Easing.back(2)) }),
      withTiming(0, { duration: durations.normal.ms })
    );

    onCreatePress();
  };

  const buttonStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: pulseAnim.value },
      { rotate: `${interpolate(rotateAnim.value, [0, 1], [0, 90])}deg` },
    ],
  }));

  return (
    <TouchableOpacity onPress={handlePress} style={styles.headerButton}>
      <Animated.View style={buttonStyle}>
        <LinearGradient colors={['#8b5cf6', '#7c3aed']} style={styles.headerButtonGradient}>
          <Ionicons name="add" size={20} color="#fff" />
        </LinearGradient>
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  headerButton: {
    marginRight: 16,
  },
  headerButtonGradient: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
});
