/**
 * Matrix Cipher Background Animation - Animation Controller Module
 *
 * @description Manages the animation frame loop, delta time calculation,
 * and fixed-timestep accumulator for smooth physics updates.
 * Extracted from the monolithic MatrixEngine for separation of concerns.
 *
 * @version 1.0.0
 * @since v0.6.3
 */

import { MIN_FRAME_TIME, PERFORMANCE_SAMPLE_SIZE } from './internals';

// =============================================================================
// ANIMATION CONTROLLER CLASS
// =============================================================================

/**
 * Callback interface for the animation controller.
 * The engine provides these callbacks to drive updates and rendering.
 */
export interface AnimationCallbacks {
  /** Called each fixed-timestep update with dt in seconds */
  update: (dt: number) => void;
  /** Called each frame with interpolation alpha */
  render: (interpolation: number) => void;
  /** Called when a critical error occurs */
  onError?: (error: Error) => void;
  /** Called to check if columns need initialization */
  ensureColumns: () => boolean;
}

/**
 * Manages the animation loop lifecycle.
 *
 * Features:
 * - requestAnimationFrame scheduling
 * - Delta time calculation with spiral-of-death prevention
 * - Fixed-timestep accumulator for consistent physics
 * - Frame rate limiting with interpolation
 * - FPS calculation from rolling frame time samples
 */
export class AnimationController {
  private animationFrameId: number | null = null;
  private lastFrameTime: number = 0;
  private frameTimes: number[] = [];
  private frameInterval: number = 1000 / 60;
  private deltaTime: number = 0;
  private accumulator: number = 0;
  private fixedTimeStep: number = 1000 / 60;

  // Metrics
  private _fps: number = 0;
  private _frameTime: number = 0;
  private _frameCount: number = 0;
  private _lastFrameTimestamp: number = 0;

  // =========================================================================
  // PUBLIC API
  // =========================================================================

  /** Current FPS */
  get fps(): number {
    return this._fps;
  }

  /** Current frame time (ms) */
  get frameTime(): number {
    return this._frameTime;
  }

  /** Total frame count */
  get frameCount(): number {
    return this._frameCount;
  }

  /** Last frame timestamp */
  get lastFrameTimestamp(): number {
    return this._lastFrameTimestamp;
  }

  /** Current delta time (ms) for interpolation in renderer */
  get currentDeltaTime(): number {
    return this.deltaTime;
  }

  /**
   * Start the animation loop
   */
  start(targetFPS: number, callbacks: AnimationCallbacks): void {
    this.lastFrameTime = performance.now();
    this.frameInterval = 1000 / targetFPS;
    this.fixedTimeStep = 1000 / 60; // Physics at 60Hz
    this.accumulator = 0;
    this.loop(callbacks);
  }

  /**
   * Stop the animation loop
   */
  stop(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  /**
   * Resume the animation loop after a pause
   */
  resume(callbacks: AnimationCallbacks): void {
    this.lastFrameTime = performance.now();
    this.loop(callbacks);
  }

  /**
   * Update frame interval (e.g., when switching to throttled mode)
   */
  setFrameInterval(targetFPS: number): void {
    this.frameInterval = 1000 / targetFPS;
  }

  /**
   * Reset metrics (useful after config changes)
   */
  resetMetrics(): void {
    this.frameTimes.length = 0;
    this._fps = 0;
    this._frameTime = 0;
    this._frameCount = 0;
  }

  // =========================================================================
  // PRIVATE
  // =========================================================================

  /**
   * Main animation loop - Optimized with delta-time interpolation
   */
  private loop = (callbacks: AnimationCallbacks): void => {
    // Ensure columns exist before running
    const hasColumns = callbacks.ensureColumns();
    if (!hasColumns) {
      // No columns yet, schedule retry
      this.animationFrameId = requestAnimationFrame(() => this.loop(callbacks));
      return;
    }

    const now = performance.now();
    this.deltaTime = now - this.lastFrameTime;

    // Prevent spiral of death with max delta
    const cappedDelta = Math.min(this.deltaTime, 100);

    // Frame rate limiting with interpolation
    if (this.deltaTime < this.frameInterval - MIN_FRAME_TIME) {
      this.animationFrameId = requestAnimationFrame(() => this.loop(callbacks));
      return;
    }

    // Track frame time for FPS calculation
    this.frameTimes.push(this.deltaTime);
    if (this.frameTimes.length > PERFORMANCE_SAMPLE_SIZE) {
      this.frameTimes.shift();
    }

    // Update metrics
    this._frameTime = this.deltaTime;
    this._lastFrameTimestamp = now;
    this._frameCount++;
    this._fps = this.calculateFPS();

    // Fixed timestep physics with interpolation
    this.accumulator += cappedDelta;
    const interpolationAlpha = this.accumulator / this.fixedTimeStep;

    // Update with error handling
    try {
      // Physics updates at fixed rate
      while (this.accumulator >= this.fixedTimeStep) {
        callbacks.update(this.fixedTimeStep / 1000); // Convert to seconds
        this.accumulator -= this.fixedTimeStep;
      }

      // Render with interpolation
      callbacks.render(Math.min(1, interpolationAlpha));
    } catch (error) {
      if (callbacks.onError && error instanceof Error) {
        callbacks.onError(error);
      }
      // Stop animation on critical error to prevent infinite error loop
      this.stop();
      return;
    }

    this.lastFrameTime = now;
    this.animationFrameId = requestAnimationFrame(() => this.loop(callbacks));
  };

  /**
   * Calculate current FPS from rolling frame time samples
   */
  private calculateFPS(): number {
    if (this.frameTimes.length === 0) return 0;

    const avgFrameTime = this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;
    return Math.round(1000 / avgFrameTime);
  }
}
