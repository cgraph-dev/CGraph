/**
 * Matrix Cipher Background Animation - Mobile Type Definitions
 * 
 * @description Type definitions for React Native Matrix animation.
 * Shares core types with web version but adapted for mobile constraints.
 * 
 * @version 1.0.0
 * @since v0.6.3
 * @author CGraph Development Team
 */

import type { ViewStyle } from 'react-native';

// =============================================================================
// CORE TYPES (Shared with Web)
// =============================================================================

/**
 * Theme preset identifiers
 */
export type ThemePreset = 
  | 'matrix-green'
  | 'cyber-blue'
  | 'blood-red'
  | 'golden'
  | 'purple-haze'
  | 'neon-pink'
  | 'ice'
  | 'fire';

/**
 * Animation intensity presets
 */
export type IntensityPreset = 'low' | 'medium' | 'high';

/**
 * Character set types
 */
export type CharacterSetType = 
  | 'katakana'
  | 'latin'
  | 'numbers'
  | 'binary'
  | 'hex'
  | 'mixed';

// =============================================================================
// CONFIGURATION
// =============================================================================

/**
 * Mobile-optimized Matrix configuration
 */
export interface MatrixMobileConfig {
  /** Column count (fewer = better performance) */
  columnCount: number;
  
  /** Base font size */
  fontSize: number;
  
  /** Minimum column speed (pixels per frame) */
  minSpeed: number;
  
  /** Maximum column speed */
  maxSpeed: number;
  
  /** Minimum column length */
  minLength: number;
  
  /** Maximum column length */
  maxLength: number;
  
  /** Character change frequency (0-1) */
  changeFrequency: number;
  
  /** Trail fade opacity (0-1) */
  trailFade: number;
  
  /** Target frame interval in ms (higher = slower, better battery) */
  frameInterval: number;
  
  /** Character set to use */
  characterSet: CharacterSetType;
}

/**
 * Theme color configuration
 */
export interface MatrixMobileTheme {
  /** Theme identifier */
  id: ThemePreset;
  
  /** Primary color (head) */
  primaryColor: string;
  
  /** Secondary color (body) */
  secondaryColor: string;
  
  /** Tertiary color (tail) */
  tertiaryColor: string;
  
  /** Background color */
  backgroundColor: string;
  
  /** Glow color */
  glowColor: string;
}

// =============================================================================
// COLUMN & CHARACTER TYPES
// =============================================================================

/**
 * Single character in a column
 */
export interface MatrixChar {
  /** Character value */
  value: string;
  
  /** Opacity (0-1) */
  opacity: number;
  
  /** Is this the head character */
  isHead: boolean;
  
  /** Frame counter for character changes */
  changeCounter: number;
}

/**
 * Falling column of characters
 */
export interface MatrixColumnData {
  /** Unique identifier */
  id: string;
  
  /** X position */
  x: number;
  
  /** Y position of column head */
  y: number;
  
  /** Fall speed */
  speed: number;
  
  /** Characters in column */
  chars: MatrixChar[];
  
  /** Column length */
  length: number;
  
  /** Is column active */
  active: boolean;
  
  /** Respawn delay counter */
  respawnDelay: number;
}

// =============================================================================
// COMPONENT PROPS
// =============================================================================

/**
 * Props for MatrixBackground component
 */
export interface MatrixBackgroundProps {
  /** Theme preset or custom theme */
  theme?: ThemePreset | MatrixMobileTheme;
  
  /** Performance intensity */
  intensity?: IntensityPreset;
  
  /** Custom configuration overrides */
  config?: Partial<MatrixMobileConfig>;
  
  /** Container style */
  style?: ViewStyle;
  
  /** Whether to start animation automatically */
  autoStart?: boolean;
  
  /** Whether to pause when app is backgrounded */
  pauseInBackground?: boolean;
  
  /** Opacity of the entire effect */
  opacity?: number;
  
  /** Called when animation is ready */
  onReady?: () => void;
}

/**
 * Ref methods for MatrixBackground
 */
export interface MatrixBackgroundRef {
  /** Start the animation */
  start: () => void;
  
  /** Stop the animation */
  stop: () => void;
  
  /** Pause the animation */
  pause: () => void;
  
  /** Resume the animation */
  resume: () => void;
  
  /** Change theme */
  setTheme: (theme: ThemePreset) => void;
}

export default MatrixMobileConfig;
