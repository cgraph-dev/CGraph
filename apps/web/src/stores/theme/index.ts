/**
 * Theme Store - Single Export Point
 *
 * Re-exports all theme-related functionality from themeStore.ts
 */

// Main store
export { useThemeStore } from './themeStore';

// Import for local use
import type { ColorPreset as ColorPresetType } from './themeStore';
import { useProfileTheme } from './themeStore';

// Types
export type {
  ColorPreset,
  AnimationSpeed,
  BorderRadius,
  ShadowIntensity,
  ColorDefinition,
  ProfileCardConfig,
  ThemePresetConfig,
  ChatBubbleConfig,
  AvatarBorderType,
  ChatBubbleStylePreset,
  EffectPreset,
  LegacyTheme,
  ThemeStore,
} from './themeStore';

// ThemeColorPreset alias for backward compatibility
export type ThemeColorPreset = ColorPresetType;

// Constants
export {
  COLORS,
  THEME_COLORS,
  PROFILE_CARD_CONFIGS,
  THEME_PRESETS,
  CHAT_BUBBLE_PRESETS,
} from './themeStore';

// Selector hooks
export {
  useColorPreset,
  useProfileThemeId,
  useProfileCardLayout,
  useEffectPresetValue,
  useAnimationSpeedValue,
  useParticlesEnabledValue,
  useGlowEnabledValue,
  useAnimatedBackgroundValue,
  useChatBubbleTheme,
  useColorTheme,
  useProfileTheme,
  useThemeEffects,
  useChatBubbleStore,
  useProfileThemeStore,
} from './themeStore';

// Utility functions
export {
  getPresetCategory,
  getColorsForPreset,
  getProfileCardConfigForLayout,
  getThemePreset,
} from './themeStore';

// Re-export forum theme types and hooks from legacy store
export {
  useForumThemeStore,
  useActiveForumTheme,
  type ForumTheme,
  type ForumThemePreset,
  type ForumTitleAnimation,
  type ForumRoleStyle,
} from '../forumThemeStore';

// Re-export UserTheme type from deprecated themeStore
export type { UserTheme } from '../themeStore';

// ============================================================================
// Profile Theme Types & Hooks (inlined from deleted profileThemeStore)
// ============================================================================

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
  cardLayout: string;
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

export const useActiveProfileTheme = () => useProfileTheme().preset;
export const useProfileCardConfig = () => useProfileTheme().cardConfig;

// ChatBubbleStyle alias for compatibility
import type { ChatBubbleConfig as ChatBubbleConfigType } from './themeStore';
export type ChatBubbleStyle = ChatBubbleConfigType;
