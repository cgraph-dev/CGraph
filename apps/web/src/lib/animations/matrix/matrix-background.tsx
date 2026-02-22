/**
 * Matrix Cipher Background Animation - React Component
 *
 * @description Ready-to-use React component for the Matrix rain background.
 * Drop-in component with sensible defaults and full customization support.
 *
 * @version 1.0.0
 * @since v0.6.3
 * @author CGraph Development Team
 *
 * @example
 * ```tsx
 * // Basic usage
 * <MatrixBackground />
 *
 * // With custom theme
 * <MatrixBackground theme="cyber-blue" />
 *
 * // Full customization
 * <MatrixBackground
 *   theme="matrix-green"
 *   intensity="high"
 *   className="fixed inset-0 -z-10"
 *   onReady={() => console.log('Matrix initialized')}
 * />
 * ```
 */

import React, { memo, useMemo, useImperativeHandle } from 'react';
import type { MatrixConfig, DeepPartial } from './types';
import { useMatrix, useMatrixThemes } from './useMatrix';
import { PRESET_HIGH_QUALITY, PRESET_POWER_SAVER, PRESET_MINIMAL, PRESET_INTENSE } from './config';
import type {
  IntensityPreset,
  MatrixBackgroundProps,
  MatrixBackgroundRef,
} from './matrix-background.types';

export type {
  IntensityPreset,
  MatrixBackgroundProps,
  MatrixBackgroundRef,
} from './matrix-background.types';
export {
  MatrixAuthBackground,
  MatrixHeroBackground,
  MatrixAmbientBackground,
} from './matrix-background-variants';

// =============================================================================
// INTENSITY PRESETS
// =============================================================================

const INTENSITY_CONFIGS: Record<IntensityPreset, DeepPartial<MatrixConfig>> = {
  low: PRESET_POWER_SAVER,
  medium: PRESET_MINIMAL,
  high: PRESET_HIGH_QUALITY,
  ultra: PRESET_INTENSE,
};

// =============================================================================
// COMPONENT IMPLEMENTATION
// =============================================================================

/**
 * Matrix Background Component
 *
 * A performant, customizable Matrix rain background effect.
 */
export const MatrixBackground = memo(function MatrixBackground(
  props: MatrixBackgroundProps & { ref?: React.Ref<MatrixBackgroundRef> }
) {
  const {
    ref,
    theme = 'matrix-green',
    intensity = 'medium',
    config: userConfig,
    autoStart = true,
    pauseOnHidden = true,
    className = '',
    style,
    onReady,
    onStart,
    onStop,
    onError,
    debug = false,
    fullscreen = true,
    zIndex = -1,
    opacity = 1,
    noPointerEvents = true,
  } = props;

  // Get theme utilities
  const { getTheme } = useMatrixThemes();

  // Build configuration
  const config = useMemo((): DeepPartial<MatrixConfig> => {
    const intensityConfig = INTENSITY_CONFIGS[intensity] || {};
    const resolvedTheme = typeof theme === 'string' ? getTheme(theme) : theme;

    return {
      ...intensityConfig,
      ...userConfig,
      theme: resolvedTheme,
      debug: {
        showFPS: debug,
        showColumnCount: debug,
        logPerformance: false,
        highlightColumns: false,
      },
    };
  }, [theme, intensity, userConfig, debug, getTheme]);

  // Initialize Matrix hook
  const {
    canvasRef,
    state,
    start,
    stop,
    pause,
    resume,
    toggle,
    setTheme: setThemeInternal,
    updateConfig,
    isRunning,
    fps,
  } = useMatrix({
    config,
    autoStart,
    pauseOnHidden,
    events: {
      onStart: () => {
        onReady?.();
        onStart?.();
      },
      onStop,
      onError,
    },
  });

  // Expose methods via ref
  useImperativeHandle(
    ref,
    () => ({
      start,
      stop,
      pause,
      resume,
      toggle,
      setTheme: setThemeInternal,
      updateConfig,
      isRunning,
      fps,
    }),
    [start, stop, pause, resume, toggle, setThemeInternal, updateConfig, isRunning, fps]
  );

  // Build styles
  const containerStyle = useMemo(
    (): React.CSSProperties => ({
      ...(fullscreen
        ? {
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          }
        : {}),
      zIndex,
      opacity,
      pointerEvents: noPointerEvents ? 'none' : 'auto',
      overflow: 'hidden',
      ...style,
    }),
    [fullscreen, zIndex, opacity, noPointerEvents, style]
  );

  const canvasStyle = useMemo(
    (): React.CSSProperties => ({
      display: 'block',
      width: '100%',
      height: '100%',
      backgroundColor: '#000', // Ensure black background for Matrix rain
    }),
    []
  );

  return (
    <div
      className={`matrix-background ${className}`.trim()}
      style={containerStyle}
      aria-hidden="true"
      data-state={state.state}
    >
      <canvas ref={canvasRef} style={canvasStyle} aria-label="Matrix animation background" />
    </div>
  );
});

// =============================================================================
// DEFAULT EXPORT
// =============================================================================

export default MatrixBackground;
