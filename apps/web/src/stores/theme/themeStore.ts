/**
 * Unified Theme System
 *
 * Consolidates: themeStore, profileThemeStore, forumThemeStore, chatBubbleStore
 *
 * This module provides a single, composable theme system that manages:
 * - Global color themes
 * - Profile themes (20+ presets)
 * - Forum themes (10+ presets)
 * - Chat bubble customization
 *
 * Types → ./types.ts | Presets/Data → ./presets.ts
 * Actions → ./actions.ts | Selectors → ./selectors.ts
 * Store creation & barrel → this file
 *
 * @module stores/theme/themeStore
 * @version 2.1.0
 * @since v0.9.7
 */

// Re-export the store from the dedicated store.ts to break circular dependency
// (selectors.ts imports useThemeStore, themeStore.ts re-exports selectors)
export { useThemeStore } from './store';

// =============================================================================
// RE-EXPORTS — Types (backward compatibility)
// =============================================================================

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
  ThemeState,
  ThemeActions,
  ThemeStore,
} from './types';

// =============================================================================
// RE-EXPORTS — Data (backward compatibility)
// =============================================================================

export {
  COLORS,
  PROFILE_CARD_CONFIGS,
  THEME_PRESETS,
  CHAT_BUBBLE_PRESETS,
  DEFAULT_CHAT_BUBBLE,
  DEFAULT_THEME_STATE,
  getPresetCategory,
  getColorsForPreset,
  getProfileCardConfigForLayout,
  getThemePreset,
} from './presets';

// =============================================================================
// RE-EXPORTS — Selectors & Legacy aliases
// =============================================================================

export {
  useColorPreset,
  useProfileThemeId,
  useProfileCardLayout,
  useEffectPresetValue,
  useAnimationSpeedValue,
  useParticlesEnabledValue,
  useGlowEnabledValue,
  useAnimatedBackgroundValue,
  useColorTheme,
  useProfileTheme,
  useChatBubbleTheme,
  useThemeEffects,
  THEME_COLORS,
  useChatBubbleStore,
  useProfileThemeStore,
} from './selectors';

// Default export for backward compatibility
export { default } from './store';
