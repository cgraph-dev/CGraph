/**
 * Matrix Cipher Background Animation System - Type Definitions
 * 
 * @description Comprehensive type system for the Matrix rain animation engine.
 * Supports multiple color themes, character sets, and dynamic transitions.
 * 
 * @version 1.0.0
 * @since v0.6.3
 * @author CGraph Development Team
 * 
 * Architecture:
 * - MatrixConfig: Master configuration for entire animation
 * - MatrixTheme: Color and visual style definitions
 * - MatrixColumn: Individual falling character stream
 * - MatrixCharacter: Single character with position and lifecycle
 */

// =============================================================================
// UTILITY TYPES
// =============================================================================

/**
 * Deep partial type for nested configuration updates
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// =============================================================================
// CORE CONFIGURATION TYPES
// =============================================================================

/**
 * Character set identifiers for the matrix rain
 * Each set provides different visual aesthetics
 */
export type CharacterSetType = 
  | 'latin'           // Extended Latin (A-Z, a-z, accented)
  | 'katakana'        // Japanese Katakana (カタカナ)
  | 'cyrillic'        // Russian/Slavic characters
  | 'greek'           // Greek alphabet
  | 'numbers'         // 0-9 and mathematical symbols
  | 'symbols'         // Special symbols and punctuation
  | 'binary'          // Binary 0 and 1
  | 'hex'             // Hexadecimal 0-9, A-F
  | 'mixed'           // Combination of all sets
  | 'custom';         // User-defined character set

/**
 * Predefined color theme identifiers
 */
export type ThemePreset = 
  | 'matrix-green'    // Classic Matrix green (#00ff41)
  | 'cyber-blue'      // Electric blue (#00d4ff)
  | 'blood-red'       // Deep crimson (#ff1744)
  | 'golden'          // Gold/amber (#ffc107)
  | 'purple-haze'     // Violet/purple (#9c27b0)
  | 'neon-pink'       // Hot pink (#ff4081)
  | 'ice'             // Cold blue-white (#e0f7fa)
  | 'fire'            // Orange-red gradient (#ff5722)
  | 'custom';         // User-defined colors

/**
 * Animation state for lifecycle management
 */
export type AnimationState = 
  | 'idle'            // Not started
  | 'starting'        // Initializing
  | 'running'         // Active animation
  | 'paused'          // Temporarily stopped
  | 'transitioning'   // Theme/config transition
  | 'stopping'        // Graceful shutdown
  | 'stopped';        // Completely stopped

/**
 * Blend mode for layered effects
 */
export type BlendMode = 
  | 'source-over'     // Standard overlay
  | 'multiply'        // Darken blend
  | 'screen'          // Lighten blend
  | 'overlay'         // Contrast blend
  | 'hard-light'      // Strong contrast
  | 'soft-light'      // Gentle contrast
  | 'color-dodge'     // Brighten highlights
  | 'difference';     // Invert colors

// =============================================================================
// THEME CONFIGURATION
// =============================================================================

/**
 * Color definition for gradient effects
 * Supports RGBA, hex, and HSL formats
 */
export interface ColorStop {
  /** Position in gradient (0-1) */
  position: number;
  /** Color value (hex, rgba, or hsl string) */
  color: string;
  /** Optional alpha override (0-1) */
  alpha?: number;
}

/**
 * Glow effect configuration
 */
export interface GlowConfig {
  /** Enable/disable glow */
  enabled: boolean;
  /** Blur radius in pixels */
  radius: number;
  /** Glow color (uses theme primary if not set) */
  color?: string;
  /** Glow intensity (0-1) */
  intensity: number;
  /** Pulsating glow animation */
  pulsate: boolean;
  /** Pulse speed in ms */
  pulseSpeed?: number;
}

/**
 * Complete theme definition
 */
export interface MatrixTheme {
  /** Theme identifier */
  id: string;
  /** Display name */
  name: string;
  /** Theme preset or 'custom' */
  preset: ThemePreset;
  
  /** Primary character color (brightest, head of stream) */
  primaryColor: string;
  /** Secondary color (mid-stream characters) */
  secondaryColor: string;
  /** Tertiary color (fading tail characters) */
  tertiaryColor: string;
  /** Background color */
  backgroundColor: string;
  
  /** Optional gradient for character trail */
  trailGradient?: ColorStop[];
  
  /** Glow effect settings */
  glow: GlowConfig;
  
  /** Depth layers color variation (darker = further back) */
  depthColors?: {
    near: string;      // Front layer
    mid: string;       // Middle layer
    far: string;       // Back layer
  };
  
  /** Character opacity settings */
  opacity: {
    head: number;      // Lead character (0-1)
    body: number;      // Middle characters (0-1)
    tail: number;      // Fading tail (0-1)
    background: number; // Trail fade (0-1)
  };
}

// =============================================================================
// CHARACTER & COLUMN TYPES
// =============================================================================

/**
 * Individual character in the matrix stream
 */
