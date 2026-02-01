/**
 * Theme Store - Single Export Point
 *
 * Re-exports all theme-related functionality from themeStore.ts
 */

// Main store
export { useThemeStore } from './themeStore';

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

// Constants
export { COLORS, PROFILE_CARD_CONFIGS, THEME_PRESETS, CHAT_BUBBLE_PRESETS } from './themeStore';

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
} from './themeStore';

// Utility functions
export {
  getPresetCategory,
  getColorsForPreset,
  getProfileCardConfigForLayout,
  getThemePreset,
} from './themeStore';
