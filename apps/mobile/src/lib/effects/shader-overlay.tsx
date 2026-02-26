/**
 * ShaderOverlay - Combined shader overlay that composes multiple effects
 */

import React from 'react';
import { View, ViewStyle, StyleProp } from 'react-native';
import {
  sharedStyles,
  type ShaderType,
  type ScanlineConfig,
  type HolographicConfig,
  type GlitchConfig,
  type ChromaticConfig,
  type GrainConfig,
  type VignetteConfig,
  type CRTConfig,
} from './shared-effects-types';
import { ScanlineEffect } from './scanline-effect';
import { HolographicEffect } from './holographic-effect';
import { GlitchEffect } from './glitch-effect';
import { ChromaticEffect } from './chromatic-effect';
import { GrainEffect } from './grain-effect';
import { VignetteEffect } from './vignette-effect';
import { CRTEffect } from './crt-effect';

// ============================================================================
// Types
// ============================================================================

export interface ShaderOverlayProps {
  effects?: ShaderType[];
  scanlines?: Partial<ScanlineConfig>;
  holographic?: Partial<HolographicConfig>;
  glitch?: Partial<GlitchConfig>;
  chromatic?: Partial<ChromaticConfig>;
  grain?: Partial<GrainConfig>;
  vignette?: Partial<VignetteConfig>;
  crt?: Partial<CRTConfig>;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

// ============================================================================
// Component
// ============================================================================

/**
 *
 */
export function ShaderOverlay({
  effects = [],
  scanlines,
  holographic,
  glitch,
  chromatic,
  grain,
  vignette,
  crt,
  style,
  children,
}: ShaderOverlayProps) {
  return (
    <View style={[sharedStyles.effectContainer, style]}>
      {children}

      {effects.includes('scanlines') && <ScanlineEffect config={scanlines} />}
      {effects.includes('holographic') && <HolographicEffect config={holographic} />}
      {effects.includes('glitch') && <GlitchEffect config={glitch} />}
      {effects.includes('chromatic') && <ChromaticEffect config={chromatic} />}
      {effects.includes('grain') && <GrainEffect config={grain} />}
      {effects.includes('vignette') && <VignetteEffect config={vignette} />}
      {effects.includes('crt') && <CRTEffect config={crt} />}
    </View>
  );
}
