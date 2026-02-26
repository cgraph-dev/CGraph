/**
 * SuccessAnimation - Animated success feedback
 */

import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  interpolate,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { SPRING_PRESETS } from '../../../animations/animation-library';
import { SuccessAnimationProps } from '../types';
import { styles } from '../styles';

/**
 *
 */
export function SuccessAnimation({
  visible,
  size = 80,
  color = '#10b981',
  onComplete,
  style,
}: SuccessAnimationProps) {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const checkProgress = useSharedValue(0);
  const ringScale = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      // Reset
      scale.value = 0;
      opacity.value = 0;
      checkProgress.value = 0;
      ringScale.value = 0;

      // Animate
      opacity.value = withTiming(1, { duration: 200 });
      scale.value = withSpring(1, SPRING_PRESETS.bouncy);
      ringScale.value = withSpring(1, { ...SPRING_PRESETS.bouncy, damping: 8 });

      // Checkmark animation
      checkProgress.value = withDelay(
        200,
        withTiming(1, { duration: 400, easing: Easing.out(Easing.cubic) }, () => {
          if (onComplete) {
            runOnJS(onComplete)();
          }
        })
      );

      // Haptic
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      opacity.value = withTiming(0, { duration: 200 });
      scale.value = withTiming(0, { duration: 200 });
    }
  }, [visible, onComplete, scale, opacity, checkProgress, ringScale]);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale.value }],
    opacity: interpolate(ringScale.value, [0, 0.5, 1], [0, 1, 0.6]),
  }));

  if (!visible && opacity.value === 0) return null;

  return (
    <Animated.View
      style={[styles.feedbackContainer, { width: size, height: size }, style, containerStyle]}
    >
      {/* Ring animation */}
      <Animated.View
        style={[
          styles.ring,
          {
            width: size * 1.5,
            height: size * 1.5,
            borderRadius: size * 0.75,
            borderColor: color,
          },
          ringStyle,
        ]}
      />

      {/* Circle background */}
      <View
        style={[
          styles.feedbackCircle,
          { width: size, height: size, borderRadius: size / 2, backgroundColor: color },
        ]}
      >
        {/* Checkmark */}
        <Animated.Text style={[styles.feedbackIcon, { fontSize: size * 0.5 }]}>✓</Animated.Text>
      </View>
    </Animated.View>
  );
}
