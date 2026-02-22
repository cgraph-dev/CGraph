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

export { default as BlurEngine } from './blur-engine';
export type {
  BlurTint,
  BlurStyle,
  BlurIntensity,
  BlurCapabilities,
  BlurConfig,
  BlurFallbackColors,
  BlurLayerConfig,
} from './blur-engine';

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
} from './blur-view-cross';
export type { BlurViewCrossProps } from './blur-view-cross';

// ============================================================================
// Particle System
// ============================================================================

export { default as ParticleSystem } from './particle-system';
export {
  ParticleEngine,
  createSparkles,
  createConfetti,
  createSnow,
  createRain,
  createFireflies,
  createBubbles,
  createStars,
} from './particle-system';
export type {
  ParticleType,
  ParticleConfig,
  EmitterConfig,
  ParticlePhysics,
  ParticleBehavior,
  Particle,
  ParticleSystemConfig,
} from './particle-system';

export {
  default as ParticleView,
  SparklesView,
  ConfettiView,
  SnowView,
  RainView,
  FirefliesView,
  BubblesView,
  StarsView,
} from './particle-view';
export type { ParticleViewProps } from './particle-view';

// ============================================================================
// Gradient & Glow System
// ============================================================================

export { default as GradientEngine } from './gradient-engine';
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
} from './gradient-engine';
export type {
  GradientType,
  GradientConfig,
  GradientStop,
  GlowConfig,
  GlowType,
  ShadowConfig,
  ShadowPreset,
} from './gradient-engine';

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
} from './animated-gradient';
export type {
  AnimatedGradientProps,
  AnimatedBorderGradientProps,
  GlowViewProps,
  MeshGradientProps,
} from './animated-gradient';

// ============================================================================
// Shader Effects
// ============================================================================

export { default as ShaderEffects } from './shader-effects';
export {
  ScanlineEffect,
  HolographicEffect,
  GlitchEffect,
  ChromaticEffect,
  GrainEffect,
  VignetteEffect,
  CRTEffect,
  ShaderOverlay,
} from './shader-effects';
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
} from './shader-effects';
