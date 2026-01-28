/**
 * @deprecated This file is deprecated. Import from '@/stores/theme' instead.
 *
 * This file re-exports from the consolidated theme store for backward compatibility.
 * All new code should import directly from '@/stores/theme'.
 *
 * @see /stores/theme/index.ts
 */

export {
  useThemeStore,
  COLORS as THEME_COLORS,
  useColorTheme,
  useThemeEffects,
  type ColorPreset as ThemeColorPreset,
  type AnimationSpeed,
  type BorderRadius,
  type ColorDefinition,
} from './theme';

export default useThemeStore;

import { useThemeStore } from './theme';

// Legacy type aliases
export type EffectPreset =
  | 'glassmorphism'
  | 'neon'
  | 'holographic'
  | 'minimal'
  | 'aurora'
  | 'cyberpunk';

export type AvatarBorderType =
  | 'none'
  | 'static'
  | 'glow'
  | 'pulse'
  | 'rotate'
  | 'fire'
  | 'ice'
  | 'electric'
  | 'legendary'
  | 'mythic';

export type ChatBubbleStylePreset =
  | 'default'
  | 'rounded'
  | 'sharp'
  | 'cloud'
  | 'modern'
  | 'retro'
  | 'bubble'
  | 'glassmorphism';
