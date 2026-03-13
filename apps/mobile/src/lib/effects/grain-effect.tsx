/**
 * GrainEffect - Film grain overlay
 */

import React, { useEffect, useMemo } from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { GrainConfig, DEFAULT_GRAIN_CONFIG, sharedStyles } from './shared-effects-types';

// ============================================================================
// Types
// ============================================================================

export interface GrainEffectProps {
  config?: Partial<GrainConfig>;
  style?: StyleProp<ViewStyle>;
}

// ============================================================================
// Component
// ============================================================================

/**
 * Grain Effect component.
 *
 */
export function GrainEffect({ config, style }: GrainEffectProps) {
  const mergedConfig = { ...DEFAULT_GRAIN_CONFIG, ...config };
  const noiseOffset = useSharedValue(0);

  useEffect(() => {
    if (mergedConfig.animated) {
      noiseOffset.value = withRepeat(
        withTiming(100, { duration: mergedConfig.speed, easing: Easing.linear }),
        -1,
        false
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mergedConfig.animated, mergedConfig.speed]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: noiseOffset.value % 10 }, { translateY: noiseOffset.value % 7 }],
  }));

  // Generate pseudo-noise pattern
  const dotCount = 200;
  const dots = useMemo(
    () =>
      Array.from({ length: dotCount }, (_, _i) => ({
        x: Math.random() * 100,
        y: Math.random() * 100,
        opacity: Math.random() * mergedConfig.opacity,
        size: Math.random() * mergedConfig.size + 1,
      })),
    [mergedConfig.opacity, mergedConfig.size]
  );

  return (
    <View style={[sharedStyles.effectContainer, style]} pointerEvents="none">
      <Animated.View style={[StyleSheet.absoluteFill, animatedStyle]}>
        {dots.map((dot, i) => (
          <View
            key={i}
            style={[
              sharedStyles.grainDot,
              {
                left: `${dot.x}%`,
                top: `${dot.y}%`,
                width: dot.size,
                height: dot.size,
                opacity: dot.opacity,
              },
            ]}
          />
        ))}
      </Animated.View>
    </View>
  );
}
