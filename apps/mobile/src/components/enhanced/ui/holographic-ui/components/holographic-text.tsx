/**
 * Holographic-themed text component with animated shimmer and glow effects.
 * @module components/enhanced/ui/holographic-ui/HolographicText
 */
import { durations } from '@cgraph/animation-constants';
import React, { ReactNode, useEffect } from 'react';
import { TextStyle } from 'react-native';
import Animated, {
  useSharedValue,
  withTiming,
  withRepeat,
  withSequence,
  useAnimatedStyle,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { HolographicConfig, getTheme } from '../types';

interface HolographicTextProps {
  children: ReactNode;
  variant?: 'title' | 'subtitle' | 'body' | 'label';
  colorTheme?: HolographicConfig['colorTheme'];
  animate?: boolean;
  glowIntensity?: number;
  style?: TextStyle;
}

/**
 * Holographic Text component.
 *
 */
export function HolographicText({
  children,
  variant = 'body',
  colorTheme = 'cyan',
  animate = true,
  glowIntensity = 1,
  style,
}: HolographicTextProps) {
  const theme = getTheme(colorTheme);
  const glowAnim = useSharedValue(0);

  useEffect(() => {
    if (!animate) return;

    glowAnim.value = withRepeat(
      withSequence(
        withTiming(1, { duration: durations.loop.ms, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: durations.loop.ms, easing: Easing.inOut(Easing.sin) })
      ),
      -1
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animate]);

  const variantStyles: Record<string, TextStyle> = {
    title: {
      fontSize: 32,
      fontWeight: '900',
      letterSpacing: 2,
    },
    subtitle: {
      fontSize: 22,
      fontWeight: '700',
      letterSpacing: 1,
    },
    body: {
      fontSize: 16,
      fontWeight: '500',
    },
    label: {
      fontSize: 12,
      fontWeight: '600',
      letterSpacing: 2,
      textTransform: 'uppercase',
    },
  };

  const textAnimStyle = useAnimatedStyle(() => ({
    textShadowRadius: animate
      ? interpolate(glowAnim.value, [0, 1], [5 * glowIntensity, 15 * glowIntensity])
      : 10 * glowIntensity,
  }));

  return (
    <Animated.Text
      style={[
        variantStyles[variant],
        {
          color: theme.primary,
          textShadowColor: theme.glow,
          textShadowOffset: { width: 0, height: 0 },
        },
        textAnimStyle,
        style,
      ]}
    >
      {children}
    </Animated.Text>
  );
}
