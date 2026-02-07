/**
 * Matrix Cipher Background Animation - Core Engine (Hyper-Optimized)
 *
 * @description Ultra high-performance canvas-based animation engine for the Matrix rain effect.
 * Orchestrator that delegates to specialized modules:
 * - MatrixRenderer: All canvas drawing operations
 * - ColumnManager: Column lifecycle (create, update, recycle)
 * - AnimationController: Animation loop, delta time, fixed-timestep accumulator
 *
 * Utilities → ./internals.ts | Types → ./types.ts | Engine class → this file
 *
 * @version 3.0.0
 * @since v0.6.3
 * @author CGraph Development Team
 */

import type {
  MatrixConfig,
  MatrixTheme,
  MatrixColumn,
  MatrixCharacter,
  MatrixEngineState,
  DepthLayer,
  DeepPartial,
  ThemePreset,
} from './types';
import { getResponsiveConfig, createConfig } from './config';
import { getCharacterSet } from './characters';
import { getTheme } from './themes';
import { createCharacterAtlas, ObjectPool, type CharacterAtlas } from './internals';
import { MatrixRenderer } from './renderer';
import { ColumnManager } from './columnManager';
import { AnimationController } from './animationController';

// =============================================================================
// MATRIX ENGINE CLASS
// =============================================================================

/**
 * Core Matrix animation engine - Hyper-optimized version
 *
 * Manages the complete animation lifecycle including:
 * - Canvas setup and resizing
 * - Column generation and recycling via object pooling
 * - Character rendering with pre-rendered atlas
 * - Continuous cipher morphing animation
 * - Depth layer parallax
 * - Performance monitoring with adaptive quality
 */
export class MatrixEngine {
  // =========================================================================
  // PRIVATE PROPERTIES
  // =========================================================================

  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private config: MatrixConfig;
  private state: MatrixEngineState;

  // Delegate modules
  private renderer: MatrixRenderer;
  private columnManager: ColumnManager;
  private animationController: AnimationController;

  // Character set cache
  private characters: string[] = [];

  // Pre-rendered character atlas
  private atlas: CharacterAtlas | null = null;
  private atlasNeedsRebuild: boolean = true;

  // Columns organized by depth layer
  private depthLayers: DepthLayer[] = [];
  private columnsByLayer: Map<number, MatrixColumn[]> = new Map();

  // Object pools
  private characterPool: ObjectPool<MatrixCharacter>;

  // Event callbacks
  private onStart?: () => void;
  private onStop?: () => void;
  private onPause?: () => void;
  private onResume?: () => void;
  private _errorHandler?: (error: Error) => void;

  // Visibility tracking
  private visibilityHandler: (() => void) | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private resizeDebounceTimer: ReturnType<typeof setTimeout> | null = null;

  // =========================================================================
  // CONSTRUCTOR
  // =========================================================================

  constructor(config?: DeepPartial<MatrixConfig>) {
    this.config = createConfig(config);
    this.state = this.createInitialState();
    this.characters = this.generateCharacterSet();
    this.initDepthLayers();

    // Initialize delegate modules
    this.renderer = new MatrixRenderer();
    this.columnManager = new ColumnManager();
    this.animationController = new AnimationController();

    // Initialize object pool for characters
    this.characterPool = new ObjectPool<MatrixCharacter>(
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
      (char) => {
        char.value = '';
        char.opacity = 1;
        char.isHead = false;
        char.brightness = 1;
        char.age = 0;
        char.changeTimer = 0;
        char.scale = 1;
        char.morphPhase = 0;
        char.morphTarget = '';
        char.isEncrypting = false;
      },
      500
    );
  }

  // =========================================================================
  // INITIALIZATION
  // =========================================================================

