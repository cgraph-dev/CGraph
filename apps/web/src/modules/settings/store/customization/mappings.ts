/**
 * Customization ID Mappings
 *
 * Centralized mapping constants for converting between item IDs and their
 * corresponding customization types. Used throughout the app for consistent
 * type resolution.
 *
 * @version 1.0.0
 * @since v0.9.8
 */

// Import types directly from types file to avoid circular dep through barrel
import type {
  AvatarBorderType,
  ThemePreset,
  ChatBubbleStyle,
  BubbleAnimation,
  // ProfileCardStyle - reserved for future use
} from './customizationStore.types';

// =============================================================================
// AVATAR BORDER MAPPINGS
// =============================================================================

/**
 * Maps avatar border item IDs to their animation types.
 * Used by IdentityCustomization and LivePreviewPanel for border rendering.
 */
export const BORDER_ID_TO_TYPE: Record<string, AvatarBorderType> = {
  b1: 'static',
  b2: 'static',
  b3: 'static',
  b4: 'static',
  b5: 'pulse',
  b6: 'rotate',
  b7: 'glow',
  b8: 'electric',
  b9: 'rotate',
  b10: 'fire',
  b11: 'ice',
  b12: 'glow',
  b13: 'fire',
  b14: 'legendary',
  b15: 'mythic',
  b16: 'fire',
  b17: 'mythic',
  b18: 'legendary',
};

// =============================================================================
// THEME MAPPINGS
// =============================================================================

/**
 * Maps profile theme IDs to color presets.
 * Used for determining avatar border colors and profile backgrounds.
 */
export const PROFILE_THEME_TO_COLOR: Record<string, ThemePreset> = {
  'profile-default': 'purple',
  'classic-purple': 'purple',
  'profile-ocean': 'cyan',
  'profile-forest': 'emerald',
  'profile-sunset': 'orange',
  'profile-midnight': 'purple',
  'profile-cherry': 'pink',
};

/**
 * Maps theme IDs to ThemePreset for global theming.
 * Includes mappings for profile, chat, and app themes.
 */
export const THEME_ID_TO_PRESET: Record<string, ThemePreset> = {
  // Profile themes
  'profile-default': 'purple',
  'classic-purple': 'purple',
  'profile-ocean': 'cyan',
  'profile-forest': 'emerald',
  'profile-sunset': 'orange',
  'profile-midnight': 'purple',
  'profile-cherry': 'pink',
  // Chat themes
  'chat-default': 'purple',
  'chat-indigo': 'purple',
  'chat-sky': 'cyan',
  'chat-neon': 'pink',
  'chat-minimal': 'emerald',
  // App themes
  'app-default': 'emerald',
  'app-dark': 'purple',
  'app-light': 'cyan',
};

/**
 * Maps chat theme IDs to color presets for chat bubbles.
 */
export const CHAT_THEME_TO_COLOR: Record<string, ThemePreset> = {
  'chat-default': 'purple',
  'chat-indigo': 'purple',
  'chat-sky': 'cyan',
  'chat-neon': 'pink',
  'chat-minimal': 'emerald',
  default: 'emerald',
};

// =============================================================================
// CHAT BUBBLE MAPPINGS
// =============================================================================

/**
 * Maps chat bubble style IDs to ChatBubbleStyle enum values.
 * Used by ChatCustomization for style selection.
 */
export const BUBBLE_ID_TO_STYLE: Record<string, ChatBubbleStyle> = {
  'bubble-default': 'rounded',
  'bubble-pill': 'rounded',
  'bubble-sharp': 'sharp',
  'bubble-asymmetric': 'modern',
  'bubble-flat': 'modern',
  'bubble-aero': 'cloud',
  'bubble-minimal': 'default',
  'bubble-neon': 'modern',
  'bubble-gradient': 'modern',
  'bubble-glass': 'modern',
  'bubble-retro': 'retro',
  'bubble-cloud': 'cloud',
};

/**
 * Maps message effect IDs to BubbleAnimation enum values.
 * Used by ChatCustomization for animation selection.
 */
export const EFFECT_ID_TO_ANIMATION: Record<string, BubbleAnimation> = {
  'effect-none': 'none',
  'effect-bounce': 'bounce',
  'effect-slide': 'slide',
  'effect-fade': 'fade',
  'effect-scale': 'scale',
  'effect-pop': 'scale',
  'effect-rotate': 'flip',
};

// =============================================================================
// TITLE MAPPINGS
// =============================================================================

import { ALL_TITLES } from '@/data/titlesCollection';

/**
 * Title display configuration with name and gradient styling.
 */
export interface TitleDisplay {
  name: string;
  gradient: string;
}