export interface MatrixCharacter {
  /** Character string value */
  value: string;
  /** Current opacity (0-1) */
  opacity: number;
  /** Is this the head of the stream */
  isHead: boolean;
  /** Brightness multiplier */
  brightness: number;
  /** Character age in frames */
  age: number;
  /** Random character change timer */
  changeTimer: number;
  /** Scale factor for size variation */
  scale: number;
  /** Cipher morph animation phase (0 = stable, >0 = morphing) */
  morphPhase: number;
  /** Target character for morph animation */
  morphTarget: string;
  /** Whether currently encrypting (true) or decrypting (false) */
  isEncrypting: boolean;
}

/**
 * Single falling column of characters
 */
export interface MatrixColumn {
  /** Column index (x position) */
  index: number;
  /** X coordinate in pixels */
  x: number;
  /** Current Y position of column head */
  y: number;
  /** Fall speed (pixels per frame) */
  speed: number;
  /** Column length (number of characters) */
  length: number;
  /** Characters in this column */
  characters: MatrixCharacter[];
  /** Is column currently active */
  active: boolean;
  /** Depth layer (0 = front, higher = back) */
  depth: number;
  /** Column-specific opacity modifier */
  opacityMod: number;
  /** Frame counter for timing */
  frameCount: number;
  /** Time until respawn after finishing */
  respawnDelay: number;
  /** Font size for this column */
  fontSize: number;
}

/**
 * Depth layer configuration
 */
export interface DepthLayer {
  /** Layer index (0 = front) */
  index: number;
  /** Speed multiplier (slower for back) */
  speedMultiplier: number;
  /** Opacity multiplier */
  opacityMultiplier: number;
  /** Size multiplier (smaller for back) */
  sizeMultiplier: number;
  /** Blur amount in pixels */
  blur: number;
  /** Number of columns in this layer */
  columnCount: number;
}

// =============================================================================
// ANIMATION CONFIGURATION
// =============================================================================

/**
 * Performance settings
 */
export interface PerformanceConfig {
  /** Target frames per second */
  targetFPS: number;
  /** Maximum columns (auto-scaled by viewport) */
  maxColumns: number;
  /** Use WebGL if available */
  useWebGL: boolean;
  /** Enable offscreen canvas for workers */
  useOffscreenCanvas: boolean;
  /** Reduce quality on low-end devices */
  adaptiveQuality: boolean;
  /** Skip frames if needed to maintain FPS */
  allowFrameSkip: boolean;
  /** Maximum frame skip count */
  maxFrameSkip: number;
  /** Throttle on blur/inactive tab */
  throttleOnBlur: boolean;
  /** Minimum fps when throttled */
  throttledFPS: number;
}

/**
 * Character set configuration
 */
export interface CharacterSetConfig {
  /** Primary character set type */
  type: CharacterSetType;
  /** Custom characters (if type is 'custom') */
  customChars?: string;
  /** Include numbers in any set */
  includeNumbers: boolean;
  /** Include symbols in any set */
  includeSymbols: boolean;
  /** Character change frequency (0-1, higher = more changes) */
  changeFrequency: number;
  /** Minimum time between character changes (frames) */
  minChangeInterval: number;
  /** Maximum time between character changes (frames) */
  maxChangeInterval: number;
}

/**
 * Column behavior configuration
 */
export interface ColumnConfig {
  /** Minimum fall speed */
  minSpeed: number;
  /** Maximum fall speed */
  maxSpeed: number;
  /** Minimum column length (characters) */
  minLength: number;
  /** Maximum column length (characters) */
  maxLength: number;
  /** Column density (0-1, percentage of screen width) */
  density: number;
  /** Spacing between columns in pixels */
  spacing: number;
  /** Randomize column start positions */
  randomizeStart: boolean;
  /** Stagger column starts for wave effect */
  staggerStart: boolean;
  /** Stagger delay in ms */
  staggerDelay: number;
  /** Respawn probability per frame (0-1) */
  respawnRate: number;
  /** Minimum respawn delay in frames */
  minRespawnDelay: number;
  /** Maximum respawn delay in frames */
  maxRespawnDelay: number;
}

/**
 * Visual effects configuration
 */
export interface EffectsConfig {
  /** Enable depth layers (parallax) */
  enableDepth: boolean;
  /** Number of depth layers (1-5) */
  depthLayers: number;
  /** Trail fade effect strength (0-1) */
  trailFade: number;
  /** Background fade overlay alpha */
  backgroundFade: number;
  /** Enable bloom/glow effect */
  enableBloom: boolean;
  /** Bloom intensity (0-2) */
  bloomIntensity: number;
  /** Enable scanline effect */
  enableScanlines: boolean;
  /** Scanline opacity (0-1) */
  scanlineOpacity: number;
  /** Enable CRT curvature effect */
  enableCRTEffect: boolean;
  /** CRT curvature strength (0-1) */
  crtStrength: number;
  /** Enable vignette darkening */
  enableVignette: boolean;
  /** Vignette intensity (0-1) */
  vignetteIntensity: number;
  /** Canvas blend mode */
  blendMode: BlendMode;
  /** Global animation speed multiplier */
  speedMultiplier: number;
}

/**
 * Font configuration
 */
