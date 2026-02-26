/**
 * GlassCard V2 - Gesture Handlers
 *
 * Press-in / press-out callbacks and long-press gesture setup.
 */

import { useCallback } from 'react';
import { withSpring, withTiming, runOnJS, type SharedValue } from 'react-native-reanimated';
import { Gesture } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { durations } from '@cgraph/animation-constants';
import type { PressAnimation } from './glass-card-v2.types';

export interface UseGlassGesturesParams {
  pressAnimation: PressAnimation;
  hapticFeedback: boolean;
  onLongPress?: () => void;
  scale: SharedValue<number>;
  glowOpacity: SharedValue<number>;
  pressedShadow: SharedValue<number>;
}

/**
 * Returns press handlers and a long-press gesture for GlassCardV2.
 */
export function useGlassGestures({
  pressAnimation,
  hapticFeedback,
  onLongPress,
  scale,
  glowOpacity,
  pressedShadow,
}: UseGlassGesturesParams) {
  const triggerHaptic = useCallback(() => {
    if (hapticFeedback) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [hapticFeedback]);

  const handlePressIn = useCallback(() => {
    if (pressAnimation === 'scale' || pressAnimation === 'all') {
      scale.value = withSpring(0.97, { damping: 15, stiffness: 400 });
    }
    if (pressAnimation === 'glow' || pressAnimation === 'all') {
      glowOpacity.value = withTiming(1, { duration: durations.fast.ms });
    }
    if (pressAnimation === 'shadow' || pressAnimation === 'all') {
      pressedShadow.value = withTiming(1, { duration: durations.fast.ms });
    }
    runOnJS(triggerHaptic)();
  }, [pressAnimation, triggerHaptic]);

  const handlePressOut = useCallback(() => {
    if (pressAnimation === 'scale' || pressAnimation === 'all') {
      scale.value = withSpring(1, { damping: 15, stiffness: 400 });
    }
    if (pressAnimation === 'glow' || pressAnimation === 'all') {
      glowOpacity.value = withTiming(0, { duration: durations.normal.ms });
    }
    if (pressAnimation === 'shadow' || pressAnimation === 'all') {
      pressedShadow.value = withTiming(0, { duration: durations.normal.ms });
    }
  }, [pressAnimation]);

  const longPressGesture = Gesture.LongPress()
    .minDuration(500)
    .onStart(() => {
      if (onLongPress) {
        runOnJS(triggerHaptic)();
        runOnJS(onLongPress)();
      }
    });

  return { handlePressIn, handlePressOut, longPressGesture };
}
