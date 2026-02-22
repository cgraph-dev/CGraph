import React, { ReactNode, useRef, useEffect } from 'react';
import { Animated, Easing, TextStyle } from 'react-native';
import { HolographicConfig, getTheme } from '../types';

interface HolographicTextProps {
  children: ReactNode;
  variant?: 'title' | 'subtitle' | 'body' | 'label';
  colorTheme?: HolographicConfig['colorTheme'];
  animate?: boolean;
  glowIntensity?: number;
  style?: TextStyle;
}

export function HolographicText({
  children,
  variant = 'body',
  colorTheme = 'cyan',
  animate = true,
  glowIntensity = 1,
  style,
}: HolographicTextProps) {
  const theme = getTheme(colorTheme);
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!animate) return;

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: false,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: false,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
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

  const textShadowRadius = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [5 * glowIntensity, 15 * glowIntensity],
  });

  return (
    <Animated.Text
      style={[
        variantStyles[variant],
        {
          color: theme.primary,
          textShadowColor: theme.glow,
          textShadowOffset: { width: 0, height: 0 },
          textShadowRadius: animate ? textShadowRadius : 10 * glowIntensity,
        },
        style,
      ]}
    >
      {children}
    </Animated.Text>
  );
}