  /**
   * Create initial engine state
   */
  private createInitialState(): MatrixEngineState {
    return {
      state: 'idle',
      theme: this.config.theme,
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

  /**
   * Generate character set based on config
   */
  private generateCharacterSet(): string[] {
    const { characters } = this.config;
    return getCharacterSet(
      characters.type,
      characters.customChars,
      characters.includeNumbers,
      characters.includeSymbols
    );
  }

  /**
   * Initialize depth layers configuration
   */
  private initDepthLayers(): void {
    const { depthLayers } = this.config.effects;
    this.depthLayers = [];
    this.columnsByLayer.clear();

    for (let i = 0; i < depthLayers; i++) {
      const layerIndex = i;
      const normalizedDepth = i / (depthLayers - 1 || 1);

      this.depthLayers.push({
        index: layerIndex,
        speedMultiplier: 1 - normalizedDepth * 0.5, // Back layers slower
        opacityMultiplier: 1 - normalizedDepth * 0.4, // Back layers dimmer
        sizeMultiplier: 1 - normalizedDepth * 0.3, // Back layers smaller
        blur: normalizedDepth * 2, // Back layers more blurry
        columnCount: 0,
      });

      this.columnsByLayer.set(layerIndex, []);
    }
  }

  // =========================================================================
  // PUBLIC API
  // =========================================================================

  /**
   * Initialize the engine with a canvas element
   *
   * @param canvas - Canvas element for rendering
   */
  public init(canvas: HTMLCanvasElement): void {
    if (!canvas) {
      throw new Error('Canvas element is required');
    }

    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', {
      alpha: false,
      desynchronized: true,
      willReadFrequently: false,
    });

    if (!this.ctx) {
      throw new Error('Could not get 2D context from canvas');
    }

    // Enable image smoothing for better glyph rendering
    this.ctx.imageSmoothingEnabled = true;
    this.ctx.imageSmoothingQuality = 'high';

    this.setupCanvas();
    this.setupEventListeners();
    this.state.state = 'idle';
  }

  /**
   * Start the animation
   */
  public start(): void {
    if (!this.canvas || !this.ctx) {
      throw new Error('Engine not initialized. Call init() first.');
    }

    if (this.state.state === 'running') {
      return;
    }

    this.state.state = 'starting';

    // Build character atlas for fast rendering
    this.buildAtlas();

    this.initializeColumns();

    this.state.state = 'running';
    this.state.isPaused = false;
    this.animationController.start(
      this.config.performance.targetFPS,
      this.createAnimationCallbacks()
    );

    this.onStart?.();
  }

  /**
   * Build/rebuild the character atlas
   */
  private buildAtlas(): void {
    if (!this.atlasNeedsRebuild && this.atlas) return;

    this.atlas = createCharacterAtlas(
      this.characters,
      this.config.theme,
      this.config.font.baseSize,
      this.config.font.family,
      String(this.config.font.weight)
    );
    this.atlasNeedsRebuild = false;
  }

