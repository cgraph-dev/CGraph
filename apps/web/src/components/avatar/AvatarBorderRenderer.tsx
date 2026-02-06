/**
 * AvatarBorderRenderer
 *
 * Renders animated avatar borders with support for:
 * - 150+ unique border styles across 20+ themes
 * - Particle effects (flames, sparkles, bubbles, etc.)
 * - WebGL shaders for advanced effects
 * - Performance optimization with reduced motion support
 * - Custom color overrides
 *
 * @module AvatarBorderRenderer
 * @see ./avatar-border-renderer for modular implementation
 */

export {
  // Types
  type AvatarBorderRendererProps,
  type ParticleProps,
  type BorderColors,
  type AvatarBorderConfig,
  type BorderTheme,
  type ParticleConfig,
  type ParticleType,
  // Animations & Helpers
  ANIMATION_KEYFRAMES,
  getAnimationTypeFromBorder,
  getParticleTypeFromBorder,
  getThemeStyles,
  // Components
  Particle,
  AvatarBorderRenderer,
  SimpleBorderAvatar,
  GlowBorderAvatar,
  default,
} from './avatar-border-renderer';
