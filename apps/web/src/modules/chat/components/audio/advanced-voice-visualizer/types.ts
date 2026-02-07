/**
 * AdvancedVoiceVisualizer Types
 *
 * Type definitions for the voice visualizer components.
 */

/**
 * Theme configuration for visualizers
 */
export interface ThemeConfig {
  primary: string;
  secondary: string;
  gradient: [string, string];
  glow: string;
}

/**
 * Available theme names
 */
export type ThemeName = 'matrix-green' | 'cyber-blue' | 'neon-pink' | 'amber';

/**
 * Available visualizer variants
 */
export type VisualizerVariant = 'waveform' | 'spectrum' | 'circular' | 'particles' | 'all';

/**
 * Props for the main AdvancedVoiceVisualizer component
 */
export interface AdvancedVoiceVisualizerProps {
  audioUrl?: string;
  audioStream?: MediaStream;
  variant?: VisualizerVariant;
  theme?: ThemeName;
  height?: number;
  width?: number;
  className?: string;
  isPlaying?: boolean;
  onPlaybackEnd?: () => void;
}

/**
 * Base props for individual visualizer components
 */
export interface VisualizerProps {
  analyser: AnalyserNode;
  theme: ThemeName;
  width: number;
  height: number;
}

/**
 * Particle for particle visualizer
 */
export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  size: number;
}
