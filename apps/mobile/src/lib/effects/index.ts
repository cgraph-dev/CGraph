/**
 * Effects Library - Advanced Visual Effects for React Native
 *
 * This module provides a comprehensive set of visual effects:
 * - Cross-platform blur (BlurEngine, BlurViewCross)
 * - Advanced particle system (ParticleSystem, ParticleView)
 * - Gradient & glow effects (GradientEngine, AnimatedGradient)
 * - Holographic & shader effects (ShaderEffects)
 */

// ============================================================================
// Blur System
// ============================================================================

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

// ============================================================================
// Particle System
// ============================================================================

export { default as ParticleSystem } from './ParticleSystem';
export {
  ParticleEngine,
  createSparkles,
  createConfetti,
  createSnow,
  createRain,
  createFireflies,
  createBubbles,
  createStars,
} from './ParticleSystem';
export type {
  ParticleType,
  ParticleConfig,
  EmitterConfig,
  ParticlePhysics,
  ParticleBehavior,
  Particle,
  ParticleSystemConfig,
} from './ParticleSystem';

export {
  default as ParticleView,
  SparklesView,
  ConfettiView,
  SnowView,
  RainView,
  FirefliesView,
  BubblesView,
  StarsView,
} from './ParticleView';
export type { ParticleViewProps } from './ParticleView';

// ============================================================================
// Gradient & Glow System
// ============================================================================

export { default as GradientEngine } from './GradientEngine';
export {
  interpolateColor,
  lightenColor,
  darkenColor,
  saturateColor,
  setColorAlpha,
  generateColorScale,
  createLinearGradient,
  createRadialGradient,
  createGlowStyle,
  createMultiLayerGlow,
  createShadowStyle,
  getElevationShadow,
  GRADIENT_PRESETS,
  GLOW_PRESETS,
  SHADOW_PRESETS,
} from './GradientEngine';
export type {
  GradientType,
  GradientConfig,
  GradientStop,
  GlowConfig,
  GlowType,
  ShadowConfig,
  ShadowPreset,
} from './GradientEngine';

export {
  AnimatedGradientView,
  AnimatedBorderGradient,
  GlowView,
  MeshGradientBackground,
  AuroraGradient,
  NeonGradient,
  HolographicGradient,
  SunsetGradient,
  OceanGradient,
  EmberGradient,
  MatrixGradient,
} from './AnimatedGradient';
export type {
  AnimatedGradientProps,
  AnimatedBorderGradientProps,
  GlowViewProps,
  MeshGradientProps,
} from './AnimatedGradient';

// ============================================================================
// Shader Effects
// ============================================================================

export { default as ShaderEffects } from './ShaderEffects';
export {
  ScanlineEffect,
  HolographicEffect,
  GlitchEffect,
  ChromaticEffect,
  GrainEffect,
  VignetteEffect,
  CRTEffect,
  ShaderOverlay,
} from './ShaderEffects';
export type {
  ShaderType,
  ScanlineConfig,
  GlitchConfig,
  ChromaticConfig,
  HolographicConfig,
  GrainConfig,
  VignetteConfig,
  CRTConfig,
  ScanlineEffectProps,
  HolographicEffectProps,
  GlitchEffectProps,
  ChromaticEffectProps,
  GrainEffectProps,
  VignetteEffectProps,
  CRTEffectProps,
  ShaderOverlayProps,
} from './ShaderEffects';
