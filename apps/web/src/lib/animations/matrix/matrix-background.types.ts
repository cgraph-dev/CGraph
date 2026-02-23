/**
 * Matrix animation background type definitions.
 * @module
 */
import React from 'react';
import type { MatrixConfig, MatrixTheme, ThemePreset, DeepPartial } from './types';

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