export interface FontConfig {
  /** Font family name */
  family: string;
  /** Base font size in pixels */
  baseSize: number;
  /** Minimum font size */
  minSize: number;
  /** Maximum font size */
  maxSize: number;
  /** Font weight */
  weight: number | 'normal' | 'bold';
  /** Letter spacing in pixels */
  letterSpacing: number;
  /** Enable font size variation */
  sizeVariation: boolean;
}

/**
 * Master configuration for the Matrix animation
 */
export interface MatrixConfig {
  /** Configuration version for compatibility */
  version: string;
  /** Configuration name/identifier */
  name: string;
  
  /** Active theme */
  theme: MatrixTheme;
  
  /** Performance settings */
  performance: PerformanceConfig;
  
  /** Character set settings */
  characters: CharacterSetConfig;
  
  /** Column behavior */
  columns: ColumnConfig;
  
  /** Visual effects */
  effects: EffectsConfig;
  
  /** Font settings */
  font: FontConfig;
  
  /** Responsive breakpoints */
  responsive: {
    /** Mobile config overrides (< 768px) */
    mobile?: DeepPartial<Omit<MatrixConfig, 'responsive' | 'version' | 'name' | 'debug'>>;
    /** Tablet config overrides (768-1024px) */
    tablet?: DeepPartial<Omit<MatrixConfig, 'responsive' | 'version' | 'name' | 'debug'>>;
    /** Desktop config overrides (> 1024px) */
    desktop?: DeepPartial<Omit<MatrixConfig, 'responsive' | 'version' | 'name' | 'debug'>>;
  };
  
  /** Debug settings */
  debug: {
    /** Show FPS counter */
    showFPS: boolean;
    /** Show column count */
    showColumnCount: boolean;
    /** Log performance metrics */
    logPerformance: boolean;
    /** Highlight column boundaries */
    highlightColumns: boolean;
  };
}

// =============================================================================
// ENGINE STATE & EVENTS
// =============================================================================

/**
 * Engine runtime state
 */
export interface MatrixEngineState {
  /** Current animation state */
  state: AnimationState;
  /** Current theme */
  theme: MatrixTheme;
  /** Active columns */
  columns: MatrixColumn[];
  /** Canvas dimensions */
  dimensions: {
    width: number;
    height: number;
    pixelRatio: number;
  };
  /** Performance metrics */
  metrics: {
    fps: number;
    frameTime: number;
    activeColumns: number;
    totalCharacters: number;
    lastFrameTimestamp: number;
    frameCount: number;
  };
  /** Is animation paused */
  isPaused: boolean;
  /** Is tab/window visible */
  isVisible: boolean;
}

/**
 * Events emitted by the engine
 */
export interface MatrixEvents {
  /** Animation started */
  onStart: () => void;
  /** Animation stopped */
  onStop: () => void;
  /** Animation paused */
  onPause: () => void;
  /** Animation resumed */
  onResume: () => void;
  /** Theme changed */
  onThemeChange: (theme: MatrixTheme) => void;
  /** Configuration changed */
  onConfigChange: (config: MatrixConfig) => void;
  /** Viewport resized */
  onResize: (width: number, height: number) => void;
  /** Performance warning */
  onPerformanceWarning: (fps: number) => void;
  /** Error occurred */
  onError: (error: Error) => void;
}

// =============================================================================
// HOOK TYPES
// =============================================================================

/**
 * Options for useMatrix hook
 */
export interface UseMatrixOptions {
  /** Initial configuration */
  config?: DeepPartial<MatrixConfig>;
  /** Auto-start on mount */
  autoStart?: boolean;
  /** Pause when not visible */
  pauseOnHidden?: boolean;
  /** Event handlers */
  events?: Partial<MatrixEvents>;
  /** Canvas ref (if managing externally) */
  canvasRef?: React.RefObject<HTMLCanvasElement | null>;
}

/**
 * Return type for useMatrix hook
 */
export interface UseMatrixReturn {
  /** Canvas ref for rendering */
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  /** Current engine state */
  state: MatrixEngineState;
  /** Start animation */
  start: () => void;
  /** Stop animation */
  stop: () => void;
  /** Pause animation */
  pause: () => void;
  /** Resume animation */
  resume: () => void;
  /** Toggle pause/resume */
  toggle: () => void;
  /** Update configuration */
  updateConfig: (config: DeepPartial<MatrixConfig>) => void;
  /** Change theme */
  setTheme: (theme: MatrixTheme | ThemePreset) => void;
  /** Is currently running */
  isRunning: boolean;
  /** Is currently paused */
  isPaused: boolean;
  /** Current FPS */
  fps: number;
}

// =============================================================================
// ADDITIONAL TYPES
// =============================================================================

/**
 * Configuration preset
 */
export interface ConfigPreset {
  name: string;
  description: string;
  config: Partial<MatrixConfig>;
}

/**
 * Theme transition options
 */
export interface ThemeTransition {
  /** Duration in ms */
  duration: number;
  /** Easing function */
  easing: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';
  /** Crossfade between themes */
  crossfade: boolean;
}

export default MatrixConfig;
