/**
 * ChromaticEffect - RGB channel split / chromatic aberration
 */

import React, { useEffect } from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
} from 'react-native-reanimated';
import { ChromaticConfig, DEFAULT_CHROMATIC_CONFIG } from './shared-effects-types';

// ============================================================================
// Types
// ============================================================================

export interface ChromaticEffectProps {
  config?: Partial<ChromaticConfig>;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

// ============================================================================
// Component
// ============================================================================

/**
 *
 */
export function ChromaticEffect({ config, style, children }: ChromaticEffectProps) {
  const mergedConfig = { ...DEFAULT_CHROMATIC_CONFIG, ...config };
  const pulseValue = useSharedValue(1);

  useEffect(() => {
    if (mergedConfig.animated) {
      pulseValue.value = withRepeat(
        withSequence(
          withTiming(1.5, { duration: mergedConfig.pulseSpeed / 2 }),
          withTiming(1, { duration: mergedConfig.pulseSpeed / 2 })
        ),
        -1,
        false
      );
    }
  }, [mergedConfig.animated, mergedConfig.pulseSpeed]);

  const angleRad = (mergedConfig.angle * Math.PI) / 180;
  const offsetX = Math.cos(angleRad) * mergedConfig.offset;
  const offsetY = Math.sin(angleRad) * mergedConfig.offset;

  const redStyle = useAnimatedStyle(() => {
    const scale = mergedConfig.animated ? pulseValue.value : 1;
    return {
      transform: [{ translateX: -offsetX * scale }, { translateY: -offsetY * scale }],
    };
  });

  const blueStyle = useAnimatedStyle(() => {
    const scale = mergedConfig.animated ? pulseValue.value : 1;
    return {
      transform: [{ translateX: offsetX * scale }, { translateY: offsetY * scale }],
    };
  });

  return (
    <View style={[style]}>
      {/* Red channel offset */}
      <Animated.View
        style={[StyleSheet.absoluteFill, { opacity: 0.5 }, redStyle]}
        pointerEvents="none"
      >
        <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(255, 0, 0, 0.1)' }]} />
      </Animated.View>

      {/* Main content */}
      {children}

      {/* Blue channel offset */}
      <Animated.View
        style={[StyleSheet.absoluteFill, { opacity: 0.5 }, blueStyle]}
        pointerEvents="none"
      >
        <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0, 0, 255, 0.1)' }]} />
      </Animated.View>
    </View>
  );
}
