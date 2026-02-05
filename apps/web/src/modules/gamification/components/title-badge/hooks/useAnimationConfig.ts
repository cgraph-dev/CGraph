/**
 * useAnimationConfig Hook
 *
 * Returns the appropriate animation configuration based on title animation type.
 */

import { useCallback } from 'react';
import type { TitleAnimationType } from '../types';
import {
  shimmerAnimation,
  glowAnimation,
  pulseAnimation,
  rainbowAnimation,
  waveAnimation,
  sparkleAnimation,
  bounceAnimation,
  floatAnimation,
  holographicAnimation,
  matrixAnimation,
  plasmaAnimation,
  crystallineAnimation,
  etherealAnimation,
  cosmicAnimation,
  lightningAnimation,
  natureAnimation,
  voidAnimation,
  auroraAnimation,
  glitchAnimation,
  neonFlickerAnimation,
  infernoAnimation,
  blizzardAnimation,
  stormAnimation,
  divineAnimation,
  shadowAnimation,
} from '../animations';

interface UseAnimationConfigParams {
  animated: boolean;
  animationType?: TitleAnimationType;
  glowColor: string;
}

/**
 * Hook that returns the animation configuration for a title badge
 */
export function useAnimationConfig({
  animated,
  animationType,
  glowColor,
}: UseAnimationConfigParams) {
  const getAnimation = useCallback(() => {
    if (!animated || !animationType) return {};

    switch (animationType) {
      // Basic animations
      case 'shimmer':
        return shimmerAnimation;
      case 'glow':
        return glowAnimation(glowColor);
      case 'pulse':
        return pulseAnimation;
      case 'rainbow':
        return rainbowAnimation;
      case 'wave':
        return waveAnimation;
      case 'sparkle':
        return sparkleAnimation;
      case 'bounce':
        return bounceAnimation;
      case 'float':
        return floatAnimation;

      // Elemental animations
      case 'fire':
        return glowAnimation('rgba(239, 68, 68, 0.6)');
      case 'ice':
        return glowAnimation('rgba(59, 130, 246, 0.6)');
      case 'electric':
        return glowAnimation('rgba(234, 179, 8, 0.6)');

      // Advanced animations
      case 'holographic':
        return holographicAnimation;
      case 'matrix':
        return matrixAnimation;
      case 'plasma':
        return plasmaAnimation;
      case 'crystalline':
        return crystallineAnimation;
      case 'ethereal':
        return etherealAnimation;
      case 'cosmic':
        return cosmicAnimation;
      case 'lightning':
        return lightningAnimation;
      case 'nature':
        return natureAnimation;
      case 'void':
        return voidAnimation;
      case 'aurora':
        return auroraAnimation;
      case 'glitch':
        return glitchAnimation;
      case 'neon_flicker':
        return neonFlickerAnimation;
      case 'inferno':
        return infernoAnimation;
      case 'blizzard':
        return blizzardAnimation;
      case 'storm':
        return stormAnimation;
      case 'divine':
        return divineAnimation;
      case 'shadow':
        return shadowAnimation;

      default:
        return {};
    }
  }, [animated, animationType, glowColor]);

  return { getAnimation };
}
