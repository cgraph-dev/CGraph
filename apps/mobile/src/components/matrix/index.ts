/**
 * Matrix Cipher Background Animation - Mobile Exports
 * 
 * @description Public API for the Matrix animation system on React Native.
 * 
 * @version 1.0.0
 * @since v0.6.3
 * @author CGraph Development Team
 * 
 * @example
 * ```tsx
 * import { MatrixBackground, MatrixAuthBackground } from './components/matrix';
 * 
 * function Screen() {
 *   return (
 *     <View style={{ flex: 1 }}>
 *       <MatrixBackground theme="cyber-blue" />
 *       <Content />
 *     </View>
 *   );
 * }
 * ```
 */

// Components
export {
  MatrixBackground,
  MatrixAuthBackground,
  MatrixAmbientBackground,
} from './MatrixBackground';

// Themes
export {
  THEME_REGISTRY,
  MATRIX_GREEN,
  CYBER_BLUE,
  BLOOD_RED,
  GOLDEN,
  PURPLE_HAZE,
  NEON_PINK,
  ICE,
  FIRE,
  getTheme,
  getAllThemes,
} from './themes';

// Configuration
export {
  DEFAULT_CONFIG,
  LOW_INTENSITY,
  MEDIUM_INTENSITY,
  HIGH_INTENSITY,
  INTENSITY_PRESETS,
  getConfigForIntensity,
  createConfig,
  getCharacterSet,
  getRandomChar,
  KATAKANA_CHARS,
  LATIN_CHARS,
  NUMBER_CHARS,
  BINARY_CHARS,
  HEX_CHARS,
  MIXED_CHARS,
} from './config';

// Types
export type {
  ThemePreset,
  IntensityPreset,
  CharacterSetType,
  MatrixMobileConfig,
  MatrixMobileTheme,
  MatrixChar,
  MatrixColumnData,
  MatrixBackgroundProps,
  MatrixBackgroundRef,
} from './types';

// Default export
export { MatrixBackground as default } from './MatrixBackground';
