/**
 * CRTEffect - CRT monitor simulation (scanlines + vignette + flicker + curvature)
 */

import { durations } from '@cgraph/animation-constants';
import React, { useEffect } from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
} from 'react-native-reanimated';
import { CRTConfig, DEFAULT_CRT_CONFIG } from './shared-effects-types';
import { ScanlineEffect } from './scanline-effect';
import { VignetteEffect } from './vignette-effect';

// ============================================================================
// Types
// ============================================================================

export interface CRTEffectProps {
  config?: Partial<CRTConfig>;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

// ============================================================================
// Component
// ============================================================================

/**
 * C R T Effect component.
 *
 */
export function CRTEffect({ config, style, children }: CRTEffectProps) {
  const mergedConfig = { ...DEFAULT_CRT_CONFIG, ...config };
  const flickerOpacity = useSharedValue(1);

  useEffect(() => {
    if (mergedConfig.flicker) {
      flickerOpacity.value = withRepeat(
        withSequence(
          withTiming(1 - mergedConfig.flickerIntensity, { duration: durations.stagger.ms }),
          withTiming(1, { duration: durations.stagger.ms }),
          withTiming(1 - mergedConfig.flickerIntensity * 0.5, { duration: durations.instant.ms }),
          withTiming(1, { duration: durations.instant.ms })
        ),
        -1,
        false
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mergedConfig.flicker, mergedConfig.flickerIntensity]);

  const flickerStyle = useAnimatedStyle(() => ({
    opacity: flickerOpacity.value,
  }));

  return (
    <View style={[style]}>
      <Animated.View style={[{ flex: 1 }, flickerStyle]}>{children}</Animated.View>

      {/* Scanlines */}
      {mergedConfig.scanlines && (
        <ScanlineEffect
          config={{
            opacity: 0.08,
            spacing: 3,
            thickness: 1,
            animated: true,
            speed: 5000,
          }}
        />
      )}

      {/* Vignette */}
      {mergedConfig.vignette && (
        <VignetteEffect
          config={{
            intensity: 0.4,
            radius: 0.8,
          }}
        />
      )}

      {/* Screen curvature overlay */}
      {mergedConfig.curvature > 0 && (
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              borderRadius: 30 * mergedConfig.curvature,
              borderWidth: 2,
              borderColor: 'rgba(0, 0, 0, 0.3)',
            },
          ]}
          pointerEvents="none"
        />
      )}
    </View>
  );
}
