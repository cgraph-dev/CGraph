/**
 * ShaderEffects - Barrel re-export file
 *
 * Individual effects have been split into separate files.
 * This file re-exports everything for backward compatibility.
 */

// Types & Configs
export type {
  ShaderType,
  ScanlineConfig,
  GlitchConfig,
  ChromaticConfig,
  HolographicConfig,
  GrainConfig,
  VignetteConfig,
  CRTConfig,
} from './shared-effects-types';

export {
  DEFAULT_SCANLINE_CONFIG,
  DEFAULT_GLITCH_CONFIG,
  DEFAULT_CHROMATIC_CONFIG,
  DEFAULT_HOLOGRAPHIC_CONFIG,
  DEFAULT_GRAIN_CONFIG,
  DEFAULT_VIGNETTE_CONFIG,
  DEFAULT_CRT_CONFIG,
} from './shared-effects-types';

// Components
export { ScanlineEffect } from './scanline-effect';
export type { ScanlineEffectProps } from './scanline-effect';

export { HolographicEffect } from './holographic-effect';
export type { HolographicEffectProps } from './holographic-effect';

export { GlitchEffect } from './glitch-effect';
export type { GlitchEffectProps } from './glitch-effect';

export { ChromaticEffect } from './chromatic-effect';
export type { ChromaticEffectProps } from './chromatic-effect';

export { GrainEffect } from './grain-effect';
export type { GrainEffectProps } from './grain-effect';

export { VignetteEffect } from './vignette-effect';
export type { VignetteEffectProps } from './vignette-effect';

export { CRTEffect } from './crt-effect';
export type { CRTEffectProps } from './crt-effect';

export { ShaderOverlay } from './shader-overlay';
export type { ShaderOverlayProps } from './shader-overlay';

// Default export for backward compatibility
import { ScanlineEffect } from './scanline-effect';
import { HolographicEffect } from './holographic-effect';
import { GlitchEffect } from './glitch-effect';
import { ChromaticEffect } from './chromatic-effect';
import { GrainEffect } from './grain-effect';
import { VignetteEffect } from './vignette-effect';
import { CRTEffect } from './crt-effect';
import { ShaderOverlay } from './shader-overlay';
import {
  DEFAULT_SCANLINE_CONFIG,
  DEFAULT_GLITCH_CONFIG,
  DEFAULT_CHROMATIC_CONFIG,
  DEFAULT_HOLOGRAPHIC_CONFIG,
  DEFAULT_GRAIN_CONFIG,
  DEFAULT_VIGNETTE_CONFIG,
  DEFAULT_CRT_CONFIG,
} from './shared-effects-types';

const ShaderEffects = {
  ScanlineEffect,
  HolographicEffect,
  GlitchEffect,
  ChromaticEffect,
  GrainEffect,
  VignetteEffect,
  CRTEffect,
  ShaderOverlay,
  DEFAULT_SCANLINE_CONFIG,
  DEFAULT_GLITCH_CONFIG,
  DEFAULT_CHROMATIC_CONFIG,
  DEFAULT_HOLOGRAPHIC_CONFIG,
  DEFAULT_GRAIN_CONFIG,
  DEFAULT_VIGNETTE_CONFIG,
  DEFAULT_CRT_CONFIG,
};

export default ShaderEffects;
