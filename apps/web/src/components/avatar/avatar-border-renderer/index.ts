/**
 * Avatar Border Renderer Module
 *
 * Provides animated avatar borders with 150+ styles,
 * particle effects, and theme support.
 */

// Types
export type {
  AvatarBorderRendererProps,
  ParticleProps,
  BorderColors,
  AvatarBorderConfig,
  BorderTheme,
  ParticleConfig,
  ParticleType,
} from './types';

// Animations & Helpers
export {
  ANIMATION_KEYFRAMES,
  getAnimationTypeFromBorder,
  getParticleTypeFromBorder,
  getThemeStyles,
} from './animations';

// Components
export { Particle } from './Particle';
export { AvatarBorderRenderer, default } from './AvatarBorderRenderer';
export { SimpleBorderAvatar, GlowBorderAvatar } from './presets';
