/**
 * BorderParticleSystem - Modularized
 *
 * This file has been refactored into smaller, focused modules.
 * See ./border-particle-system/ for the individual components:
 *
 * - types.ts - Type definitions
 * - presets.ts - Particle type presets (16 types)
 * - utils.ts - Utility functions (random, lerp, getColorVariant)
 * - animations.ts - Animation helpers
 * - DOMParticle.tsx - DOM-based particle renderer
 * - BorderParticleSystem.tsx - Main component
 * - PresetWrappers.tsx - Convenience wrapper components
 *
 * @deprecated CSS particle borders are maintained for backward compatibility.
 * New borders should use Lottie animations via `LottieBorderRenderer`.
 * CSS particle borders will be removed in v2.0.
 * @see {@link ../../../lib/lottie/lottie-border-renderer.tsx} for the replacement.
 * @module avatar/BorderParticleSystem
 */

export type {
  BorderParticleSystemProps,
  Particle,
  DOMParticleProps,
  ParticlePreset,
  ParticleColors,
} from './border-particle-system/index';

export {
  PARTICLE_PRESETS,
  random,
  lerp,
  getColorVariant,
  DOMParticle,
  getAnimationForType,
  BorderParticleSystem,
  FlameParticles,
  SparkParticles,
  SnowflakeParticles,
  SakuraParticles,
  ElectricParticles,
} from './border-particle-system/index';

export { default } from './border-particle-system/index';
