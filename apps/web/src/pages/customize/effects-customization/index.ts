/**
 * Effects Customization Module
 *
 * @module pages/customize/effects-customization
 */

// Types
export type {
  EffectCategory,
  ParticleEffect,
  BackgroundEffect,
  AnimationSet,
  BaseParticle,
  SnowParticle,
  StarsParticle,
  BubblesParticle,
  SparklesParticle,
  ConfettiParticle,
  FirefliesParticle,
} from './types';

// Constants
export {
  PARTICLE_ID_TO_EFFECT,
  PARTICLE_EFFECTS,
  BACKGROUND_EFFECTS,
  ANIMATION_SETS,
} from './constants';

// Components
export { ParticlePreview } from './particle-preview';
export { ParticleEffectsSection, BackgroundEffectsSection, AnimationSetsSection } from './sections';

// Main component
export { default } from './effects-customization';
