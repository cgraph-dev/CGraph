/**
 * PressableFeedback - Press state animations
 */

import React, { useCallback } from 'react';
import { StyleSheet, GestureResponderEvent, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { SPRING_PRESETS } from '../../../animations/animation-library';
import { PressableFeedbackProps } from '../types';
import { styles } from '../styles';

/**
 *
 */
export function PressableFeedback({
  children,
  pressStyle = 'scale',
  scaleAmount = 0.95,
  opacityAmount = 0.7,
  glowColor = '#10b981',
  hapticFeedback = true,
  hapticStyle = Haptics.ImpactFeedbackStyle.Light,
  springPreset = 'snappy',
  style,
  onPressIn,
  onPressOut,
  onPress,
  ...pressableProps
}: PressableFeedbackProps) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const glowOpacity = useSharedValue(0);
  const shadowRadius = useSharedValue(4);
  const translateY = useSharedValue(0);

  const springConfig = SPRING_PRESETS[springPreset];
  const pressStyles = Array.isArray(pressStyle) ? pressStyle : [pressStyle];

  const handlePressIn = useCallback(
    (e: GestureResponderEvent) => {
      if (pressStyles.includes('scale')) {
        scale.value = withSpring(scaleAmount, springConfig);
      }
      if (pressStyles.includes('opacity')) {
        opacity.value = withTiming(opacityAmount, { duration: 100 });
      }
      if (pressStyles.includes('glow')) {
        glowOpacity.value = withTiming(0.5, { duration: 150 });
      }
      if (pressStyles.includes('shadow')) {
        shadowRadius.value = withSpring(12, springConfig);
      }
      if (pressStyles.includes('lift')) {
        translateY.value = withSpring(-4, springConfig);
        shadowRadius.value = withSpring(16, springConfig);
      }

      onPressIn?.(e);
    },
    [
      pressStyles,
      scaleAmount,
      opacityAmount,
      springConfig,
      onPressIn,
      scale,
      opacity,
      glowOpacity,
      shadowRadius,
      translateY,
    ]
  );

  const handlePressOut = useCallback(
    (e: GestureResponderEvent) => {
      scale.value = withSpring(1, springConfig);
      opacity.value = withTiming(1, { duration: 100 });
      glowOpacity.value = withTiming(0, { duration: 200 });
      shadowRadius.value = withSpring(4, springConfig);
      translateY.value = withSpring(0, springConfig);

      onPressOut?.(e);
    },
    [springConfig, onPressOut, scale, opacity, glowOpacity, shadowRadius, translateY]
  );

  const handlePress = useCallback(
    (e: GestureResponderEvent) => {
      if (hapticFeedback) {
        Haptics.impactAsync(hapticStyle);
      }
      onPress?.(e);
    },
    [hapticFeedback, hapticStyle, onPress]
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateY: translateY.value }],
    opacity: opacity.value,
    shadowRadius: shadowRadius.value,
    shadowOpacity: interpolate(shadowRadius.value, [4, 16], [0.15, 0.3]),
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      {...pressableProps}
    >
      <Animated.View style={[style, animatedStyle]}>
        {/* Glow effect */}
        {pressStyles.includes('glow') && (
          <Animated.View
            style={[StyleSheet.absoluteFill, styles.glow, { shadowColor: glowColor }, glowStyle]}
          />
        )}
        {children}
      </Animated.View>
    </Pressable>
  );
}
