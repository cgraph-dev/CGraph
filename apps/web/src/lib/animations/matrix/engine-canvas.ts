/**
 * Matrix Engine - Canvas Setup & Event Handling
 *
 * @description Extracted helpers for canvas configuration, event listener
 * management, and resize handling.
 *
 * @version 1.0.0
 * @since v3.0.0
 */

import type { MatrixConfig, MatrixEngineState } from './types';
import { getResponsiveConfig } from './config';

// =============================================================================
// CANVAS SETUP
// =============================================================================

/**
 * Setup canvas dimensions and context.
 * Returns the (possibly updated) config after responsive adjustments.
 */
export function setupCanvas(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  config: MatrixConfig,
  state: MatrixEngineState,
  onRetry: () => void
): MatrixConfig {
  const rect = canvas.getBoundingClientRect();
  const pixelRatio = window.devicePixelRatio || 1;

  // Ensure canvas has dimensions
  if (rect.width === 0 || rect.height === 0) {
    // Schedule retry after layout
    requestAnimationFrame(onRetry);
    return config;
  }

  // Apply responsive config
  const responsiveConfig = getResponsiveConfig(config, rect.width);

  // Set canvas size with pixel ratio for crisp rendering
  canvas.width = rect.width * pixelRatio;
  canvas.height = rect.height * pixelRatio;

  // Update state dimensions
  state.dimensions = {
    width: rect.width,
    height: rect.height,
    pixelRatio,
  };

  // Configure context
  ctx.scale(pixelRatio, pixelRatio);
  ctx.font = `${responsiveConfig.font.weight} ${responsiveConfig.font.baseSize}px ${responsiveConfig.font.family}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';

  return responsiveConfig;
}

// =============================================================================
// EVENT LISTENER MANAGEMENT
// =============================================================================

export interface EventListenerState {
  visibilityHandler: (() => void) | null;
  resizeObserver: ResizeObserver | null;
  resizeDebounceTimer: ReturnType<typeof setTimeout> | null;
}

/**
 * Setup window event listeners for visibility and resize.
 */
export function setupEventListeners(
  canvas: HTMLCanvasElement,
  config: MatrixConfig,
  state: MatrixEngineState,
  animationController: {
    setFrameInterval: (fps: number) => void;
  },
  onResize: () => void,
  listenerState: EventListenerState
): void {
  // Visibility change handler
  listenerState.visibilityHandler = () => {
    state.isVisible = !document.hidden;

    if (config.performance.throttleOnBlur) {
      if (document.hidden && state.state === 'running') {
        // Reduce FPS when hidden
        animationController.setFrameInterval(config.performance.throttledFPS);
      } else if (!document.hidden && state.state === 'running') {
        // Restore FPS when visible
        animationController.setFrameInterval(config.performance.targetFPS);
      }
    }
  };

  document.addEventListener('visibilitychange', listenerState.visibilityHandler);

  // Resize observer for responsive canvas
  listenerState.resizeObserver = new ResizeObserver(() => {
    // Debounce resize to prevent thrashing
    if (listenerState.resizeDebounceTimer) {
      clearTimeout(listenerState.resizeDebounceTimer);
    }
    listenerState.resizeDebounceTimer = setTimeout(() => {
      onResize();
    }, 100);
  });
  listenerState.resizeObserver.observe(canvas);
}

/**
 * Remove event listeners and clean up.
 */
export function removeEventListeners(listenerState: EventListenerState): void {
  if (listenerState.visibilityHandler) {
    document.removeEventListener('visibilitychange', listenerState.visibilityHandler);
    listenerState.visibilityHandler = null;
  }

  if (listenerState.resizeObserver) {
    listenerState.resizeObserver.disconnect();
    listenerState.resizeObserver = null;
  }
}
