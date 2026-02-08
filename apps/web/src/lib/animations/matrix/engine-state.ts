/**
 * Matrix Engine - State & Initialization Helpers
 *
 * @description Extracted helpers for creating initial engine state,
 * generating character sets, and initializing depth layers.
 *
 * @version 1.0.0
 * @since v3.0.0
 */

import type { MatrixConfig, MatrixEngineState, DepthLayer } from './types';
import { getCharacterSet } from './characters';

// =============================================================================
// STATE CREATION
// =============================================================================

/**
 * Create initial engine state
 */
export function createInitialState(config: MatrixConfig): MatrixEngineState {
  return {
    state: 'idle',
    theme: config.theme,
    columns: [],
    dimensions: {
      width: 0,
      height: 0,
      pixelRatio: typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1,
    },
    metrics: {
      fps: 0,
      frameTime: 0,
      activeColumns: 0,
      totalCharacters: 0,
      lastFrameTimestamp: 0,
      frameCount: 0,
    },
    isPaused: false,
    isVisible: true,
  };
}

// =============================================================================
// CHARACTER SET GENERATION
// =============================================================================

/**
 * Generate character set based on config
 */
export function generateCharacterSet(config: MatrixConfig): string[] {
  const { characters } = config;
  return getCharacterSet(
    characters.type,
    characters.customChars,
    characters.includeNumbers,
    characters.includeSymbols
  );
}

// =============================================================================
// DEPTH LAYER INITIALIZATION
// =============================================================================

/**
 * Initialize depth layers configuration
 */
export function initDepthLayers(
  config: MatrixConfig,
  depthLayers: DepthLayer[],
  columnsByLayer: Map<number, import('./types').MatrixColumn[]>
): void {
  const { depthLayers: layerCount } = config.effects;
  depthLayers.length = 0;
  columnsByLayer.clear();

  for (let i = 0; i < layerCount; i++) {
    const layerIndex = i;
    const normalizedDepth = i / (layerCount - 1 || 1);

    depthLayers.push({
      index: layerIndex,
      speedMultiplier: 1 - normalizedDepth * 0.5, // Back layers slower
      opacityMultiplier: 1 - normalizedDepth * 0.4, // Back layers dimmer
      sizeMultiplier: 1 - normalizedDepth * 0.3, // Back layers smaller
      blur: normalizedDepth * 2, // Back layers more blurry
      columnCount: 0,
    });

    columnsByLayer.set(layerIndex, []);
  }
}
