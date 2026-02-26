/**
 * GlitchEffect - Controlled glitch/chaos overlay
 */

import { durations } from '@cgraph/animation-constants';
import React, { useEffect } from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  interpolate,
  SharedValue,
} from 'react-native-reanimated';
import { GlitchConfig, DEFAULT_GLITCH_CONFIG } from './shared-effects-types';

// ============================================================================
// Types
// ============================================================================

export interface GlitchEffectProps {
  config?: Partial<GlitchConfig>;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

// ============================================================================
// Internal Components
// ============================================================================

interface GlitchColorLayerProps {
  color: string;
  offset: SharedValue<number>;
}

function GlitchColorLayer({ color, offset }: GlitchColorLayerProps) {
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: offset.value }],
    backgroundColor: color,
  }));

  return <Animated.View style={[StyleSheet.absoluteFill, animatedStyle]} pointerEvents="none" />;
}

// ============================================================================
// Component
// ============================================================================

/**
 *
 */
export function GlitchEffect({ config, style, children }: GlitchEffectProps) {
  const mergedConfig = { ...DEFAULT_GLITCH_CONFIG, ...config };

  const glitchActive = useSharedValue(0);

  // Pre-create a fixed number of shared values (max slice count)
  // Using individual hooks to satisfy React's rules of hooks
  const slice0 = useSharedValue(0);
  const slice1 = useSharedValue(0);
  const slice2 = useSharedValue(0);
  const slice3 = useSharedValue(0);
  const slice4 = useSharedValue(0);
  const sliceOffsets = [slice0, slice1, slice2, slice3, slice4].slice(0, mergedConfig.sliceCount);

  useEffect(() => {
    const triggerGlitch = () => {
      // Activate glitch
      glitchActive.value = withSequence(
        withTiming(1, { duration: durations.stagger.ms }),
        withDelay(mergedConfig.duration, withTiming(0, { duration: durations.stagger.ms }))
      );

      // Randomize slice offsets
      sliceOffsets.forEach((offset) => {
        const randomOffset = (Math.random() - 0.5) * 20 * mergedConfig.intensity;
        offset.value = withSequence(
          withTiming(randomOffset, { duration: durations.stagger.ms }),
          withDelay(mergedConfig.duration, withTiming(0, { duration: durations.stagger.ms }))
        );
      });
    };

    const interval = setInterval(triggerGlitch, 1000 / mergedConfig.frequency);
    return () => clearInterval(interval);
  }, [mergedConfig.frequency, mergedConfig.intensity, mergedConfig.duration, sliceOffsets]);

  const mainStyle = useAnimatedStyle(() => ({
    opacity: interpolate(glitchActive.value, [0, 1], [1, 0.95]),
  }));

  return (
    <View style={[style]}>
      <Animated.View style={mainStyle}>{children}</Animated.View>

      {/* Color shift overlays */}
      {mergedConfig.colorShift && (
        <>
          <GlitchColorLayer color="rgba(255, 0, 0, 0.1)" offset={sliceOffsets[0]} />
          <GlitchColorLayer color="rgba(0, 255, 255, 0.1)" offset={sliceOffsets[1]} />
        </>
      )}
    </View>
  );
}
