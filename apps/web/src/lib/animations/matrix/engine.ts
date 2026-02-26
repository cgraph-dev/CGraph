/**
 * Matrix Cipher Background Animation - Core Engine
 *
 * @description Thin orchestrator class that delegates to specialized submodules.
 * @version 3.1.0
 * @since v0.6.3
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
import { ObjectPool, type CharacterAtlas } from './internals';
import { MatrixRenderer } from './renderer';
import { ColumnManager } from './columnManager';
import { AnimationController } from './animationController';
import { createInitialState, generateCharacterSet, initDepthLayers } from './engine-state';
import type { EventListenerState } from './engine-canvas';
import {
  type EngineContext,
  initEngine,
  startEngine,
  stopEngine,
  pauseEngine,
  resumeEngine,
  toggleEngine,
  updateEngineConfig,
  setEngineTheme,
  destroyEngine,
} from './engine-lifecycle';

// =============================================================================
// MATRIX ENGINE CLASS
// =============================================================================

/**
 * Core Matrix animation engine.
 * All lifecycle logic is delegated to engine-lifecycle functions.
 */
export class MatrixEngine {
  private _ec: EngineContext;

  constructor(config?: DeepPartial<MatrixConfig>) {
    const cfg = createConfig(config);

    this._ec = {
      canvas: null,
      ctx: null,
      config: cfg,
      state: createInitialState(cfg),
      renderer: new MatrixRenderer(),
      columnManager: new ColumnManager(),
      animationController: new AnimationController(),
      characters: generateCharacterSet(cfg),
       
      atlas: null as CharacterAtlas | null, // safe downcast – structural boundary
      atlasNeedsRebuild: true,
       
      depthLayers: [] as DepthLayer[], // safe downcast – structural boundary
      columnsByLayer: new Map<number, MatrixColumn[]>(),
      characterPool: new ObjectPool<MatrixCharacter>(
        () => ({
          value: '',
          opacity: 1,
          isHead: false,
          brightness: 1,
          age: 0,
          changeTimer: 0,
          scale: 1,
          morphPhase: 0,
          morphTarget: '',
          isEncrypting: false,
        }),
        (c) => {
          c.value = '';
          c.opacity = 1;
          c.isHead = false;
          c.brightness = 1;
          c.age = 0;
          c.changeTimer = 0;
          c.scale = 1;
          c.morphPhase = 0;
          c.morphTarget = '';
          c.isEncrypting = false;
        },
        500
      ),
       
      listenerState: {
        visibilityHandler: null,
        resizeObserver: null,
        resizeDebounceTimer: null,
      } as EventListenerState, // safe downcast – structural boundary
    };

    initDepthLayers(cfg, this._ec.depthLayers, this._ec.columnsByLayer);
  }

  // -- Public API (thin delegates) ------------------------------------------

  /**
   * Initializes the module.
   *
   * @param canvas - The canvas.
   * @returns The result.
   */
  public init(canvas: HTMLCanvasElement): void {
    initEngine(this._ec, canvas);
  }
  /**
   * start for the animations module.
   * @returns The result.
   */
  public start(): void {
    startEngine(this._ec);
  }
  /**
   * stop for the animations module.
   * @returns The result.
   */
  public stop(): void {
    stopEngine(this._ec);
  }
  /**
   * pause for the animations module.
   * @returns The result.
   */
  public pause(): void {
    pauseEngine(this._ec);
  }
  /**
   * resume for the animations module.
   * @returns The result.
   */
  public resume(): void {
    resumeEngine(this._ec);
  }
  /**
   * Toggles the state.
   * @returns The result.
   */
  public toggle(): void {
    toggleEngine(this._ec);
  }
  /**
   * destroy for the animations module.
   * @returns The result.
   */
  public destroy(): void {
    destroyEngine(this._ec);
  }

  /**
   * Updates config.
   *
   * @param updates - The updates.
   * @returns The result.
   */
  public updateConfig(updates: DeepPartial<MatrixConfig>): void {
    updateEngineConfig(this._ec, updates);
  }

  /**
   * Updates theme.
   *
   * @param theme - The theme.
   * @returns The result.
   */
  public setTheme(theme: MatrixTheme | ThemePreset): void {
    setEngineTheme(this._ec, theme);
  }

  /**
   * Retrieves state.
   * @returns The state.
   */
  public getState(): MatrixEngineState {
    return { ...this._ec.state };
  }
  /**
   * Retrieves config.
   * @returns The config.
   */
  public getConfig(): MatrixConfig {
    return { ...this._ec.config };
  }

  /**
   * Updates event handlers.
   *
   * @param handlers - The handlers.
   */
  public setEventHandlers(handlers: {
    onStart?: () => void;
    onStop?: () => void;
    onPause?: () => void;
    onResume?: () => void;
    onError?: (error: Error) => void;
  }): void {
    this._ec.onStart = handlers.onStart;
    this._ec.onStop = handlers.onStop;
    this._ec.onPause = handlers.onPause;
    this._ec.onResume = handlers.onResume;
    this._ec._errorHandler = handlers.onError;
  }
}

// =============================================================================
// FACTORY & RE-EXPORTS
// =============================================================================

/** Create a new Matrix engine instance */
export function createMatrixEngine(config?: DeepPartial<MatrixConfig>): MatrixEngine {
  return new MatrixEngine(config);
}

export { MatrixRenderer } from './renderer';
export { ColumnManager } from './columnManager';
export { AnimationController } from './animationController';
export type { AnimationCallbacks } from './animationController';
export type { RenderQueueItem } from './renderer';

export default MatrixEngine;
