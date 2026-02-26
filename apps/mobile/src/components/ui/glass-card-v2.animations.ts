/**
 * GlassCard V2 - Animation Hooks
 *
 * Manages all shared animation values, looping effects (border rotation,
 * shimmer, scanlines), and derived animated styles.
 */

import { useEffect } from 'react';
import {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import type { BorderAnimationMode } from './glass-card-v2.types';

export interface UseGlassAnimationsParams {
  borderGradient: boolean;
  borderAnimation: BorderAnimationMode;
  borderAnimationDuration: number;
  animated: boolean;
  shimmerSpeed: number;
  shimmerDirection: 'left' | 'right' | 'up' | 'down';
  scanlines: boolean;
  scanlineSpeed: number;
  glowIntensity: number;
}

/**
 * Sets up all animated shared values and derived animated styles for GlassCardV2.
 */
export function useGlassAnimations({
  borderGradient,
  borderAnimation,
  borderAnimationDuration,
  animated,
  shimmerSpeed,
  shimmerDirection,
  scanlines,
  scanlineSpeed,
  glowIntensity,
}: UseGlassAnimationsParams) {
  // Shared values
  const scale = useSharedValue(1);
  const glowOpacity = useSharedValue(0);
  const borderRotation = useSharedValue(0);
  const shimmerPosition = useSharedValue(0);
  const scanlineOffset = useSharedValue(0);
  const pressedShadow = useSharedValue(0);

  // Looping animations
  useEffect(() => {
    if (borderGradient && borderAnimation !== 'none') {
      switch (borderAnimation) {
        case 'rotate':
          borderRotation.value = withRepeat(
            withTiming(360, { duration: borderAnimationDuration, easing: Easing.linear }),
            -1,
            false
          );
          break;
        case 'pulse':
          borderRotation.value = withRepeat(
            withSequence(
              withTiming(10, { duration: borderAnimationDuration / 2 }),
              withTiming(0, { duration: borderAnimationDuration / 2 })
            ),
            -1,
            false
          );
          break;
        case 'breathe':
          glowOpacity.value = withRepeat(
            withSequence(
              withTiming(1, {
                duration: borderAnimationDuration / 2,
                easing: Easing.inOut(Easing.ease),
              }),
              withTiming(0.3, {
                duration: borderAnimationDuration / 2,
                easing: Easing.inOut(Easing.ease),
              })
            ),
            -1,
            false
          );
          break;
      }
    }

    if (animated) {
      shimmerPosition.value = withRepeat(
        withTiming(1, { duration: shimmerSpeed, easing: Easing.linear }),
        -1,
        false
      );
    }

    if (scanlines) {
      scanlineOffset.value = withRepeat(
        withTiming(1, { duration: scanlineSpeed, easing: Easing.linear }),
        -1,
        false
      );
    }
  }, [borderAnimation, animated, scanlines, borderAnimationDuration, shimmerSpeed, scanlineSpeed]);

  // Animated styles
  const animatedContainerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const animatedGlowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value * glowIntensity,
  }));

  const animatedBorderStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${borderRotation.value}deg` }],
  }));

  const animatedShimmerStyle = useAnimatedStyle(() => {
    const translateX = interpolate(
      shimmerPosition.value,
      [0, 1],
      shimmerDirection === 'right' ? [-300, 300] : [300, -300]
    );
    return { transform: [{ translateX }] };
  });

  const animatedScanlineStyle = useAnimatedStyle(() => {
    const translateY = interpolate(scanlineOffset.value, [0, 1], [0, 100]);
    return { transform: [{ translateY: `${translateY}%` }] };
  });

  const animatedShadowStyle = useAnimatedStyle(() => {
    const extraShadow = interpolate(pressedShadow.value, [0, 1], [0, 10]);
    return { shadowRadius: extraShadow, elevation: extraShadow };
  });

  return {
    // Raw shared values (needed by gesture handlers)
    scale,
    glowOpacity,
    pressedShadow,
    // Animated styles
    animatedContainerStyle,
    animatedGlowStyle,
    animatedBorderStyle,
    animatedShimmerStyle,
    animatedScanlineStyle,
    animatedShadowStyle,
  };
}
