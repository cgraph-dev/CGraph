/**
 * Matrix Engine - Animation Loop Helpers
 *
 * @description Extracted helpers for the animation update/render loop,
 * including column updates and render delegation.
 *
 * @version 1.0.0
 * @since v3.0.0
 */

import type { MatrixConfig, MatrixEngineState, MatrixColumn, DepthLayer } from './types';
import type { CharacterAtlas } from './internals';
import type { MatrixRenderer } from './renderer';
import type { ColumnManager } from './columnManager';
import type { AnimationController } from './animationController';

// =============================================================================
// ANIMATION CALLBACKS FACTORY
// =============================================================================

export interface AnimationDeps {
  config: MatrixConfig;
  state: MatrixEngineState;
  depthLayers: DepthLayer[];
  columnsByLayer: Map<number, MatrixColumn[]>;
  characters: string[];
  columnManager: ColumnManager;
  animationController: AnimationController;
  errorHandler?: (error: Error) => void;
  initializeColumns: () => void;
}

/**
 * Create animation callbacks for the AnimationController
 */
export function createAnimationCallbacks(deps: AnimationDeps) {
  return {
    update: (dt: number) => updateColumns(dt, deps),
    render: (_interpolation: number) => {
      // Render is handled by the engine directly since it needs canvas context
    },
    onError: deps.errorHandler,
    ensureColumns: () => {
      if (deps.state.state !== 'running' || deps.state.isPaused) {
        deps.animationController.stop();
        return false;
      }
      if (deps.state.columns.length === 0) {
        deps.initializeColumns();
        return deps.state.columns.length > 0;
      }
      return true;
    },
  };
}

// =============================================================================
// UPDATE LOGIC
// =============================================================================

/**
 * Update all columns with delta time
 */
export function updateColumns(dt: number = 1 / 60, deps: AnimationDeps): void {
  let totalChars = 0;
  let activeCount = 0;

  const speedScale = dt * 60; // Normalize to 60fps equivalent

  deps.columnsByLayer.forEach((columns) => {
    columns.forEach((column) => {
      deps.columnManager.updateColumn(
        column,
        deps.config,
        deps.state,
        deps.depthLayers,
        deps.characters,
        speedScale
      );
      if (column.active) {
        activeCount++;
        totalChars += column.characters.length;
      }
    });
  });

  deps.state.metrics.activeColumns = activeCount;
  deps.state.metrics.totalCharacters = totalChars;

  // Sync metrics from animation controller
  deps.state.metrics.fps = deps.animationController.fps;
  deps.state.metrics.frameTime = deps.animationController.frameTime;
  deps.state.metrics.frameCount = deps.animationController.frameCount;
  deps.state.metrics.lastFrameTimestamp = deps.animationController.lastFrameTimestamp;
}

// =============================================================================
// RENDER DELEGATION
// =============================================================================

/**
 * Main render function - delegates to MatrixRenderer
 */
export function renderFrame(
  ctx: CanvasRenderingContext2D,
  config: MatrixConfig,
  state: MatrixEngineState,
  atlas: CharacterAtlas,
  depthLayers: DepthLayer[],
  columnsByLayer: Map<number, MatrixColumn[]>,
  renderer: MatrixRenderer,
  animationController: AnimationController,
  interpolation: number = 1
): void {
  renderer.render(
    ctx,
    config,
    state,
    atlas,
    depthLayers,
    columnsByLayer,
    animationController.currentDeltaTime,
    interpolation
  );
}
