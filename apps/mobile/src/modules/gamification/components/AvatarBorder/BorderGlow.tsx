/**
 * BorderGlow — pulsing glow effect behind LEGENDARY/MYTHIC borders.
 *
 * Uses Reanimated v4 shared values for shadow animation.
 * Only renders for LEGENDARY and MYTHIC rarity tiers.
 *
 * @module gamification/components/AvatarBorder/BorderGlow
 */

import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  cancelAnimation,
} from 'react-native-reanimated';
import {
  BORDER_RARITY_GLOW_RADIUS,
  type BorderRarity,
  type BorderTheme,
} from '@cgraph/animation-constants';
import { durations } from '@cgraph/animation-constants';
import { getDesaturatedGlowColor, getMainColor } from './utils';

interface BorderGlowProps {
  /** Avatar size in pixels */
  size: number;
  /** Visual theme */
  theme: BorderTheme;
  /** Rarity tier */
  rarity: BorderRarity;
  /** Whether the glow animation is active */
  isAnimating: boolean;
}

/**
 * Animated glow layer rendered behind the avatar for LEGENDARY/MYTHIC borders.
 * Pulses shadow radius (and opacity for MYTHIC) using Reanimated.
 */
export function BorderGlow({ size, theme, rarity, isAnimating }: BorderGlowProps) {
  // Only render for LEGENDARY and MYTHIC
  if (rarity !== 'LEGENDARY' && rarity !== 'MYTHIC') {
    return null;
  }

  const glowRadius = BORDER_RARITY_GLOW_RADIUS[rarity];
  const glowColor = getDesaturatedGlowColor(getMainColor(theme));
  const isMythic = rarity === 'MYTHIC';

  const shadowRadiusAnim = useSharedValue(glowRadius / 2);
  const shadowOpacityAnim = useSharedValue(0.6);

  useEffect(() => {
    cancelAnimation(shadowRadiusAnim);
    cancelAnimation(shadowOpacityAnim);

    if (isAnimating) {
      // Pulse shadow radius
      shadowRadiusAnim.value = withRepeat(
        withSequence(
          withTiming(glowRadius, { duration: durations.verySlow.ms }),
          withTiming(glowRadius / 2, { duration: durations.verySlow.ms })
        ),
        -1
      );

      // MYTHIC also pulses opacity
      if (isMythic) {
        shadowOpacityAnim.value = withRepeat(
          withSequence(
            withTiming(0.9, { duration: durations.ambient.ms }),
            withTiming(0.4, { duration: durations.ambient.ms })
          ),
          -1
        );
      }
    } else {
      // Freeze at resting values
      shadowRadiusAnim.value = glowRadius / 2;
      shadowOpacityAnim.value = 0.6;
    }

    return () => {
      cancelAnimation(shadowRadiusAnim);
      cancelAnimation(shadowOpacityAnim);
    };
  }, [isAnimating, glowRadius, isMythic]);

  const animatedStyle = useAnimatedStyle(() => ({
    shadowRadius: shadowRadiusAnim.value,
    shadowOpacity: isMythic ? shadowOpacityAnim.value : 0.7,
  }));

  return (
    <Animated.View
      style={[
        styles.glow,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          shadowColor: glowColor,
          shadowOffset: { width: 0, height: 0 },
        },
        animatedStyle,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  glow: {
    position: 'absolute',
    zIndex: -1,
    backgroundColor: 'transparent',
    // iOS needs a non-transparent background for shadow to render
    // Use an almost-transparent background
    elevation: 8,
  },
});
