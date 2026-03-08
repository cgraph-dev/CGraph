/**
 * AvatarBorder — the main avatar border component.
 *
 * Renders a Lottie-animated border for RARE+ tiers and a static ring
 * for FREE/COMMON. Includes glow effects for LEGENDARY/MYTHIC.
 *
 * @module gamification/components/AvatarBorder
 */

import React, { useRef, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import LottieView from 'lottie-react-native';
import {
  BORDER_RARITY_LOTTIE_SPEED,
  BORDER_RARITY_SCALE,
  isAnimatedRarity,
  type BorderRarity,
  type BorderTheme,
} from '@cgraph/animation-constants';
import { StaticRing } from './StaticRing';
import { BorderGlow } from './BorderGlow';
import { getBorderRegistryEntry } from './utils';
import { getLottieBorderSource } from './lottieBorderMap';

interface AvatarBorderProps {
  /** The border ID from BORDER_REGISTRY */
  borderId: string;
  /** Avatar size in pixels */
  size: number;
  /** Whether animations are active */
  isAnimating: boolean;
  /** Rarity tier */
  rarity: BorderRarity;
  /** Visual theme */
  theme: BorderTheme;
  /** Optional user ID (for future personalization) */
  userId?: string;
  /** Optional press handler */
  onPress?: () => void;
  /** Children rendered inside the border (typically the avatar image) */
  children?: React.ReactNode;
}

/**
 * Avatar border component that wraps an avatar image with a themed,
 * rarity-appropriate border decoration.
 *
 * - FREE/COMMON: static ring (no Lottie, no Reanimated)
 * - RARE/EPIC: Lottie animation
 * - LEGENDARY/MYTHIC: Lottie animation + glow pulse
 */
export function AvatarBorder({
  borderId,
  size,
  isAnimating,
  rarity,
  theme,
  children,
}: AvatarBorderProps) {
  const lottieRef = useRef<LottieView>(null);
  const scale = BORDER_RARITY_SCALE[rarity];
  const containerSize = size * scale;
  const animated = isAnimatedRarity(rarity);
  const speed = BORDER_RARITY_LOTTIE_SPEED[rarity];

  // Handle play/pause when isAnimating changes
  useEffect(() => {
    if (!animated || !lottieRef.current) return;
    if (isAnimating) {
      lottieRef.current.play();
    } else {
      lottieRef.current.pause();
    }
  }, [isAnimating, animated]);

  // Resolve the Lottie source
  const entry = getBorderRegistryEntry(borderId);
  const lottieSource = animated ? getLottieBorderSource(borderId) : null;

  return (
    <View style={[styles.container, { width: containerSize, height: containerSize }]}>
      {/* Glow layer (LEGENDARY/MYTHIC only) — behind everything */}
      <BorderGlow
        size={containerSize}
        theme={theme}
        rarity={rarity}
        isAnimating={isAnimating}
      />

      {/* Border layer */}
      {animated && lottieSource ? (
        <LottieView
          ref={lottieRef}
          source={lottieSource as LottieView['props']['source']}
          style={[
            styles.lottieLayer,
            { width: containerSize, height: containerSize },
          ]}
          autoPlay={isAnimating}
          loop
          speed={speed}
          renderMode="AUTOMATIC"
        />
      ) : (
        <StaticRing
          size={containerSize}
          theme={entry?.theme ?? theme}
          rarity={rarity}
        />
      )}

      {/* Avatar content (centered) */}
      <View
        style={[
          styles.avatarContainer,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
          },
        ]}
      >
        {children}
      </View>
    </View>
  );
}

export default AvatarBorder;

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  lottieLayer: {
    position: 'absolute',
  },
  avatarContainer: {
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