/**
 * Maps title IDs to display names and gradient classes.
 * Generated dynamically from the static titles collection.
 */
export const TITLE_DISPLAY_NAMES: Record<string, TitleDisplay> = Object.fromEntries(
  ALL_TITLES.map((t) => [t.id, { name: t.displayName, gradient: t.gradient }])
);

/**
 * Legendary and mythic title IDs for special rendering.
 */
export const LEGENDARY_TITLE_IDS = ALL_TITLES
  .filter((t) => t.rarity === 'legendary' || t.rarity === 'mythic')
  .map((t) => t.id);
export const MYTHIC_TITLE_IDS = ALL_TITLES
  .filter((t) => t.rarity === 'mythic')
  .map((t) => t.id);
export const RARE_TITLE_IDS = [...LEGENDARY_TITLE_IDS] as const;

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Gets the border type for a given border ID.
 * Returns 'none' if the ID is not found.
 */
export function getBorderType(borderId: string | null): AvatarBorderType {
  return borderId ? (BORDER_ID_TO_TYPE[borderId] ?? 'none') : 'none';
}

/**
 * Gets the theme color preset for a given theme ID.
 * Returns 'emerald' as the default if not found.
 */
export function getThemeColor(themeId: string | null): ThemePreset {
  return themeId ? (PROFILE_THEME_TO_COLOR[themeId] ?? 'emerald') : 'emerald';
}

/**
 * Gets the theme preset for any theme ID (profile, chat, or app).
 * Returns 'emerald' as the default if not found.
 */
export function getThemePreset(themeId: string | null): ThemePreset {
  return themeId ? (THEME_ID_TO_PRESET[themeId] ?? 'emerald') : 'emerald';
}

/**
 * Gets the chat bubble style for a given bubble ID.
 * Returns 'default' if the ID is not found.
 */
export function getBubbleStyle(bubbleId: string | null): ChatBubbleStyle {
  return bubbleId ? (BUBBLE_ID_TO_STYLE[bubbleId] ?? 'default') : 'default';
}

/**
 * Gets the bubble animation for a given effect ID.
 * Returns 'none' if the ID is not found.
 */
export function getBubbleAnimation(effectId: string | null): BubbleAnimation {
  return effectId ? (EFFECT_ID_TO_ANIMATION[effectId] ?? 'none') : 'none';
}

/**
 * Gets the chat theme color for a given chat theme ID.
 * Returns 'emerald' as the default if not found.
 */
export function getChatThemeColor(chatThemeId: string | null): ThemePreset {
  return chatThemeId ? (CHAT_THEME_TO_COLOR[chatThemeId] ?? 'emerald') : 'emerald';
}

/**
 * Checks if a title ID is legendary or mythic (special rendering).
 */
export function isRareTitle(titleId: string | null): boolean {
  return titleId !== null && RARE_TITLE_IDS.includes(titleId);
}

/**
 * Gets the display configuration for a title.
 */
export function getTitleDisplay(titleId: string | null): TitleDisplay | null {
  return titleId ? (TITLE_DISPLAY_NAMES[titleId] ?? null) : null;
}

// =============================================================================
// BADGE MAPPINGS
// =============================================================================

import { ALL_BADGES } from '@/data/badgesCollection';
import type { BadgeRarity } from '@/data/badgesCollection';

/**
 * Hex colors for badge rarities, used in live preview rendering.
 */
export const BADGE_RARITY_HEX: Record<BadgeRarity, string> = {
  common: '#9ca3af',
  rare: '#3b82f6',
  epic: '#8b5cf6',
  legendary: '#f59e0b',
  mythic: '#ec4899',
};

/**
 * Badge display data for live preview rendering.
 */
export interface BadgeDisplay {
  icon: string;
  color: string;
  name: string;
  rarity: BadgeRarity;
}

/**
 * Maps badge IDs to display data for the live preview.
 * Generated dynamically from the static badges collection.
 */
export const BADGE_DISPLAY_MAP: Record<string, BadgeDisplay> = Object.fromEntries(
  ALL_BADGES.map((b) => [
    b.id,
    {
      icon: b.icon,
      color: BADGE_RARITY_HEX[b.rarity],
      name: b.name,
      rarity: b.rarity,
    },
  ])
);

/**
 * Resolves an array of badge IDs to their display data.
 * Returns only badges that exist in the collection.
 */
export function resolveEquippedBadges(badgeIds: string[]): BadgeDisplay[] {
  return badgeIds
    .map((id) => BADGE_DISPLAY_MAP[id])
    .filter((b): b is BadgeDisplay => b !== undefined);
}
