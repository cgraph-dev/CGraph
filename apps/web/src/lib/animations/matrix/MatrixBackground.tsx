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

import React, { forwardRef, useImperativeHandle, memo, useMemo } from 'react';
import type {
  MatrixConfig,
  MatrixTheme,
  ThemePreset,
  DeepPartial,
} from './types';
import { useMatrix, useMatrixThemes } from './useMatrix';
import {
  PRESET_HIGH_QUALITY,
  PRESET_POWER_SAVER,
  PRESET_MINIMAL,
  PRESET_INTENSE,
} from './config';

// =============================================================================
// TYPES
// =============================================================================

export type IntensityPreset = 'low' | 'medium' | 'high' | 'ultra';

export interface MatrixBackgroundProps {
  /** Theme preset name or custom theme object */
  theme?: ThemePreset | MatrixTheme;
  
  /** Intensity preset for quick configuration */
  intensity?: IntensityPreset;
  
  /** Custom configuration overrides */
  config?: DeepPartial<MatrixConfig>;
  
  /** Whether to start automatically (default: true) */
  autoStart?: boolean;
  
  /** Pause when tab is not visible (default: true) */
  pauseOnHidden?: boolean;
  
  /** Additional CSS class names */
  className?: string;
  
  /** Inline styles */
  style?: React.CSSProperties;
  
  /** Called when animation is ready */
  onReady?: () => void;
  
  /** Called when animation starts */
  onStart?: () => void;
  
  /** Called when animation stops */
  onStop?: () => void;
  
  /** Called on error */
  onError?: (error: Error) => void;
  
  /** Show debug overlay */
  debug?: boolean;
  
  /** Render as fixed fullscreen background */
  fullscreen?: boolean;
  
  /** Z-index for positioning */
  zIndex?: number;
  
  /** Opacity of the entire effect */
  opacity?: number;
  
  /** Disable pointer events (default: true for backgrounds) */
  noPointerEvents?: boolean;
}

export interface MatrixBackgroundRef {
  /** Start the animation */
  start: () => void;
  /** Stop the animation */
  stop: () => void;
  /** Pause the animation */
  pause: () => void;
  /** Resume the animation */
  resume: () => void;
  /** Toggle pause/resume */
  toggle: () => void;
  /** Change theme */
  setTheme: (theme: ThemePreset | MatrixTheme) => void;
  /** Update configuration */
  updateConfig: (config: DeepPartial<MatrixConfig>) => void;
  /** Get current state */
  isRunning: boolean;
  /** Get current FPS */
  fps: number;
}

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
export const MatrixBackground = memo(forwardRef<MatrixBackgroundRef, MatrixBackgroundProps>(
  function MatrixBackground(props, ref) {
    const {
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
    useImperativeHandle(ref, () => ({
      start,
      stop,
      pause,
      resume,
      toggle,
      setTheme: setThemeInternal,
      updateConfig,
      isRunning,
      fps,
    }), [start, stop, pause, resume, toggle, setThemeInternal, updateConfig, isRunning, fps]);
    
    // Build styles
    const containerStyle = useMemo((): React.CSSProperties => ({
      ...(fullscreen ? {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
      } : {}),
      zIndex,
      opacity,
      pointerEvents: noPointerEvents ? 'none' : 'auto',
      overflow: 'hidden',
      ...style,
    }), [fullscreen, zIndex, opacity, noPointerEvents, style]);
    
    const canvasStyle = useMemo((): React.CSSProperties => ({
      display: 'block',
      width: '100%',
      height: '100%',
    }), []);
    
    return (
      <div
        className={`matrix-background ${className}`.trim()}
        style={containerStyle}
        aria-hidden="true"
        data-state={state.state}
      >
        <canvas
          ref={canvasRef}
          style={canvasStyle}
          aria-label="Matrix animation background"
        />
      </div>
    );
  }
));

// =============================================================================
// SPECIALIZED VARIANTS
// =============================================================================

/**
 * Auth page background variant
 * Optimized for login/register pages with subtle effect
 */
export const MatrixAuthBackground = memo(function MatrixAuthBackground(
  props: Omit<MatrixBackgroundProps, 'intensity' | 'opacity'>
) {
  return (
    <MatrixBackground
      {...props}
      intensity="low"
      opacity={0.4}
      theme={props.theme || 'matrix-green'}
      fullscreen
      zIndex={-10}
    />
  );
});

/**
 * Hero section background variant
 * High-impact visual for landing pages
 */
export const MatrixHeroBackground = memo(function MatrixHeroBackground(
  props: Omit<MatrixBackgroundProps, 'intensity'>
) {
  return (
    <MatrixBackground
      {...props}
      intensity="high"
      theme={props.theme || 'cyber-blue'}
      fullscreen={false}
    />
  );
});

/**
 * Ambient background variant
 * Subtle animation for general use
 */
export const MatrixAmbientBackground = memo(function MatrixAmbientBackground(
  props: Omit<MatrixBackgroundProps, 'intensity' | 'opacity'>
) {
  return (
    <MatrixBackground
      {...props}
      intensity="low"
      opacity={0.2}
      theme={props.theme || 'matrix-green'}
    />
  );
});

// =============================================================================
// DEFAULT EXPORT
// =============================================================================

export default MatrixBackground;
