/**
 * Matrix Cipher Background Animation - Core Engine
 * 
 * @description High-performance canvas-based animation engine for the Matrix rain effect.
 * Handles all rendering, column management, character generation, and visual effects.
 * 
 * @version 1.0.0
 * @since v0.6.3
 * @author CGraph Development Team
 * 
 * Architecture:
 * - MatrixEngine: Main class managing animation lifecycle
 * - Column management: Dynamic creation, update, and recycling
 * - Rendering pipeline: Multi-pass rendering with effects
 * - Performance monitoring: FPS tracking and adaptive quality
 */

import type {
  MatrixConfig,
  MatrixTheme,
  MatrixColumn,
  MatrixCharacter,
  MatrixEngineState,
  DepthLayer,
  DeepPartial,
} from './types';
import { getResponsiveConfig, createConfig } from './config';
import { getCharacterSet, getRandomChar } from './characters';
import { parseColor, toRGBA, getTheme } from './themes';

// =============================================================================
// CONSTANTS
// =============================================================================

const MIN_FRAME_TIME = 1000 / 144; // Cap at 144fps
const PERFORMANCE_SAMPLE_SIZE = 60;

// =============================================================================
// MATRIX ENGINE CLASS
// =============================================================================

/**
 * Core Matrix animation engine
 * 
 * Manages the complete animation lifecycle including:
 * - Canvas setup and resizing
 * - Column generation and recycling
 * - Character rendering with trail effects
 * - Depth layer parallax
 * - Performance monitoring
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
  
  // Character set cache
  private characters: string[] = [];
  
  // Columns organized by depth layer
  private depthLayers: DepthLayer[] = [];
  private columnsByLayer: Map<number, MatrixColumn[]> = new Map();
  
  // Event callbacks
  private onStart?: () => void;
  private onStop?: () => void;
  private onPause?: () => void;
  private onResume?: () => void;
  private _errorHandler?: (error: Error) => void;
  
  // Visibility tracking
  private visibilityHandler: (() => void) | null = null;
  private resizeObserver: ResizeObserver | null = null;
  
  // =========================================================================
  // CONSTRUCTOR
  // =========================================================================
  
  constructor(config?: DeepPartial<MatrixConfig>) {
    this.config = createConfig(config);
    this.state = this.createInitialState();
    this.characters = this.generateCharacterSet();
    this.initDepthLayers();
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
    });
    
    if (!this.ctx) {
      throw new Error('Could not get 2D context from canvas');
    }
    
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
    this.initializeColumns();
    
    this.lastFrameTime = performance.now();
    this.frameInterval = 1000 / this.config.performance.targetFPS;
    
    this.state.state = 'running';
    this.state.isPaused = false;
    this.animationLoop();
    
    this.onStart?.();
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
    this.columnsByLayer.forEach(columns => columns.length = 0);
    
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
  public setTheme(theme: MatrixTheme | string): void {
    if (typeof theme === 'string') {
      this.config.theme = getTheme(theme as any);
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
        this.handleResize();
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
    const baseSpeed = colConfig.minSpeed + 
      Math.random() * (colConfig.maxSpeed - colConfig.minSpeed);
    const speed = baseSpeed * speedMultiplier;
    
    // Calculate column length
    const length = Math.floor(
      colConfig.minLength + 
      Math.random() * (colConfig.maxLength - colConfig.minLength)
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
   * Create characters for a column
   */
  private createCharacters(length: number): MatrixCharacter[] {
    const { characters: charConfig } = this.config;
    
    return Array.from({ length }, (_, i) => ({
      value: getRandomChar(this.characters),
      opacity: 1 - (i / length),
      isHead: i === 0,
      brightness: i === 0 ? 1.2 : 1 - (i / length) * 0.5,
      age: 0,
      changeTimer: Math.floor(
        charConfig.minChangeInterval + 
        Math.random() * (charConfig.maxChangeInterval - charConfig.minChangeInterval)
      ),
      scale: 0.9 + Math.random() * 0.2,
    }));
  }
  
  /**
   * Update a single column
   */
  private updateColumn(column: MatrixColumn): void {
    const { height } = this.state.dimensions;
    const { columns: colConfig, characters: charConfig } = this.config;
    
    if (!column.active) {
      // Handle respawn delay
      column.respawnDelay--;
      if (column.respawnDelay <= 0) {
        this.respawnColumn(column);
      }
      return;
    }
    
    // Move column down
    column.y += column.speed * this.config.effects.speedMultiplier;
    column.frameCount++;
    
    // Update characters
    column.characters.forEach((char, i) => {
      char.age++;
      
      // Character change logic
      if (char.changeTimer > 0) {
        char.changeTimer--;
      } else if (Math.random() < charConfig.changeFrequency) {
        char.value = getRandomChar(this.characters);
        char.changeTimer = Math.floor(
          charConfig.minChangeInterval +
          Math.random() * (charConfig.maxChangeInterval - charConfig.minChangeInterval)
        );
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
    const baseSpeed = colConfig.minSpeed +
      Math.random() * (colConfig.maxSpeed - colConfig.minSpeed);
    column.speed = baseSpeed * speedMultiplier;
    
    // New length
    column.length = Math.floor(
      colConfig.minLength +
      Math.random() * (colConfig.maxLength - colConfig.minLength)
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
   * Main animation loop
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
    const elapsed = now - this.lastFrameTime;
    
    // Frame rate limiting
    if (elapsed < this.frameInterval - MIN_FRAME_TIME) {
      this.animationFrameId = requestAnimationFrame(this.animationLoop);
      return;
    }
    
    // Track frame time for FPS calculation
    this.frameTimes.push(elapsed);
    if (this.frameTimes.length > PERFORMANCE_SAMPLE_SIZE) {
      this.frameTimes.shift();
    }
    
    // Update state metrics
    this.state.metrics.frameTime = elapsed;
    this.state.metrics.lastFrameTimestamp = now;
    this.state.metrics.frameCount++;
    this.state.metrics.fps = this.calculateFPS();
    
    // Update and render with error handling
    try {
      this.update();
      this.render();
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
   * Update all columns
   */
  private update(): void {
    let totalChars = 0;
    let activeCount = 0;
    
    this.columnsByLayer.forEach(columns => {
      columns.forEach(column => {
        this.updateColumn(column);
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
  // RENDERING
  // =========================================================================
  
  /**
   * Main render function
   */
  private render(): void {
    if (!this.ctx || !this.canvas) return;
    
    const { width, height } = this.state.dimensions;
    const { theme, effects } = this.config;
    
    // Apply background fade (creates trail effect)
    this.ctx.fillStyle = toRGBA(
      ...Object.values(parseColor(theme.backgroundColor)) as [number, number, number],
      effects.backgroundFade
    );
    this.ctx.fillRect(0, 0, width, height);
    
    // Render each depth layer (back to front)
    for (let i = this.depthLayers.length - 1; i >= 0; i--) {
      const columns = this.columnsByLayer.get(i) || [];
      const layer = this.depthLayers[i];
      
      if (layer) {
        this.renderLayer(columns, layer);
      }
    }
    
    // Post-processing effects
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
   * Render a single depth layer
   */
  private renderLayer(columns: MatrixColumn[], layer: DepthLayer): void {
    if (!this.ctx) return;
    
    const { theme, font, effects } = this.config;
    
    columns.forEach(column => {
      if (!column.active) return;
      
      this.ctx!.save();
      
      // Apply layer blur if enabled
      if (layer.blur > 0 && effects.enableDepth) {
        this.ctx!.filter = `blur(${layer.blur}px)`;
      }
      
      // Render each character in the column
      column.characters.forEach((char, i) => {
        const y = column.y - i * column.fontSize;
        
        // Skip if off screen
        if (y < -column.fontSize || y > this.state.dimensions.height + column.fontSize) {
          return;
        }
        
        // Calculate color based on position in column
        let color: string;
        let alpha: number;
        
        if (char.isHead) {
          // Head character - brightest
          color = theme.primaryColor;
          alpha = theme.opacity.head * column.opacityMod * layer.opacityMultiplier;
        } else if (i < column.length * 0.3) {
          // Near head - secondary color
          color = theme.secondaryColor;
          alpha = theme.opacity.body * char.opacity * column.opacityMod * layer.opacityMultiplier;
        } else {
          // Tail - tertiary color
          color = theme.tertiaryColor;
          alpha = theme.opacity.tail * char.opacity * column.opacityMod * layer.opacityMultiplier;
        }
        
        // Apply glow effect for head
        if (char.isHead && theme.glow.enabled) {
          this.ctx!.shadowBlur = theme.glow.radius;
          this.ctx!.shadowColor = theme.glow.color || theme.primaryColor;
        } else {
          this.ctx!.shadowBlur = 0;
        }
        
        // Set font
        this.ctx!.font = `${font.weight} ${column.fontSize * char.scale}px ${font.family}`;
        
        // Set color with alpha
        const rgb = parseColor(color);
        this.ctx!.fillStyle = toRGBA(rgb.r, rgb.g, rgb.b, alpha);
        
        // Draw character
        this.ctx!.fillText(char.value, column.x, y);
      });
      
      this.ctx!.restore();
    });
  }
  
  /**
   * Render vignette effect
   */
  private renderVignette(): void {
    if (!this.ctx) return;
    
    const { width, height } = this.state.dimensions;
    const { vignetteIntensity } = this.config.effects;
    
    const gradient = this.ctx.createRadialGradient(
      width / 2, height / 2, 0,
      width / 2, height / 2, Math.max(width, height) * 0.7
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
