/**
 * VignetteEffect - Edge darkening / vignette overlay
 */

import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp, Dimensions } from 'react-native';
import { VignetteConfig, DEFAULT_VIGNETTE_CONFIG, sharedStyles } from './shared-effects-types';

// ============================================================================
// Types
// ============================================================================

export interface VignetteEffectProps {
  config?: Partial<VignetteConfig>;
  style?: StyleProp<ViewStyle>;
}

// ============================================================================
// Component
// ============================================================================

/**
 * Vignette Effect component.
 *
 */
export function VignetteEffect({ config, style }: VignetteEffectProps) {
  const mergedConfig = { ...DEFAULT_VIGNETTE_CONFIG, ...config };

  return (
    <View style={[sharedStyles.effectContainer, style]} pointerEvents="none">
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            // Radial gradient simulation using border radius
            borderRadius: 9999,
            transform: [{ scale: 2 }],
            backgroundColor: 'transparent',
            borderWidth: Dimensions.get('window').width * (1 - mergedConfig.radius),
            borderColor: mergedConfig.color,
            opacity: mergedConfig.intensity,
          },
        ]}
      />
    </View>
  );
}
