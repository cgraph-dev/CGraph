/**
 * ErrorAnimation - Animated error feedback
 */

import { durations } from '@cgraph/animation-constants';
import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  withDelay,
  runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { SPRING_PRESETS } from '../../../animations/animation-library';
import { ErrorAnimationProps } from '../types';
import { styles } from '../styles';

/**
 *
 */
export function ErrorAnimation({
  visible,
  size = 80,
  color = '#ef4444',
  shake = true,
  onComplete,
  style,
}: ErrorAnimationProps) {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const rotation = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      // Reset
      scale.value = 0;
      opacity.value = 0;
      rotation.value = 0;

      // Animate
      opacity.value = withTiming(1, { duration: durations.normal.ms });
      scale.value = withSpring(1, SPRING_PRESETS.bouncy);

      // Shake animation
      if (shake) {
        rotation.value = withDelay(
          200,
          withSequence(
            withTiming(10, { duration: durations.stagger.ms }),
            withTiming(-10, { duration: durations.stagger.ms }),
            withTiming(10, { duration: durations.stagger.ms }),
            withTiming(-10, { duration: durations.stagger.ms }),
            withTiming(0, { duration: durations.stagger.ms }, () => {
              if (onComplete) {
                runOnJS(onComplete)();
              }
            })
          )
        );
      } else if (onComplete) {
        rotation.value = withDelay(
          400,
          withTiming(0, { duration: 1 }, () => {
            runOnJS(onComplete)();
          })
        );
      }

      // Haptic
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } else {
      opacity.value = withTiming(0, { duration: durations.normal.ms });
      scale.value = withTiming(0, { duration: durations.normal.ms });
    }
  }, [visible, shake, onComplete, scale, opacity, rotation]);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }, { rotate: `${rotation.value}deg` }],
  }));

  if (!visible && opacity.value === 0) return null;

  return (
    <Animated.View
      style={[styles.feedbackContainer, { width: size, height: size }, style, containerStyle]}
    >
      <View
        style={[
          styles.feedbackCircle,
          { width: size, height: size, borderRadius: size / 2, backgroundColor: color },
        ]}
      >
        {/* X mark */}
        <Animated.Text style={[styles.feedbackIcon, { fontSize: size * 0.5 }]}>✕</Animated.Text>
      </View>
    </Animated.View>
  );
}
