/**
 * Matrix Cipher Background Animation - Core Engine (Hyper-Optimized)
 *
 * @description Ultra high-performance canvas-based animation engine for the Matrix rain effect.
 * Implements advanced rendering optimizations including:
 * - Single-pass batch rendering with pre-computed glow textures
 * - Object pooling to eliminate GC pressure
 * - Pre-rendered character atlas for instant drawing
 * - Delta-time interpolation for smooth animation
 * - Continuous encrypt/decrypt morphing animation per character
 * - GPU-accelerated compositing where available
 *
 * Utilities → ./internals.ts | Types → ./types.ts | Engine class → this file
 *
 * @version 2.1.0
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
import { getCharacterSet, getRandomChar } from './characters';
import { parseColor, toRGBA, getTheme } from './themes';
import {
  MIN_FRAME_TIME,
  PERFORMANCE_SAMPLE_SIZE,
  CHARACTER_MORPH_PHASES,
  MORPH_CHARS_PER_FRAME,
  createCharacterAtlas,
  ObjectPool,
  type CharacterAtlas,
  type CachedGlyph,
  type MorphState,
} from './internals';

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

  // Animation control
  private animationFrameId: number | null = null;
  private lastFrameTime: number = 0;
  private frameTimes: number[] = [];
  private frameInterval: number = 1000 / 60;
  private deltaTime: number = 0;
  private accumulator: number = 0;
  private fixedTimeStep: number = 1000 / 60;

  // Character set cache
  private characters: string[] = [];

  // Pre-rendered character atlas
  private atlas: CharacterAtlas | null = null;
  private atlasNeedsRebuild: boolean = true;

  // Columns organized by depth layer
  private depthLayers: DepthLayer[] = [];
  private columnsByLayer: Map<number, MatrixColumn[]> = new Map();

  // Cipher morph state per column
  private morphStates: Map<string, MorphState[]> = new Map();

  // Object pools
  private characterPool: ObjectPool<MatrixCharacter>;

  // Batch rendering buffer
  private renderQueue: Array<{
    glyph: CachedGlyph;
    x: number;
    y: number;
    alpha: number;
  }> = [];

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

    this.lastFrameTime = performance.now();
    this.frameInterval = 1000 / this.config.performance.targetFPS;
    this.fixedTimeStep = 1000 / 60; // Physics at 60Hz
    this.accumulator = 0;

    this.state.state = 'running';
    this.state.isPaused = false;
    this.animationLoop();

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
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

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

    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    this.onPause?.();
  }

  /**
   * Resume from pause
   */
  public resume(): void {
    if (this.state.state !== 'paused') return;

    this.state.isPaused = false;
    this.state.state = 'running';
    this.lastFrameTime = performance.now();
    this.animationLoop();

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
    this.frameInterval = 1000 / this.config.performance.targetFPS;

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
    this.morphStates.clear();
    this.renderQueue.length = 0;

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
          this.frameInterval = 1000 / this.config.performance.throttledFPS;
        } else if (!document.hidden && this.state.state === 'running') {
          // Restore FPS when visible
          this.frameInterval = 1000 / this.config.performance.targetFPS;
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

    const { columns: colConfig, effects, performance: perfConfig } = this.config;

    // Calculate total columns based on density
    const maxPossibleColumns = Math.floor(width / colConfig.spacing);
    const targetColumns = Math.min(
      Math.floor(maxPossibleColumns * colConfig.density),
      perfConfig.maxColumns
    );

    // Distribute columns across depth layers
    const columnsPerLayer = Math.ceil(targetColumns / effects.depthLayers);

    this.columnsByLayer.forEach((columns, layerIndex) => {
      columns.length = 0;
      const layer = this.depthLayers[layerIndex];

      if (!layer) return; // Skip if layer doesn't exist

      for (let i = 0; i < columnsPerLayer; i++) {
        const column = this.createColumn(layerIndex, i, columnsPerLayer);
        columns.push(column);
      }

      layer.columnCount = columns.length;
    });

    // Update state
    this.state.columns = Array.from(this.columnsByLayer.values()).flat();
    this.state.metrics.activeColumns = this.state.columns.length;
  }

  /**
   * Create a single column
   */
  private createColumn(
    layerIndex: number,
    columnIndex: number,
    totalInLayer: number
  ): MatrixColumn {
    const { width, height } = this.state.dimensions;
    const { columns: colConfig, font } = this.config;
    const layer = this.depthLayers[layerIndex];

    // Default multipliers if layer is undefined
    const speedMultiplier = layer?.speedMultiplier ?? 1;
    const sizeMultiplier = layer?.sizeMultiplier ?? 1;

    // Calculate X position with some randomness
    const baseX = (columnIndex / totalInLayer) * width;
    const xVariation = (Math.random() - 0.5) * colConfig.spacing;
    const x = baseX + xVariation;

    // Calculate speed with layer adjustment
    const baseSpeed =
      colConfig.minSpeed + Math.random() * (colConfig.maxSpeed - colConfig.minSpeed);
    const speed = baseSpeed * speedMultiplier;

    // Calculate column length
    const length = Math.floor(
      colConfig.minLength + Math.random() * (colConfig.maxLength - colConfig.minLength)
    );

    // Initial Y position (can be offscreen for stagger effect)
    const y = colConfig.randomizeStart
      ? Math.random() * height * 2 - height
      : -length * font.baseSize;

    // Font size variation
    const fontSize = font.sizeVariation
      ? font.minSize + Math.random() * (font.maxSize - font.minSize)
      : font.baseSize;

    return {
      index: columnIndex,
      x: Math.round(x),
      y,
      speed,
      length,
      characters: this.createCharacters(length),
      active: true,
      depth: layerIndex,
      opacityMod: 0.7 + Math.random() * 0.3,
      frameCount: 0,
      respawnDelay: 0,
      fontSize: fontSize * sizeMultiplier,
    };
  }

  /**
   * Create characters for a column with morph state
   */
  private createCharacters(length: number): MatrixCharacter[] {
    const { characters: charConfig } = this.config;

    return Array.from({ length }, (_, i) => ({
      value: getRandomChar(this.characters),
      opacity: 1 - i / length,
      isHead: i === 0,
      brightness: i === 0 ? 1.2 : 1 - (i / length) * 0.5,
      age: 0,
      changeTimer: Math.floor(
        charConfig.minChangeInterval +
          Math.random() * (charConfig.maxChangeInterval - charConfig.minChangeInterval)
      ),
      scale: 0.9 + Math.random() * 0.2,
      morphPhase: 0,
      morphTarget: '',
      isEncrypting: Math.random() > 0.5,
    }));
  }

  /**
   * Update a single column with delta-time scaling
   */
  private updateColumn(column: MatrixColumn, speedScale: number = 1): void {
    const { height } = this.state.dimensions;
    const { columns: colConfig, characters: charConfig } = this.config;

    if (!column.active) {
      // Handle respawn delay
      column.respawnDelay -= speedScale;
      if (column.respawnDelay <= 0) {
        this.respawnColumn(column);
      }
      return;
    }

    // Move column down with speed scaling
    column.y += column.speed * this.config.effects.speedMultiplier * speedScale;
    column.frameCount++;

    // Update characters with cipher morphing
    const morphCount = Math.ceil(MORPH_CHARS_PER_FRAME * speedScale);
    let morphed = 0;

    column.characters.forEach((char, i) => {
      char.age += speedScale;

      // Continuous cipher morph animation
      if (char.morphPhase > 0) {
        char.morphPhase -= speedScale * 0.5;
        if (char.morphPhase <= 0) {
          char.morphPhase = 0;
          char.value = char.morphTarget || char.value;
          char.isEncrypting = !char.isEncrypting;
          // Queue next morph cycle
          char.changeTimer = Math.floor(
            charConfig.minChangeInterval +
              Math.random() * (charConfig.maxChangeInterval - charConfig.minChangeInterval)
          );
        } else {
          // Show scrambled character during morph
          char.value = getRandomChar(this.characters);
        }
      } else if (char.changeTimer > 0) {
        char.changeTimer -= speedScale;
      } else if (morphed < morphCount && Math.random() < charConfig.changeFrequency * 2) {
        // Start morph cycle
        char.morphTarget = getRandomChar(this.characters);
        char.morphPhase = CHARACTER_MORPH_PHASES;
        morphed++;
      }

      // Update opacity based on position in column
      const normalizedPosition = i / column.length;
      char.opacity = Math.max(0.1, 1 - normalizedPosition * 0.9);
    });

    // Check if column is off screen
    const columnHeight = column.length * column.fontSize;
    if (column.y - columnHeight > height) {
      column.active = false;
      column.respawnDelay = Math.floor(
        colConfig.minRespawnDelay +
          Math.random() * (colConfig.maxRespawnDelay - colConfig.minRespawnDelay)
      );
    }
  }

  /**
   * Respawn a column at the top
   */
  private respawnColumn(column: MatrixColumn): void {
    const { width } = this.state.dimensions;
    const { columns: colConfig } = this.config;
    const layer = this.depthLayers[column.depth];

    // Default speed multiplier if layer is undefined
    const speedMultiplier = layer?.speedMultiplier ?? 1;

    // New random X position
    const xVariation = (Math.random() - 0.5) * colConfig.spacing * 3;
    column.x = Math.max(0, Math.min(width, column.x + xVariation));

    // Reset position above screen
    column.y = -column.length * column.fontSize * (1 + Math.random());

    // New speed
    const baseSpeed =
      colConfig.minSpeed + Math.random() * (colConfig.maxSpeed - colConfig.minSpeed);
    column.speed = baseSpeed * speedMultiplier;

    // New length
    column.length = Math.floor(
      colConfig.minLength + Math.random() * (colConfig.maxLength - colConfig.minLength)
    );

    // Regenerate characters
    column.characters = this.createCharacters(column.length);
    column.active = true;
    column.frameCount = 0;
    column.opacityMod = 0.7 + Math.random() * 0.3;
  }

  // =========================================================================
  // ANIMATION LOOP
  // =========================================================================

  /**
   * Main animation loop - Optimized with delta-time interpolation
   */
  private animationLoop = (): void => {
    if (this.state.state !== 'running' || this.state.isPaused) {
      return;
    }

    // Check if we need to initialize columns (happens if dimensions were 0 at start)
    if (this.state.columns.length === 0) {
      this.initializeColumns();
      if (this.state.columns.length === 0) {
        // Still no columns, schedule retry
        this.animationFrameId = requestAnimationFrame(this.animationLoop);
        return;
      }
    }

    const now = performance.now();
    this.deltaTime = now - this.lastFrameTime;

    // Prevent spiral of death with max delta
    const cappedDelta = Math.min(this.deltaTime, 100);

    // Frame rate limiting with interpolation
    if (this.deltaTime < this.frameInterval - MIN_FRAME_TIME) {
      this.animationFrameId = requestAnimationFrame(this.animationLoop);
      return;
    }

    // Track frame time for FPS calculation
    this.frameTimes.push(this.deltaTime);
    if (this.frameTimes.length > PERFORMANCE_SAMPLE_SIZE) {
      this.frameTimes.shift();
    }

    // Update state metrics
    this.state.metrics.frameTime = this.deltaTime;
    this.state.metrics.lastFrameTimestamp = now;
    this.state.metrics.frameCount++;
    this.state.metrics.fps = this.calculateFPS();

    // Fixed timestep physics with interpolation
    this.accumulator += cappedDelta;
    const interpolationAlpha = this.accumulator / this.fixedTimeStep;

    // Update with error handling
    try {
      // Physics updates at fixed rate
      while (this.accumulator >= this.fixedTimeStep) {
        this.update(this.fixedTimeStep / 1000); // Convert to seconds
        this.accumulator -= this.fixedTimeStep;
      }

      // Render with interpolation
      this.render(Math.min(1, interpolationAlpha));
    } catch (error) {
      if (this._errorHandler && error instanceof Error) {
        this._errorHandler(error);
      }
      // Stop animation on critical error to prevent infinite error loop
      this.stop();
      return;
    }

    this.lastFrameTime = now;
    this.animationFrameId = requestAnimationFrame(this.animationLoop);
  };

  /**
   * Calculate current FPS
   */
  private calculateFPS(): number {
    if (this.frameTimes.length === 0) return 0;

    const avgFrameTime = this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;
    return Math.round(1000 / avgFrameTime);
  }

  /**
   * Update all columns with delta time
   */
  private update(dt: number = 1 / 60): void {
    let totalChars = 0;
    let activeCount = 0;

    const speedScale = dt * 60; // Normalize to 60fps equivalent

    this.columnsByLayer.forEach((columns) => {
      columns.forEach((column) => {
        this.updateColumn(column, speedScale);
        if (column.active) {
          activeCount++;
          totalChars += column.characters.length;
        }
      });
    });

    this.state.metrics.activeColumns = activeCount;
    this.state.metrics.totalCharacters = totalChars;
  }

  // =========================================================================
  // RENDERING - Hyper-optimized single-pass batch rendering
  // =========================================================================

  /**
   * Main render function - Uses pre-rendered glyphs for maximum performance
   */
  private render(interpolation: number = 1): void {
    if (!this.ctx || !this.canvas || !this.atlas) return;

    const { width, height } = this.state.dimensions;
    const { theme, effects } = this.config;

    // Clear render queue
    this.renderQueue.length = 0;

    // Apply background fade (creates trail effect) - single draw call
    this.ctx.fillStyle = toRGBA(
      ...(Object.values(parseColor(theme.backgroundColor)) as [number, number, number]),
      effects.backgroundFade
    );
    this.ctx.fillRect(0, 0, width, height);

    // Build render queue from all layers (back to front)
    for (let i = this.depthLayers.length - 1; i >= 0; i--) {
      const columns = this.columnsByLayer.get(i) || [];
      const layer = this.depthLayers[i];

      if (layer) {
        this.buildLayerRenderQueue(columns, layer, interpolation);
      }
    }

    // Execute batched render
    this.executeBatchRender();

    // Post-processing effects (minimal overhead)
    if (effects.enableVignette) {
      this.renderVignette();
    }

    if (effects.enableScanlines) {
      this.renderScanlines();
    }

    // Debug overlay
    if (this.config.debug.showFPS) {
      this.renderDebugInfo();
    }
  }

  /**
   * Build render queue for a depth layer - prepares glyphs for batch drawing
   */
  private buildLayerRenderQueue(
    columns: MatrixColumn[],
    layer: DepthLayer,
    interpolation: number
  ): void {
    if (!this.atlas) return;

    const glyphPadding = Math.ceil(this.config.font.baseSize * 0.8);

    columns.forEach((column) => {
      if (!column.active) return;

      // Interpolated Y position for smooth motion
      const interpolatedY =
        column.y +
        column.speed *
          this.config.effects.speedMultiplier *
          interpolation *
          (this.deltaTime / 1000) *
          60;

      column.characters.forEach((char, i) => {
        const y = interpolatedY - i * column.fontSize;

        // Skip if off screen (with glow padding)
        if (y < -column.fontSize * 2 || y > this.state.dimensions.height + column.fontSize) {
          return;
        }

        // Determine glyph variant based on position and morph state
        let glyphKey: string;
        let alpha = column.opacityMod * layer.opacityMultiplier;

        const isMorphing = char.morphPhase > 0;
        const morphFlicker = isMorphing ? 0.7 + Math.random() * 0.3 : 1;

        if (char.isHead) {
          glyphKey = isMorphing ? 'head-bright' : 'head';
          alpha *= 1.0 * morphFlicker;
        } else if (i < column.length * 0.2) {
          glyphKey = isMorphing ? 'head' : 'body-high';
          alpha *= 0.95 * char.opacity * morphFlicker;
        } else if (i < column.length * 0.4) {
          glyphKey = 'body-mid';
          alpha *= 0.85 * char.opacity * morphFlicker;
        } else if (i < column.length * 0.7) {
          glyphKey = 'body-low';
          alpha *= 0.7 * char.opacity;
        } else {
          glyphKey = 'tail';
          alpha *= 0.5 * char.opacity;
        }

        // Get pre-rendered glyph from atlas
        const charMap = this.atlas?.glyphs.get(glyphKey);
        const glyph = charMap?.get(char.value);

        if (glyph) {
          this.renderQueue.push({
            glyph,
            x: column.x - glyph.width / 2 + glyphPadding,
            y: y - glyphPadding,
            alpha: Math.min(1, Math.max(0, alpha)),
          });
        }
      });
    });
  }

  /**
   * Execute batched render with global alpha optimization
   */
  private executeBatchRender(): void {
    if (!this.ctx) return;

    // Group by alpha for fewer state changes
    const alphaGroups = new Map<number, typeof this.renderQueue>();

    for (const item of this.renderQueue) {
      const alphaKey = Math.round(item.alpha * 20) / 20; // Quantize to 5% steps
      if (!alphaGroups.has(alphaKey)) {
        alphaGroups.set(alphaKey, []);
      }
      alphaGroups.get(alphaKey)!.push(item);
    }

    // Render each alpha group
    for (const [alpha, items] of alphaGroups) {
      this.ctx.globalAlpha = alpha;

      for (const item of items) {
        this.ctx.drawImage(item.glyph.canvas as CanvasImageSource, item.x, item.y);
      }
    }

    // Reset alpha
    this.ctx.globalAlpha = 1;
  }

  /**
   * Render vignette effect
   */
  private renderVignette(): void {
    if (!this.ctx) return;

    const { width, height } = this.state.dimensions;
    const { vignetteIntensity } = this.config.effects;

    const gradient = this.ctx.createRadialGradient(
      width / 2,
      height / 2,
      0,
      width / 2,
      height / 2,
      Math.max(width, height) * 0.7
    );

    gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
    gradient.addColorStop(0.5, 'rgba(0, 0, 0, 0)');
    gradient.addColorStop(1, `rgba(0, 0, 0, ${vignetteIntensity})`);

    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, width, height);
  }

  /**
   * Render scanline effect
   */
  private renderScanlines(): void {
    if (!this.ctx) return;

    const { width, height } = this.state.dimensions;
    const { scanlineOpacity } = this.config.effects;

    this.ctx.fillStyle = `rgba(0, 0, 0, ${scanlineOpacity})`;

    for (let y = 0; y < height; y += 4) {
      this.ctx.fillRect(0, y, width, 2);
    }
  }

  /**
   * Render debug information
   */
  private renderDebugInfo(): void {
    if (!this.ctx) return;

    const { fps, activeColumns, totalCharacters } = this.state.metrics;

    this.ctx.save();
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(10, 10, 150, 70);

    this.ctx.font = '12px monospace';
    this.ctx.fillStyle = '#00ff41';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`FPS: ${fps}`, 20, 30);
    this.ctx.fillText(`Columns: ${activeColumns}`, 20, 50);
    this.ctx.fillText(`Characters: ${totalCharacters}`, 20, 70);
    this.ctx.restore();
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

export default MatrixEngine;
