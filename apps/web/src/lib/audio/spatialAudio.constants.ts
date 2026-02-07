/**
 * Spatial Audio Constants
 *
 * Default configuration values and reverb presets.
 *
 * @version 3.0.0
 * @since v0.7.35
 */

import type { SpatialAudioConfig } from './spatialAudio.types';

// =============================================================================
// REVERB IMPULSE RESPONSES
// =============================================================================

/** Simplified impulse response generation parameters for different environments */
export const REVERB_CONFIGS: Record<string, { decay: number; density: number; diffusion: number }> =
  {
    room: { decay: 0.5, density: 0.7, diffusion: 0.8 },
    hall: { decay: 2.0, density: 0.8, diffusion: 0.9 },
    cathedral: { decay: 5.0, density: 0.9, diffusion: 0.95 },
    cave: { decay: 3.0, density: 0.6, diffusion: 0.5 },
    outdoor: { decay: 0.2, density: 0.3, diffusion: 0.4 },
  };

// =============================================================================
// DEFAULT SPATIAL AUDIO CONFIG
// =============================================================================

export const DEFAULT_SPATIAL_CONFIG: SpatialAudioConfig = {
  enabled: true,
  hrtfEnabled: true,
  maxDistance: 100,
  rolloffFactor: 1,
  distanceModel: 'inverse',
  coneInnerAngle: 360,
  coneOuterAngle: 360,
  coneOuterGain: 0,
  enableVAD: true,
  enableNoiseCancellation: true,
  enableAutoGainControl: true,
  enableEchoCancellation: true,
};
