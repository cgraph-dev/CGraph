/**
 * Spatial Audio Engine
 *
 * Advanced 3D spatial audio system for immersive communication.
 * This file is a thin re-export barrel — all implementation lives
 * in the `spatial-audio/` submodules.
 *
 * @version 3.0.0
 * @since v0.7.35
 */

// =============================================================================
// RE-EXPORTS FOR BACKWARD COMPATIBILITY
// =============================================================================

export type {
  Position3D,
  Orientation3D,
  AudioSource,
  AudioZone,
  ReverbConfig,
  VoiceActivityState,
  SpatialAudioConfig,
  AudioAnalysisResult,
} from './spatialAudio.types';

export { REVERB_CONFIGS, DEFAULT_SPATIAL_CONFIG } from './spatialAudio.constants';
export { VADProcessor } from './voiceActivityDetection';
export { AudioZoneManager } from './audioZoneManager';
export { SpatialAudioRoom } from './SpatialRoomAudio';

// =============================================================================
// SPATIAL AUDIO ENGINE (from submodules)
// =============================================================================

export { SpatialAudioEngine } from './spatial-audio/engine-core';
export { AudioSourceManager } from './spatial-audio/source-manager';

import { SpatialAudioEngine } from './spatial-audio/engine-core';

export const spatialAudioEngine = new SpatialAudioEngine();
