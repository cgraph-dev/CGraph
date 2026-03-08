/**
 * StaticRing — renders a non-animated border ring for FREE/COMMON tiers.
 *
 * Uses a simple View with borderWidth/borderColor — no Lottie, no Reanimated.
 *
 * @module gamification/components/AvatarBorder/StaticRing
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import type { BorderRarity, BorderTheme } from '@cgraph/animation-constants';
import { getMainColor } from './utils';

interface StaticRingProps {
  /** Avatar size in pixels */
  size: number;
  /** Visual theme */
  theme: BorderTheme;
  /** Rarity tier (FREE or COMMON) */
  rarity: BorderRarity;
}

/**
 * Static circular border ring for FREE and COMMON avatar borders.
 * No animation overhead — just a styled View.
 */
export function StaticRing({ size, theme, rarity }: StaticRingProps) {
  const color = getMainColor(theme);
  const isCommon = rarity === 'COMMON';

  return (
    <View
      style={[
        styles.ring,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: 2,
          borderColor: color,
          ...(isCommon && {
            shadowColor: color,
            shadowOpacity: 0.3,
            shadowRadius: 4,
            shadowOffset: { width: 0, height: 0 },
            elevation: 2,
          }),
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  ring: {
    backgroundColor: 'transparent',
    position: 'absolute',
  },
});
