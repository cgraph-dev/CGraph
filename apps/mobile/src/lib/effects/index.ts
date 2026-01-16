/**
 * Effects Library - Advanced Visual Effects for React Native
 *
 * This module provides a comprehensive set of visual effects:
 * - Cross-platform blur (BlurEngine, BlurViewCross)
 * - Advanced particle system (ParticleSystem)
 * - Gradient & glow effects (GradientEngine)
 * - Holographic & shader effects (ShaderEffects)
 */

// Blur System
export { default as BlurEngine } from './BlurEngine';
export type {
  BlurTint,
  BlurStyle,
  BlurIntensity,
  BlurCapabilities,
  BlurConfig,
  BlurFallbackColors,
  BlurLayerConfig,
} from './BlurEngine';

export {
  default as BlurViewCross,
  LightBlur,
  DarkBlur,
  FrostedGlass,
  CrystalGlass,
  NeonGlass,
  HolographicGlass,
  AuroraGlass,
  MidnightGlass,
  OceanGlass,
  EmberGlass,
} from './BlurViewCross';
export type { BlurViewCrossProps } from './BlurViewCross';

// Particle System (to be implemented)
export { default as ParticleSystem } from './ParticleSystem';
export type {
  ParticleType,
  ParticleConfig,
  EmitterConfig,
  ParticlePhysics,
} from './ParticleSystem';

// Gradient Engine (to be implemented)
export { default as GradientEngine } from './GradientEngine';
export type { GradientType, GradientConfig, GlowConfig, ShadowPreset } from './GradientEngine';

// Shader Effects (to be implemented)
export { default as ShaderEffects } from './ShaderEffects';
export type { ShaderType, ScanlineConfig, GlitchConfig, ChromaticConfig } from './ShaderEffects';
