// Logger reserved for future debugging
// import { createLogger } from '@/lib/logger';
// const _logger = createLogger('CustomizationStoreV2.tsStore');

/**
 * @deprecated This file is deprecated. Import from '@/stores/customization' instead.
 *
 * This file re-exports from the consolidated customization store for backward compatibility.
 * All new code should import directly from '@/stores/customization'.
 *
 * @see /stores/customization/index.ts
 */

export {
  useCustomizationStore as useCustomizationStoreV2,
  useCustomizationStore,
  useThemeSettings,
  useAvatarSettings,
  useChatSettings,
  useProfileSettings,
  useSyncState,
  THEME_COLORS as themeColors,
  AVATAR_BORDERS as avatarBorders,
  RARITY_COLORS as rarityColors,
  type ThemePreset,
  type EffectPreset,
  type AnimationSpeed,
  type AvatarBorderType,
  type ChatBubbleStyle,
  type ProfileCardStyle,
  type BubbleAnimation,
  type ThemeColors,
  type CustomizationState as CustomizationStateV2,
  type CustomizationStore,
} from './customization';
