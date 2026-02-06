/**
 * AnimatedBadge module - displays achievement badges with rarity-based animations
 *
 * Animation Tiers:
 * - Common: Subtle shimmer
 * - Uncommon: Soft pulsing glow
 * - Rare: Rotating gradient ring
 * - Epic: Dual-layer particle orbit
 * - Legendary: Multi-color aurora effect
 * - Mythic: Reality-bending void distortion
 */

export { AnimatedBadge, AnimatedBadge as default } from './AnimatedBadge';
export { AnimatedBadgeWithTooltip } from './AnimatedBadgeWithTooltip';
export { OrbitingParticle } from './OrbitingParticle';
export { RarityEffects } from './RarityEffects';
export { BadgeTooltip } from './BadgeTooltip';
export { RARITY_COLORS, SIZE_CONFIG } from './constants';
export {
  shimmerAnimation,
  pulseGlowAnimation,
  rotatingRingAnimation,
  auroraAnimation,
  voidDistortionAnimation,
} from './animations';
export type {
  AnimatedBadgeProps,
  AnimatedBadgeWithTooltipProps,
  RarityColorConfig,
  SizeConfig,
  ParticleProps,
} from './types';
