/**
 * Canonical cosmetic type definitions — single source of truth.
 *
 * Mirrors the backend `CGraph.Cosmetics` context.
 * All cosmetic-related interfaces and unions live here so that
 * web, mobile, and packages share identical shapes.
 *
 * @module shared-types/cosmetics
 */

import type { RarityTier } from './rarity';

// ---------------------------------------------------------------------------
// Cosmetic classification
// ---------------------------------------------------------------------------

/** All cosmetic surface types (where a cosmetic renders). */
export type CosmeticSurface =
  | 'avatar_border'
  | 'nameplate'
  | 'profile_effect'
  | 'chat_bubble'
  | 'badge'
  | 'title';

/** All cosmetic type slugs. */
export type CosmeticType =
  | 'border'
  | 'title'
  | 'badge'
  | 'nameplate'
  | 'profile_effect'
  | 'chat_bubble'
  | 'emoji_pack'
  | 'sound_pack'
  | 'theme';

/** Animation playback mode. */
export type AnimationType = 'none' | 'lottie' | 'css' | 'sprite' | 'video';

// ---------------------------------------------------------------------------
// Unlock system
// ---------------------------------------------------------------------------

/** How a cosmetic is obtained. */
export type UnlockType =
  | 'free'
  | 'purchase'
  | 'achievement'
  | 'level'
  | 'event'
  | 'subscription'
  | 'gift'
  | 'admin';

/** All supported unlock condition discriminators. */
export type UnlockConditionType =
  | 'level_reached'
  | 'achievement_earned'
  | 'messages_sent'
  | 'friends_count'
  | 'groups_joined'
  | 'events_attended'
  | 'streak_days'
  | 'reactions_received'
  | 'posts_created'
  | 'subscription_tier'
  | 'purchase'
  | 'gift_received'
  | 'admin_grant'
  | 'free';

/** Describes the condition a user must satisfy to unlock a cosmetic. */
export interface UnlockCondition {
  /** Discriminator */
  readonly type: UnlockConditionType;
  /** Threshold value (e.g. level number, count). Nullable for boolean conditions. */
  readonly threshold: number | null;
  /** Optional human-readable description override. */
  readonly description?: string;
}

// ---------------------------------------------------------------------------
// Core cosmetic item
// ---------------------------------------------------------------------------

/** A single cosmetic entry from the backend catalogue. */
export interface CosmeticItem {
  /** Unique cosmetic ID (UUID). */
  readonly id: string;
  /** URL-friendly slug (e.g. "cosmic-sovereign"). */
  readonly slug: string;
  /** Human-readable display name. */
  readonly name: string;
  /** Short description shown in pickers. */
  readonly description: string;
  /** The surface this cosmetic decorates. */
  readonly surface: CosmeticSurface;
  /** Cosmetic category. */
  readonly type: CosmeticType;
  /** Rarity tier. */
  readonly rarity: RarityTier;
  /** How this item is obtained. */
  readonly unlockType: UnlockType;
  /** Detailed unlock condition. */
  readonly unlockCondition: UnlockCondition;
  /** Animation playback mode. */
  readonly animationType: AnimationType;
  /** Lottie JSON filename (null if not Lottie-animated). */
  readonly lottieFile: string | null;
  /** Preview image URL. */
  readonly previewUrl: string | null;
  /** Hex color array for theming (e.g. gradient stops). */
  readonly colors: readonly string[];
  /** Whether the item is currently obtainable. */
  readonly available: boolean;
  /** ISO-8601 creation timestamp. */
  readonly createdAt: string;
}

// ---------------------------------------------------------------------------
// User inventory
// ---------------------------------------------------------------------------

/** A cosmetic item owned by a user, with equipped state. */
export interface UserCosmeticInventory {
  /** The cosmetic definition. */
  readonly cosmetic: CosmeticItem;
  /** Whether the user has this item equipped on its surface. */
  readonly equipped: boolean;
  /** ISO-8601 timestamp when the user acquired this item. */
  readonly acquiredAt: string;
  /** Source of acquisition (matches UnlockType). */
  readonly source: UnlockType;
}

// ---------------------------------------------------------------------------
// Visibility rules
// ---------------------------------------------------------------------------

/** Controls where a cosmetic is rendered. */
export interface CosmeticVisibilityRule {
  /** The surface this rule applies to. */
  readonly surface: CosmeticSurface;
  /** Show in chat messages. */
  readonly showInChat: boolean;
  /** Show on profile cards. */
  readonly showOnProfile: boolean;
  /** Show in member lists. */
  readonly showInMemberList: boolean;
  /** Show in friend lists. */
  readonly showInFriendList: boolean;
}
