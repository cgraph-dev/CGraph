/**
 * Matrix Cipher Background Animation System
 * 
 * @description Complete animation system for Matrix-style digital rain effect.
 * 
 * @version 1.0.0
 * @since v0.6.3
 * @author CGraph Development Team
 * 
 * @packageDocumentation
 * 
 * ## Quick Start
 * 
 * ```tsx
 * import { MatrixBackground } from '@/lib/animations/matrix';
 * 
 * function App() {
 *   return (
 *     <div>
 *       <MatrixBackground theme="matrix-green" />
 *       <YourContent />
 *     </div>
 *   );
 * }
 * ```
 * 
 * ## Available Exports
 * 
 * ### Components
 * - `MatrixBackground` - Main background component
 * - `MatrixAuthBackground` - Optimized for auth pages
 * - `MatrixHeroBackground` - High-impact hero sections
 * - `MatrixAmbientBackground` - Subtle ambient effect
 * 
 * ### Hooks
 * - `useMatrix` - Full control hook
 * - `useMatrixThemes` - Theme selection utilities
 * - `useMatrixPerformance` - Performance monitoring
 * 
 * ### Engine
 * - `MatrixEngine` - Core animation engine class
 * - `createMatrixEngine` - Factory function
 * 
 * ### Configuration
 * - `createConfig` - Create custom configuration
 * - `getPreset` - Get configuration presets
 * - `DEFAULT_CONFIG` - Default configuration
 * 
 * ### Themes
 * - `THEME_REGISTRY` - All available themes
 * - `getTheme` - Get theme by ID
 * - `createCustomTheme` - Create custom themes
 * - `interpolateThemes` - Smooth theme transitions
 * 
 * ### Characters
 * - `getCharacterSet` - Get character sets by type
 * - `CHARACTER_PRESETS` - Predefined character combinations
 */

// =============================================================================
// COMPONENTS
// =============================================================================

export {
  MatrixBackground,
  MatrixAuthBackground,
  MatrixHeroBackground,
  MatrixAmbientBackground,
  type MatrixBackgroundProps,
  type MatrixBackgroundRef,
  type IntensityPreset,
} from './MatrixBackground';

export {
  MatrixText,
  MatrixLogo,
  MatrixHeading,
  type MatrixTextProps,
} from './MatrixText';

// =============================================================================
// HOOKS
// =============================================================================

export {
  useMatrix,
  useMatrixThemes,
  useMatrixPerformance,
} from './useMatrix';

// =============================================================================
// ENGINE
// =============================================================================

export {
  MatrixEngine,
  createMatrixEngine,
} from './engine';

// =============================================================================
// CONFIGURATION
// =============================================================================

export {
  DEFAULT_CONFIG,
  DEFAULT_PERFORMANCE,
  DEFAULT_CHARACTERS,
  DEFAULT_COLUMNS,
  DEFAULT_EFFECTS,
  DEFAULT_FONT,
  PRESET_HIGH_QUALITY,
  PRESET_POWER_SAVER,
  PRESET_MINIMAL,
  PRESET_INTENSE,
  CONFIG_PRESETS,
  type ConfigPresetName,
  createConfig,
  getPreset,
  getResponsiveConfig,
  validateConfig,
  mergeConfigs,
  cloneConfig,
} from './config';

// =============================================================================
// THEMES
// =============================================================================

export {
  THEME_REGISTRY,
  THEME_METADATA,
  MATRIX_GREEN,
  CYBER_BLUE,
  BLOOD_RED,
  GOLDEN,
  PURPLE_HAZE,
  NEON_PINK,
  ICE,
  FIRE,
  getTheme,
  getThemeById,
  createCustomTheme,
  interpolateThemes,
  parseColor,
  toRGBA,
  trailGradientToCSS,
} from './themes';

// =============================================================================
// CHARACTERS
// =============================================================================

export {
  LATIN_CHARS,
  KATAKANA_CHARS,
  CYRILLIC_CHARS,
  GREEK_CHARS,
  NUMBER_CHARS,
  BINARY_CHARS,
  HEX_CHARS,
  SYMBOL_CHARS,
  CODE_CHARS,
  CHARACTER_PRESETS,
  type CharacterPreset,
  getCharacterSet,
  getRandomChar,
  getRandomChars,
  createWeightedGenerator,
  getCharWidth,
  getPresetCharacters,
} from './characters';

// =============================================================================
// TYPES
// =============================================================================

export type {
  // Core types
  CharacterSetType,
  ThemePreset,
  AnimationState,
  BlendMode,
  
  // Configuration types
  ColorStop,
  GlowConfig,
  MatrixTheme,
  MatrixCharacter,
  MatrixColumn,
  DepthLayer,
  PerformanceConfig,
  CharacterSetConfig,
  ColumnConfig,
  EffectsConfig,
  FontConfig,
  MatrixConfig,
  
  // Engine types
  MatrixEngineState,
  MatrixEvents,
  
  // Hook types
  UseMatrixOptions,
  UseMatrixReturn,
  
  // Utility types
  DeepPartial,
  ConfigPreset,
  ThemeTransition,
} from './types';

// =============================================================================
// DEFAULT EXPORT
// =============================================================================

export { MatrixBackground as default } from './MatrixBackground';
