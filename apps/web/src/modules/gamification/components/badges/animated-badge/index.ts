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

export { AnimatedBadge, AnimatedBadge as default } from './animated-badge';
export { AnimatedBadgeWithTooltip } from './animated-badge-with-tooltip';
export { OrbitingParticle } from './orbiting-particle';
export { RarityEffects } from './rarity-effects';
export { BadgeTooltip } from './badge-tooltip';
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
