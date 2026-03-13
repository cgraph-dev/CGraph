/**
 * AnimatedButton - Pressable with animated press feedback and haptics
 */

import { durations } from '@cgraph/animation-constants';
import React, { useCallback } from 'react';
import { Pressable, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { SPRING_PRESETS } from './animation-library';

export interface AnimatedButtonProps {
  children: React.ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
  style?: StyleProp<ViewStyle>;
  pressStyle?: 'scale' | 'opacity' | 'glow' | 'bounce';
  hapticFeedback?: boolean;
  disabled?: boolean;
}

/**
 * Animated Button component.
 *
 */
export function AnimatedButton({
  children,
  onPress,
  onLongPress,
  style,
  pressStyle = 'scale',
  hapticFeedback = true,
  disabled = false,
}: AnimatedButtonProps) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const triggerHaptic = useCallback(() => {
    if (hapticFeedback) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [hapticFeedback]);

  const handlePressIn = useCallback(() => {
    if (disabled) return;

    switch (pressStyle) {
      case 'scale':
        scale.value = withSpring(0.95, SPRING_PRESETS.snappy);
        break;
      case 'opacity':
        opacity.value = withTiming(0.7, { duration: durations.instant.ms });
        break;
      case 'bounce':
        scale.value = withSequence(
          withSpring(0.9, SPRING_PRESETS.snappy),
          withSpring(1.05, SPRING_PRESETS.bouncy),
          withSpring(1, SPRING_PRESETS.default)
        );
        break;
      case 'glow':
        scale.value = withSpring(1.02, SPRING_PRESETS.snappy);
        break;
    }

    runOnJS(triggerHaptic)();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pressStyle, disabled, triggerHaptic]);

  const handlePressOut = useCallback(() => {
    if (disabled) return;

    switch (pressStyle) {
      case 'scale':
      case 'bounce':
      case 'glow':
        scale.value = withSpring(1, SPRING_PRESETS.default);
        break;
      case 'opacity':
        opacity.value = withTiming(1, { duration: durations.instant.ms });
        break;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pressStyle, disabled]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
    >
      <Animated.View style={[style, animatedStyle, disabled && styles.disabled]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  disabled: {
    opacity: 0.5,
  },
});
