/**
 * Customization Store - Single Export Point
 *
 * Re-exports all customization-related functionality from customizationStore.ts
 */

// Main store
export { useCustomizationStore } from './customizationStore';

// Types
export type {
  ThemePreset,
  EffectPreset,
  AnimationSpeed,
  AvatarBorderType,
  ChatBubbleStyle,
  ProfileCardStyle,
  BubbleAnimation,
  ThemeColors,
  CustomizationState,
  CustomizationStore,
} from './customizationStore';

// Constants
export { THEME_COLORS, AVATAR_BORDERS, RARITY_COLORS } from './customizationStore';

// Theme selectors — imported directly from selectors to avoid circular dep
export {
  useThemePreset,
  useEffectPreset,
  useAnimationSpeed,
  useParticlesEnabled,
  useGlowEnabled,
  useBlurEnabled,
  useAnimatedBackground,
} from './customizationStore.selectors';

// Avatar selectors
export {
  useAvatarBorderType,
  useAvatarBorderColor,
  useAvatarSize,
} from './customizationStore.selectors';

// Chat bubble selectors
export {
  useChatBubbleStyle,
  useChatBubbleColor,
  useBubbleBorderRadius,
  useBubbleGlassEffect,
  useBubbleShowTail,
  useGroupMessages,
  useShowTimestamps,
  useCompactMode,
} from './customizationStore.selectors';

// Profile selectors
export {
  useProfileCardStyle,
  useShowBadges,
  useShowBio,
  useShowStatus,
  useEquippedTitle,
  useEquippedBadges,
} from './customizationStore.selectors';

// Loading state selectors
export {
  useIsLoading,
  useIsSaving,
  useIsDirty,
  useSyncError,
} from './customizationStore.selectors';

// Composite selectors
export {
  useChatSettings,
  useThemeSettings,
  useAvatarSettings,
  useProfileSettings,
  useSyncState,
} from './customizationStore.selectors';

// Mappings
export * from './mappings';

// Legacy compatibility hooks
export { useChatCustomization, useCustomizationInitializer } from './legacyHooks';
