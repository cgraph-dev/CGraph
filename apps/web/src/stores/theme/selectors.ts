/**
 * Theme Store - Selector Hooks
 *
 * Individual primitive selectors to avoid infinite render loops.
 * Object-returning selectors create new references on every render, breaking React.
 *
 * Also houses legacy alias exports for backward compatibility.
 *
 * @module stores/theme/selectors
 * @version 2.1.0
 * @since v0.9.7
 */

import { COLORS, PROFILE_CARD_CONFIGS, THEME_PRESETS } from './presets';
import { useThemeStore } from './store';

// =============================================================================
// INDIVIDUAL SELECTORS
// =============================================================================

// Color theme selectors
export const useColorPreset = () => useThemeStore((s) => s.colorPreset);
export const useProfileThemeId = () => useThemeStore((s) => s.profileThemeId);
export const useProfileCardLayout = () => useThemeStore((s) => s.profileCardLayout);
export const useEffectPresetValue = () => useThemeStore((s) => s.effectPreset);
export const useAnimationSpeedValue = () => useThemeStore((s) => s.animationSpeed);
export const useParticlesEnabledValue = () => useThemeStore((s) => s.particlesEnabled);
export const useGlowEnabledValue = () => useThemeStore((s) => s.glowEnabled);
export const useAnimatedBackgroundValue = () => useThemeStore((s) => s.animatedBackground);

/**
 * Hook that returns the current color preset and provides a way to get colors.
 * Uses a single primitive selector for stability.
 */
export const useColorTheme = () => {
  const colorPreset = useThemeStore((s) => s.colorPreset);
  return { preset: colorPreset, colors: COLORS[colorPreset] };
};

/**
 * Hook for profile theme data using individual selectors.
 */
export const useProfileTheme = () => {
  const themeId = useThemeStore((s) => s.profileThemeId);
  const layout = useThemeStore((s) => s.profileCardLayout);
  return {
    themeId,
    preset: THEME_PRESETS[themeId],
    cardConfig: PROFILE_CARD_CONFIGS[layout],
  };
};

export const useChatBubbleTheme = () => useThemeStore((s) => s.chatBubble);

/**
 * @deprecated Use individual selectors instead to avoid potential render issues.
 * Example: useEffectPresetValue(), useAnimationSpeedValue(), etc.
 */
export const useThemeEffects = () => {
  // Get state once for this render - less problematic than object selector
  const state = useThemeStore.getState();
  return {
    effectPreset: state.effectPreset,
    animationSpeed: state.animationSpeed,
    particlesEnabled: state.particlesEnabled,
    glowEnabled: state.glowEnabled,
    animatedBackground: state.animatedBackground,
  };
};

// =============================================================================
// LEGACY EXPORTS (for backward compatibility)
// =============================================================================

export const THEME_COLORS = COLORS;
export const useChatBubbleStore = useThemeStore;
export const useProfileThemeStore = useThemeStore;
