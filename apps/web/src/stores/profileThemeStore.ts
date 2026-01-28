/**
 * @deprecated This file is deprecated. Import from '@/stores/theme' instead.
 *
 * This file re-exports from the consolidated theme store for backward compatibility.
 * All new code should import directly from '@/stores/theme'.
 *
 * @see /stores/theme/index.ts
 */

export {
  useThemeStore as useProfileThemeStore,
  useProfileTheme,
  THEME_PRESETS as PROFILE_THEME_PRESETS,
  PROFILE_CARD_CONFIGS,
  getPresetCategory,
  type ThemePresetConfig,
  type ProfileCardConfig,
} from './theme';

import { useThemeStore, useProfileTheme, PROFILE_CARD_CONFIGS } from './theme';

export default useThemeStore;

// Legacy type exports
export type ProfileThemePreset =
  | 'minimalist-dark'
  | 'minimalist-light'
  | 'gradient-aurora'
  | 'cyberpunk-neon'
  | 'fantasy-castle'
  | 'space-explorer'
  | 'ocean-deep'
  | 'forest-mystic'
  | 'desert-oasis'
  | 'arctic-tundra'
  | 'volcanic-fury'
  | 'steampunk'
  | 'synthwave'
  | 'vaporwave'
  | 'gothic'
  | 'kawaii'
  | 'industrial'
  | 'nature-zen'
  | 'abstract-art'
  | 'gaming-rgb'
  | 'holographic'
  | 'custom';

export type ProfileCardLayout =
  | 'minimal'
  | 'compact'
  | 'detailed'
  | 'gaming'
  | 'social'
  | 'creator'
  | 'custom';

export type ProfileHoverEffect =
  | 'none'
  | 'scale'
  | 'tilt'
  | 'glow'
  | 'particles'
  | 'border-animate';

export type ProfileBackgroundType =
  | 'color'
  | 'gradient'
  | 'image'
  | 'video'
  | 'animated'
  | 'particles';

export interface ProfileBackground {
  type: ProfileBackgroundType;
  value: string;
  overlay?: boolean;
  overlayOpacity?: number;
  parallax?: boolean;
  blur?: number;
}

export interface ProfileThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  textMuted: string;
}

export interface ProfileTheme {
  id: string;
  name: string;
  preset: ProfileThemePreset;
  colors: ProfileThemeColors;
  background: ProfileBackground;
  cardLayout: ProfileCardLayout;
  hoverEffect: ProfileHoverEffect;
  fontFamily: string;
  glassmorphism: boolean;
  borderRadius: 'none' | 'sm' | 'md' | 'lg' | 'full';
  showParticles: boolean;
  particleType?: string;
  musicEnabled: boolean;
  musicUrl?: string;
  musicAutoplay: boolean;
  musicVolume: number;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

// Legacy hooks
export const useActiveProfileTheme = () => useProfileTheme().preset;
export const useProfileCardConfig = () => useProfileTheme().cardConfig;