  /**
   * Stop the animation completely
   */
  public stop(): void {
    this.animationController.stop();

    this.state.state = 'stopped';
    this.state.columns = [];
    this.columnsByLayer.forEach((columns) => (columns.length = 0));

    // Clear canvas
    if (this.ctx && this.canvas) {
      this.ctx.fillStyle = this.config.theme.backgroundColor;
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    this.onStop?.();
  }

  /**
   * Pause the animation
   */
  public pause(): void {
    if (this.state.state !== 'running') return;

    this.state.isPaused = true;
    this.state.state = 'paused';

    this.animationController.stop();

    this.onPause?.();
  }

  /**
   * Resume from pause
   */
  public resume(): void {
    if (this.state.state !== 'paused') return;

    this.state.isPaused = false;
    this.state.state = 'running';
    this.animationController.resume(this.createAnimationCallbacks());

    this.onResume?.();
  }

  /**
   * Toggle pause/resume
   */
  public toggle(): void {
    if (this.state.isPaused) {
      this.resume();
    } else if (this.state.state === 'running') {
      this.pause();
    } else {
      this.start();
    }
  }

  /**
   * Update configuration
   */
  public updateConfig(updates: DeepPartial<MatrixConfig>): void {
    this.config = createConfig({ ...this.config, ...updates } as Partial<MatrixConfig>);
    this.characters = this.generateCharacterSet();
    this.animationController.setFrameInterval(this.config.performance.targetFPS);

    if (updates.effects?.depthLayers !== undefined) {
      this.initDepthLayers();
      this.initializeColumns();
    }

    if (updates.theme) {
      this.state.theme = this.config.theme;
    }
  }

  /**
   * Change theme
   */
  public setTheme(theme: MatrixTheme | ThemePreset): void {
    if (typeof theme === 'string') {
      this.config.theme = getTheme(theme);
    } else {
      this.config.theme = theme;
    }
    this.state.theme = this.config.theme;
  }

  /**
   * Get current state
   */
  public getState(): MatrixEngineState {
    return { ...this.state };
  }

  /**
   * Get current configuration
   */
  public getConfig(): MatrixConfig {
    return { ...this.config };
  }

  /**
   * Set event callbacks
   */
  public setEventHandlers(handlers: {
    onStart?: () => void;
    onStop?: () => void;
    onPause?: () => void;
    onResume?: () => void;
    onError?: (error: Error) => void;
  }): void {
    this.onStart = handlers.onStart;
    this.onStop = handlers.onStop;
    this.onPause = handlers.onPause;
    this.onResume = handlers.onResume;
    this._errorHandler = handlers.onError;
  }

  /**
   * Cleanup and destroy the engine
   */
  public destroy(): void {
    this.stop();
    this.removeEventListeners();

    // Clean up object pools
    this.characterPool.clear();
    this.animationController.resetMetrics();

    // Clear atlas
    this.atlas = null;
    this.atlasNeedsRebuild = true;

    // Clear resize debounce
    if (this.resizeDebounceTimer) {
      clearTimeout(this.resizeDebounceTimer);
      this.resizeDebounceTimer = null;
    }

    this.canvas = null;
    this.ctx = null;
  }

  // =========================================================================
  // CANVAS SETUP
  // =========================================================================

  /**
   * Setup canvas dimensions and context
   */
  private setupCanvas(): void {
    if (!this.canvas) return;

    const rect = this.canvas.getBoundingClientRect();
    const pixelRatio = window.devicePixelRatio || 1;

    // Ensure canvas has dimensions
    if (rect.width === 0 || rect.height === 0) {
      // Schedule retry after layout
      requestAnimationFrame(() => {
        this.setupCanvas();
        // Re-initialize columns if engine is running but had no columns
        if (this.state.state === 'running' && this.state.columns.length === 0) {
          this.initializeColumns();
        }
      });
      return;
    }

    // Apply responsive config
    const responsiveConfig = getResponsiveConfig(this.config, rect.width);
    this.config = responsiveConfig;

    // Set canvas size with pixel ratio for crisp rendering
    this.canvas.width = rect.width * pixelRatio;
    this.canvas.height = rect.height * pixelRatio;

    // Update state dimensions
    this.state.dimensions = {
      width: rect.width,
      height: rect.height,
      pixelRatio,
    };

    // Configure context
    if (this.ctx) {
      this.ctx.scale(pixelRatio, pixelRatio);
      this.ctx.font = `${this.config.font.weight} ${this.config.font.baseSize}px ${this.config.font.family}`;
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'top';
    }
  }

  /**
   * Setup window event listeners
   */
  private setupEventListeners(): void {
    // Visibility change handler
    this.visibilityHandler = () => {
      this.state.isVisible = !document.hidden;

      if (this.config.performance.throttleOnBlur) {
        if (document.hidden && this.state.state === 'running') {
          // Reduce FPS when hidden
          this.animationController.setFrameInterval(this.config.performance.throttledFPS);
        } else if (!document.hidden && this.state.state === 'running') {
          // Restore FPS when visible
          this.animationController.setFrameInterval(this.config.performance.targetFPS);
        }
      }
    };

    document.addEventListener('visibilitychange', this.visibilityHandler);

    // Resize observer for responsive canvas
    if (this.canvas) {
      this.resizeObserver = new ResizeObserver(() => {
        // Debounce resize to prevent thrashing
        if (this.resizeDebounceTimer) {
          clearTimeout(this.resizeDebounceTimer);
        }
        this.resizeDebounceTimer = setTimeout(() => {
          this.handleResize();
        }, 100);
      });
      this.resizeObserver.observe(this.canvas);
    }
  }

  /**
   * Remove event listeners
   */
  private removeEventListeners(): void {
    if (this.visibilityHandler) {
      document.removeEventListener('visibilitychange', this.visibilityHandler);
      this.visibilityHandler = null;
    }

    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
  }

  /**
   * Handle canvas resize
   */
  private handleResize(): void {
    if (!this.canvas || !this.ctx) return;

    const wasRunning = this.state.state === 'running';

    if (wasRunning) {
      this.pause();
    }

    this.setupCanvas();
    this.initializeColumns();

    if (wasRunning) {
      this.resume();
    }
  }

  // =========================================================================
  // COLUMN MANAGEMENT
  // =========================================================================

  /**
   * Initialize all columns across depth layers
   */
  private initializeColumns(): void {
    if (!this.canvas) return;

    const { width, height } = this.state.dimensions;

    // If dimensions are 0, schedule retry after next frame
    if (width === 0 || height === 0) {
      requestAnimationFrame(() => {
        this.setupCanvas();
        if (this.state.state === 'running') {
          this.initializeColumns();
        }
      });
      return;
    }

    this.columnManager.initializeColumns(
      this.config,
      this.state,
      this.depthLayers,
      this.columnsByLayer,
      this.characters
    );
  }

  // =========================================================================
  // ANIMATION LOOP (delegated to AnimationController)
  // =========================================================================

  /**
   * Create animation callbacks for the controller
   */
  private createAnimationCallbacks() {
    return {
      update: (dt: number) => this.update(dt),
      render: (interpolation: number) => this.render(interpolation),
      onError: this._errorHandler,
      ensureColumns: () => {
        if (this.state.state !== 'running' || this.state.isPaused) {
          this.animationController.stop();
          return false;
        }
        if (this.state.columns.length === 0) {
          this.initializeColumns();
          return this.state.columns.length > 0;
        }
        return true;
      },
    };
  }

  /**
   * Update all columns with delta time (called by AnimationController)
   */
  private update(dt: number = 1 / 60): void {
    let totalChars = 0;
    let activeCount = 0;

    const speedScale = dt * 60; // Normalize to 60fps equivalent

    this.columnsByLayer.forEach((columns) => {
      columns.forEach((column) => {
        this.columnManager.updateColumn(
          column,
          this.config,
          this.state,
          this.depthLayers,
          this.characters,
          speedScale
        );
        if (column.active) {
          activeCount++;
          totalChars += column.characters.length;
        }
      });
    });

    this.state.metrics.activeColumns = activeCount;
    this.state.metrics.totalCharacters = totalChars;

    // Sync metrics from animation controller
    this.state.metrics.fps = this.animationController.fps;
    this.state.metrics.frameTime = this.animationController.frameTime;
    this.state.metrics.frameCount = this.animationController.frameCount;
    this.state.metrics.lastFrameTimestamp = this.animationController.lastFrameTimestamp;
  }

  // =========================================================================
  // RENDERING (delegated to MatrixRenderer)
  // =========================================================================

  /**
   * Main render function - delegates to MatrixRenderer
   */
  private render(interpolation: number = 1): void {
    if (!this.ctx || !this.canvas || !this.atlas) return;

    this.renderer.render(
      this.ctx,
      this.config,
      this.state,
      this.atlas,
      this.depthLayers,
      this.columnsByLayer,
      this.animationController.currentDeltaTime,
      interpolation
    );
  }
}

// =============================================================================
// FACTORY FUNCTION
// =============================================================================

/**
 * Create a new Matrix engine instance
 *
 * @param config - Optional configuration overrides
 * @returns New MatrixEngine instance
 */
export function createMatrixEngine(config?: DeepPartial<MatrixConfig>): MatrixEngine {
  return new MatrixEngine(config);
}

// Re-export sub-modules for direct access
export { MatrixRenderer } from './renderer';
export { ColumnManager } from './columnManager';
export { AnimationController } from './animationController';
export type { AnimationCallbacks } from './animationController';
export type { RenderQueueItem } from './renderer';

export default MatrixEngine;
