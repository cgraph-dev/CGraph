/**
 * AnimatedView - Animated container with entering/exiting/loop presets
 */

import React, { useEffect } from 'react';
import { ViewStyle, StyleProp } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  Layout,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';

import { SPRING_PRESETS, LOOP_ANIMATIONS } from './animation-library';
import { ENTERING_PRESETS, EXITING_PRESETS, LAYOUT_PRESETS } from './animation-presets';

export interface AnimatedViewProps {
  children: React.ReactNode;
  entering?: keyof typeof ENTERING_PRESETS;
  exiting?: keyof typeof EXITING_PRESETS;
  layout?: keyof typeof LAYOUT_PRESETS;
  delay?: number;
  duration?: number;
  springConfig?: keyof typeof SPRING_PRESETS;
  style?: StyleProp<ViewStyle>;
  loop?: keyof typeof LOOP_ANIMATIONS;
  onAnimationComplete?: () => void;
}

/**
 *
 */
export function AnimatedView({
  children,
  entering = 'fadeIn',
  exiting = 'fadeOut',
  layout = 'default',
  delay = 0,
  duration = 300,
  springConfig = 'default',
  style,
  loop,
  onAnimationComplete,
}: AnimatedViewProps) {
  const EnteringAnimation = ENTERING_PRESETS[entering];
  const ExitingAnimation = EXITING_PRESETS[exiting];
  const _LayoutAnimation = LAYOUT_PRESETS[layout];
  const _spring = SPRING_PRESETS[springConfig];

  // Loop animation values
  const loopProgress = useSharedValue(0);

  useEffect(() => {
    if (loop && LOOP_ANIMATIONS[loop]) {
      const loopConfig = LOOP_ANIMATIONS[loop];
      loopProgress.value = withRepeat(withTiming(1, { duration: loopConfig.duration }), -1, true);
    }
  }, [loop]);

  const loopStyle = useAnimatedStyle(() => {
    if (!loop || !LOOP_ANIMATIONS[loop]) return {};

    const loopConfig = LOOP_ANIMATIONS[loop];
    const { keyframes } = loopConfig;
    const step = loopProgress.value * (keyframes.length - 1);
    const currentIndex = Math.floor(step);
    const nextIndex = Math.min(currentIndex + 1, keyframes.length - 1);
    const progress = step - currentIndex;

    const current = keyframes[currentIndex] || {};
    const next = keyframes[nextIndex] || {};

    const result: ViewStyle = {
      transform: [],
    };

    // Interpolate numeric values
    if ('scale' in current && 'scale' in next) {
      const scale = interpolate(
        progress,
        [0, 1],
         
        [current.scale as number, next.scale as number],
        Extrapolation.CLAMP
      );
       
      (result.transform as unknown[]).push({ scale });
    }

    if ('translateX' in current && 'translateX' in next) {
      const translateX = interpolate(
        progress,
        [0, 1],
         
        [current.translateX as number, next.translateX as number],
        Extrapolation.CLAMP
      );
       
      (result.transform as unknown[]).push({ translateX });
    }

    if ('translateY' in current && 'translateY' in next) {
      const translateY = interpolate(
        progress,
        [0, 1],
         
        [current.translateY as number, next.translateY as number],
        Extrapolation.CLAMP
      );
       
      (result.transform as unknown[]).push({ translateY });
    }

    if ('opacity' in current && 'opacity' in next) {
      result.opacity = interpolate(
        progress,
        [0, 1],
         
        [current.opacity as number, next.opacity as number],
        Extrapolation.CLAMP
      );
    }

    return result;
  });

  // Configure animations - use springify only if available
  const enteringConfig = EnteringAnimation.delay(delay).duration(duration);

  const exitingConfig = ExitingAnimation.duration(duration);

  return (
    <Animated.View
      entering={enteringConfig}
      exiting={exitingConfig}
      layout={Layout}
      style={[style, loop ? loopStyle : undefined]}
    >
      {children}
    </Animated.View>
  );
}
