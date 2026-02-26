/**
 * ScanlineEffect - Animated scanline overlay
 */

import React, { useEffect } from 'react';
import { View, StyleSheet, ViewStyle, StyleProp, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import {
  ScanlineConfig,
  DEFAULT_SCANLINE_CONFIG,
  sharedStyles,
} from './shared-effects-types';

// ============================================================================
// Types
// ============================================================================

export interface ScanlineEffectProps {
  config?: Partial<ScanlineConfig>;
  style?: StyleProp<ViewStyle>;
}

// ============================================================================
// Component
// ============================================================================

/**
 *
 */
export function ScanlineEffect({ config, style }: ScanlineEffectProps) {
  const mergedConfig = { ...DEFAULT_SCANLINE_CONFIG, ...config };
  const scanlineOffset = useSharedValue(0);

  useEffect(() => {
    if (mergedConfig.animated) {
      scanlineOffset.value = withRepeat(
        withTiming(1, { duration: mergedConfig.speed, easing: Easing.linear }),
        -1,
        false
      );
    }
  }, [mergedConfig.animated, mergedConfig.speed]);

  const animatedStyle = useAnimatedStyle(() => {
    const offset = interpolate(scanlineOffset.value, [0, 1], [0, 100]);
    return {
      transform: [
        mergedConfig.direction === 'horizontal' ? { translateY: offset } : { translateX: offset },
      ],
    };
  });

  const lineCount = Math.ceil(
    (mergedConfig.direction === 'horizontal'
      ? Dimensions.get('window').height
      : Dimensions.get('window').width) /
      (mergedConfig.spacing + mergedConfig.thickness)
  );

  return (
    <View style={[sharedStyles.effectContainer, style]} pointerEvents="none">
      {/* Static scanline pattern */}
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            opacity: mergedConfig.opacity,
          },
        ]}
      >
        {Array.from({ length: lineCount * 2 }).map((_, i) => (
          <View
            key={i}
            style={[
              sharedStyles.scanline,
              {
                backgroundColor: mergedConfig.color,
                height: mergedConfig.thickness,
                top: i * (mergedConfig.spacing + mergedConfig.thickness),
              },
            ]}
          />
        ))}
      </View>

      {/* Animated sweep line */}
      {mergedConfig.animated && (
        <Animated.View
          style={[
            sharedStyles.sweepLine,
            {
              backgroundColor: mergedConfig.color,
              opacity: mergedConfig.opacity * 3,
            },
            animatedStyle,
          ]}
        />
      )}
    </View>
  );
}
