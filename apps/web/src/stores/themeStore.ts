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
  type AvatarBorderType,
} from './theme';

export default useThemeStore;

import {
  useThemeStore,
  type ColorPreset,
  type AnimationSpeed,
  type AvatarBorderType,
} from './theme';

// UserTheme interface for passing theme settings to components
export interface UserTheme {
  colorPreset?: ColorPreset;
  avatarBorder?: AvatarBorderType;
  avatarBorderColor?: ColorPreset;
  chatBubbleColor?: ColorPreset;
  chatBubbleStyle?: string;
  animationSpeed?: AnimationSpeed;
  particlesEnabled?: boolean;
  glowEnabled?: boolean;
}

// Legacy type aliases - re-export from theme module
export type EffectPreset =
  | 'glassmorphism'
  | 'neon'
  | 'holographic'
  | 'minimal'
  | 'aurora'
  | 'cyberpunk';

// AvatarBorderType already exported from './theme' above

export type ChatBubbleStylePreset =
  | 'default'
  | 'rounded'
  | 'sharp'
  | 'cloud'
  | 'modern'
  | 'retro'
  | 'bubble'
  | 'glassmorphism';
