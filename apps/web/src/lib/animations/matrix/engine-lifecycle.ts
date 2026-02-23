/**
 * Matrix Engine - Lifecycle Management
 *
 * @description Public lifecycle operations for the MatrixEngine:
 * init, start, stop, pause, resume, toggle, destroy.
 *
 * All functions accept a `EngineContext` that provides access to the
 * engine's internal state without exposing the class directly.
 *
 * @version 1.0.0
 * @since v3.1.0
 */

import type {
  MatrixConfig,
  MatrixTheme,
  MatrixCharacter,
  MatrixEngineState,
  DepthLayer,
  DeepPartial,
  ThemePreset,
  MatrixColumn,
} from './types';
import { createConfig } from './config';
import { getTheme } from './themes';
import { createCharacterAtlas, type CharacterAtlas } from './internals';
import { generateCharacterSet, initDepthLayers } from './engine-state';
import {
  setupCanvas,
  setupEventListeners,
  removeEventListeners,
  type EventListenerState,
} from './engine-canvas';
import { createAnimationCallbacks, renderFrame } from './engine-loop';
import type { MatrixRenderer } from './renderer';
import type { ColumnManager } from './columnManager';
import type { AnimationController } from './animationController';
import type { ObjectPool } from './internals';

// =============================================================================
// ENGINE CONTEXT — shared mutable state accessed by lifecycle functions
// =============================================================================

export interface EngineContext {
  canvas: HTMLCanvasElement | null;
  ctx: CanvasRenderingContext2D | null;
  config: MatrixConfig;
  state: MatrixEngineState;

  renderer: MatrixRenderer;
  columnManager: ColumnManager;
  animationController: AnimationController;

  characters: string[];
  atlas: CharacterAtlas | null;
  atlasNeedsRebuild: boolean;

  depthLayers: DepthLayer[];
  columnsByLayer: Map<number, MatrixColumn[]>;

  characterPool: ObjectPool<MatrixCharacter>;

  onStart?: () => void;
  onStop?: () => void;
  onPause?: () => void;
  onResume?: () => void;
  _errorHandler?: (error: Error) => void;

  listenerState: EventListenerState;
}

// =============================================================================
// ATLAS
// =============================================================================

/** Build/rebuild the character atlas */
export function buildAtlas(ec: EngineContext): void {
  if (!ec.atlasNeedsRebuild && ec.atlas) return;

  ec.atlas = createCharacterAtlas(
    ec.characters,
    ec.config.theme,
    ec.config.font.baseSize,
    ec.config.font.family,
    String(ec.config.font.weight)
  );
  ec.atlasNeedsRebuild = false;
}

// =============================================================================
// CANVAS / EVENT HELPERS
// =============================================================================

function doSetupCanvas(ec: EngineContext): void {
  if (!ec.canvas || !ec.ctx) return;
  ec.config = setupCanvas(ec.canvas, ec.ctx, ec.config, ec.state, () => {
    doSetupCanvas(ec);
    if (ec.state.state === 'running' && ec.state.columns.length === 0) {
      doInitializeColumns(ec);
    }
  });
}

function doSetupEventListeners(ec: EngineContext): void {
  if (!ec.canvas) return;
  setupEventListeners(
    ec.canvas,
    ec.config,
    ec.state,
    ec.animationController,
    () => handleResize(ec),
    ec.listenerState
  );
}

function handleResize(ec: EngineContext): void {
  if (!ec.canvas || !ec.ctx) return;
  const wasRunning = ec.state.state === 'running';
  if (wasRunning) pauseEngine(ec);
  doSetupCanvas(ec);
  doInitializeColumns(ec);
  if (wasRunning) resumeEngine(ec);
}

function doInitializeColumns(ec: EngineContext): void {
  if (!ec.canvas) return;
  const { width, height } = ec.state.dimensions;
  if (width === 0 || height === 0) {
    requestAnimationFrame(() => {
      doSetupCanvas(ec);
      if (ec.state.state === 'running') doInitializeColumns(ec);
    });
    return;
  }
  ec.columnManager.initializeColumns(
    ec.config,
    ec.state,
    ec.depthLayers,
    ec.columnsByLayer,
    ec.characters
  );
}

