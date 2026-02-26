/**
 * HolographicEffect - Iridescent gradient overlay
 */

import React, { useEffect } from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import {
  HolographicConfig,
  DEFAULT_HOLOGRAPHIC_CONFIG,
  sharedStyles,
} from './shared-effects-types';

// ============================================================================
// Types
// ============================================================================

export interface HolographicEffectProps {
  config?: Partial<HolographicConfig>;
  style?: StyleProp<ViewStyle>;
}

// ============================================================================
// Component
// ============================================================================

/**
 *
 */
export function HolographicEffect({ config, style }: HolographicEffectProps) {
  const mergedConfig = { ...DEFAULT_HOLOGRAPHIC_CONFIG, ...config };
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: mergedConfig.speed, easing: Easing.linear }),
      -1,
      false
    );
  }, [mergedConfig.speed]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <View style={[sharedStyles.effectContainer, style]} pointerEvents="none">
      <Animated.View style={[sharedStyles.holographicWrapper, animatedStyle]}>
        <LinearGradient
           
          colors={mergedConfig.colors as [string, string, ...string[]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[StyleSheet.absoluteFill, { opacity: mergedConfig.intensity }]}
        />
      </Animated.View>
    </View>
  );
}
