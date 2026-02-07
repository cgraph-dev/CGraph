/**
 * Customization Store - Selectors
 *
 * All selector hooks extracted from customizationStore.ts.
 * IMPORTANT: Always use individual primitive selectors to avoid infinite render loops.
 * Object-returning selectors create new references on every render, breaking React.
 * Pattern: useCustomizationStore(s => s.fieldName)
 *
 * @version 2.0.0
 * @since v0.9.7
 */

import { useCustomizationStore } from './customizationStore';
import { THEME_COLORS } from './customizationStore.types';
import type { ThemePreset } from './customizationStore.types';
import { createLogger } from '@/lib/logger';

const logger = createLogger('customizationStore');

// =============================================================================
// INDIVIDUAL SELECTORS
// =============================================================================

// Theme selectors
export const useThemePreset = () => useCustomizationStore((s) => s.themePreset);
export const useEffectPreset = () => useCustomizationStore((s) => s.effectPreset);
export const useAnimationSpeed = () => useCustomizationStore((s) => s.animationSpeed);
export const useParticlesEnabled = () => useCustomizationStore((s) => s.particlesEnabled);
export const useGlowEnabled = () => useCustomizationStore((s) => s.glowEnabled);
export const useBlurEnabled = () => useCustomizationStore((s) => s.blurEnabled);
export const useAnimatedBackground = () => useCustomizationStore((s) => s.animatedBackground);

// Avatar selectors
export const useAvatarBorderType = () => useCustomizationStore((s) => s.avatarBorderType);
export const useAvatarBorderColor = () => useCustomizationStore((s) => s.avatarBorderColor);
export const useAvatarSize = () => useCustomizationStore((s) => s.avatarSize);

// Chat selectors
export const useChatBubbleStyle = () => useCustomizationStore((s) => s.chatBubbleStyle);
export const useChatBubbleColor = () => useCustomizationStore((s) => s.chatBubbleColor);
export const useBubbleBorderRadius = () => useCustomizationStore((s) => s.bubbleBorderRadius);
export const useBubbleGlassEffect = () => useCustomizationStore((s) => s.bubbleGlassEffect);
export const useBubbleShowTail = () => useCustomizationStore((s) => s.bubbleShowTail);
export const useGroupMessages = () => useCustomizationStore((s) => s.groupMessages);
export const useShowTimestamps = () => useCustomizationStore((s) => s.showTimestamps);
export const useCompactMode = () => useCustomizationStore((s) => s.compactMode);

// Profile selectors
export const useProfileCardStyle = () => useCustomizationStore((s) => s.profileCardStyle);
export const useShowBadges = () => useCustomizationStore((s) => s.showBadges);
export const useShowBio = () => useCustomizationStore((s) => s.showBio);
export const useShowStatus = () => useCustomizationStore((s) => s.showStatus);
export const useEquippedTitle = () => useCustomizationStore((s) => s.equippedTitle);
export const useEquippedBadges = () => useCustomizationStore((s) => s.equippedBadges);

// Sync state selectors
export const useIsLoading = () => useCustomizationStore((s) => s.isLoading);
export const useIsSaving = () => useCustomizationStore((s) => s.isSaving);
export const useIsDirty = () => useCustomizationStore((s) => s.isDirty);
export const useSyncError = () => useCustomizationStore((s) => s.error);

// =============================================================================
// HELPER / COMPOSITE SELECTORS
// =============================================================================

// Helper to get theme colors for a preset
export function getThemeColors(preset: ThemePreset): typeof THEME_COLORS.emerald {
  return THEME_COLORS[preset];
}

// Convenience hooks that combine a selector with getThemeColors
// Usage: const colors = useChatThemeColors();
export function useChatThemeColors(): typeof THEME_COLORS.emerald {
  const color = useChatBubbleColor();
  return THEME_COLORS[color];
}

export function useAvatarThemeColors(): typeof THEME_COLORS.emerald {
  const color = useAvatarBorderColor();
  return THEME_COLORS[color];
}

// =============================================================================
// DEPRECATED SELECTORS
// =============================================================================

/**
 * @deprecated Use individual selectors instead. Object selectors cause infinite render loops.
 * Example: useCustomizationStore(s => s.chatBubbleStyle) instead of useChatSettings()
 */
export const useChatSettings = () => {
  if (process.env.NODE_ENV === 'development') {
    logger.warn(
      '[useChatSettings] Deprecated: Use individual selectors like useChatBubbleStyle() instead. ' +
        'Object selectors cause infinite render loops.'
    );
  }
  return useCustomizationStore.getState();
};

/**
 * @deprecated Use individual selectors instead. Object selectors cause infinite render loops.
 */
export const useThemeSettings = useChatSettings;
export const useAvatarSettings = useChatSettings;
export const useProfileSettings = useChatSettings;
export const useSyncState = useChatSettings;