function buildAnimationCallbacks(ec: EngineContext) {
  const callbacks = createAnimationCallbacks({
    config: ec.config,
    state: ec.state,
    depthLayers: ec.depthLayers,
    columnsByLayer: ec.columnsByLayer,
    characters: ec.characters,
    columnManager: ec.columnManager,
    animationController: ec.animationController,
    errorHandler: ec._errorHandler,
    initializeColumns: () => doInitializeColumns(ec),
  });
  callbacks.render = (interpolation: number) => {
    if (!ec.ctx || !ec.canvas || !ec.atlas) return;
    renderFrame(
      ec.ctx,
      ec.config,
      ec.state,
      ec.atlas,
      ec.depthLayers,
      ec.columnsByLayer,
      ec.renderer,
      ec.animationController,
      interpolation
    );
  };
  return callbacks;
}

// =============================================================================
// PUBLIC LIFECYCLE FUNCTIONS
// =============================================================================

/** Initialize the engine with a canvas element */
export function initEngine(ec: EngineContext, canvas: HTMLCanvasElement): void {
  if (!canvas) throw new Error('Canvas element is required');

  ec.canvas = canvas;
  ec.ctx = canvas.getContext('2d', {
    alpha: false,
    desynchronized: true,
    willReadFrequently: false,
  });
  if (!ec.ctx) throw new Error('Could not get 2D context from canvas');

  ec.ctx.imageSmoothingEnabled = true;
  ec.ctx.imageSmoothingQuality = 'high';

  doSetupCanvas(ec);
  doSetupEventListeners(ec);
  ec.state.state = 'idle';
}

/** Start the animation */
export function startEngine(ec: EngineContext): void {
  if (!ec.canvas || !ec.ctx) throw new Error('Engine not initialized. Call init() first.');
  if (ec.state.state === 'running') return;

  ec.state.state = 'starting';
  buildAtlas(ec);
  doInitializeColumns(ec);

  ec.state.state = 'running';
  ec.state.isPaused = false;
  ec.animationController.start(ec.config.performance.targetFPS, buildAnimationCallbacks(ec));
  ec.onStart?.();
}

/** Stop the animation completely */
export function stopEngine(ec: EngineContext): void {
  ec.animationController.stop();
  ec.state.state = 'stopped';
  ec.state.columns = [];
  ec.columnsByLayer.forEach((columns) => (columns.length = 0));

  if (ec.ctx && ec.canvas) {
    ec.ctx.fillStyle = ec.config.theme.backgroundColor;
    ec.ctx.fillRect(0, 0, ec.canvas.width, ec.canvas.height);
  }
  ec.onStop?.();
}

/** Pause the animation */
export function pauseEngine(ec: EngineContext): void {
  if (ec.state.state !== 'running') return;
  ec.state.isPaused = true;
  ec.state.state = 'paused';
  ec.animationController.stop();
  ec.onPause?.();
}

/** Resume from pause */
export function resumeEngine(ec: EngineContext): void {
  if (ec.state.state !== 'paused') return;
  ec.state.isPaused = false;
  ec.state.state = 'running';
  ec.animationController.resume(buildAnimationCallbacks(ec));
  ec.onResume?.();
}

/** Toggle pause/resume */
export function toggleEngine(ec: EngineContext): void {
  if (ec.state.isPaused) resumeEngine(ec);
  else if (ec.state.state === 'running') pauseEngine(ec);
  else startEngine(ec);
}

/** Update configuration */
export function updateEngineConfig(ec: EngineContext, updates: DeepPartial<MatrixConfig>): void {
  ec.config = createConfig({ ...ec.config, ...updates } as Partial<MatrixConfig>); // safe downcast – structural boundary
  ec.characters = generateCharacterSet(ec.config);
  ec.animationController.setFrameInterval(ec.config.performance.targetFPS);

  if (updates.effects?.depthLayers !== undefined) {
    initDepthLayers(ec.config, ec.depthLayers, ec.columnsByLayer);
    doInitializeColumns(ec);
  }
  if (updates.theme) ec.state.theme = ec.config.theme;
}

/** Change theme */
export function setEngineTheme(ec: EngineContext, theme: MatrixTheme | ThemePreset): void {
  if (typeof theme === 'string') ec.config.theme = getTheme(theme);
  else ec.config.theme = theme;
  ec.state.theme = ec.config.theme;
}

/** Cleanup and destroy the engine */
export function destroyEngine(ec: EngineContext): void {
  stopEngine(ec);
  removeEventListeners(ec.listenerState);
  ec.characterPool.clear();
  ec.animationController.resetMetrics();
  ec.atlas = null;
  ec.atlasNeedsRebuild = true;
  if (ec.listenerState.resizeDebounceTimer) {
    clearTimeout(ec.listenerState.resizeDebounceTimer);
    ec.listenerState.resizeDebounceTimer = null;
  }
  ec.canvas = null;
  ec.ctx = null;
}
