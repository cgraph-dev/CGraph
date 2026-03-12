/**
 * Typed API methods for the Cosmetics system.
 *
 * Follows the inline-types pattern (no @cgraph/shared-types imports).
 * All methods take a pre-configured ApiClient instance.
 *
 * @module @cgraph/api-client/cosmetics
 */

import type { ApiClient } from './client';

// ---------------------------------------------------------------------------
// Types — inline definitions aligned with backend JSON:API shapes
// ---------------------------------------------------------------------------

type CosmeticType =
  | 'border'
  | 'title'
  | 'badge'
  | 'nameplate'
  | 'profile_effect'
  | 'chat_bubble'
  | 'emoji_pack'
  | 'sound_pack'
  | 'theme'
  | 'profile_frame'
  | 'name_style';

interface Badge {
  id: string;
  name: string;
  description: string;
  icon_url: string;
  rarity: string;
  category: string;
  unlock_condition: {
    type: string;
    threshold: number | null;
    description?: string;
  };
}

interface Nameplate {
  id: string;
  name: string;
  background_url: string;
  text_color: string;
  border_style: string;
  rarity: string;
  animated: boolean;
}

interface ProfileEffect {
  id: string;
  name: string;
  type: string;
  config: Record<string, unknown>;
  rarity: string;
  preview_url: string;
}

interface ProfileFrame {
  id: string;
  name: string;
  frame_url: string;
  animated: boolean;
  rarity: string;
}

interface NameStyle {
  id: string;
  name: string;
  font_family: string;
  color_scheme: string[];
  animation: string | null;
  rarity: string;
}

interface InventoryItem {
  id: string;
  user_id: string;
  item_type: CosmeticType;
  item_id: string;
  equipped_at: string | null;
  obtained_at: string;
  obtained_via: string;
}

interface PaginationParams {
  page?: number;
  per_page?: number;
}

// ---------------------------------------------------------------------------
// API methods
// ---------------------------------------------------------------------------

/** Fetch the authenticated user's cosmetic inventory (or another user's). */
export function getInventory(
  client: ApiClient,
  userId?: string,
): Promise<InventoryItem[]> {
  const path = userId
    ? `/api/v1/users/${userId}/cosmetics/inventory`
    : '/api/v1/cosmetics/inventory';
  return client.get<InventoryItem[]>(path);
}

/** Equip a cosmetic item. */
export function equipItem(
  client: ApiClient,
  itemType: CosmeticType,
  itemId: string,
): Promise<{ equipped: boolean }> {
  return client.post('/api/v1/cosmetics/equip', {
    body: { item_type: itemType, item_id: itemId },
  });
}

/** Unequip a cosmetic item. */
export function unequipItem(
  client: ApiClient,
  itemType: CosmeticType,
  itemId: string,
): Promise<{ unequipped: boolean }> {
  return client.post('/api/v1/cosmetics/unequip', {
    body: { item_type: itemType, item_id: itemId },
  });
}

/** Fetch all available badges. */
export function getBadges(
  client: ApiClient,
  params?: PaginationParams,
): Promise<Badge[]> {
  return client.get<Badge[]>('/api/v1/cosmetics/badges', {
    params: params ? { page: params.page, per_page: params.per_page } : undefined,
  });
}

/** Fetch badges owned by a specific user. */
export function getUserBadges(
  client: ApiClient,
  userId: string,
): Promise<Badge[]> {
  return client.get<Badge[]>(`/api/v1/users/${userId}/cosmetics/badges`);
}

/** Fetch all available nameplates. */
export function getNameplates(
  client: ApiClient,
  params?: PaginationParams,
): Promise<Nameplate[]> {
  return client.get<Nameplate[]>('/api/v1/cosmetics/nameplates', {
    params: params ? { page: params.page, per_page: params.per_page } : undefined,
  });
}

/** Fetch nameplates owned by a specific user. */
export function getUserNameplates(
  client: ApiClient,
  userId: string,
): Promise<Nameplate[]> {
  return client.get<Nameplate[]>(`/api/v1/users/${userId}/cosmetics/nameplates`);
}

/** Fetch all available profile effects. */
export function getProfileEffects(
  client: ApiClient,
  params?: PaginationParams,
): Promise<ProfileEffect[]> {
  return client.get<ProfileEffect[]>('/api/v1/cosmetics/profile-effects', {
    params: params ? { page: params.page, per_page: params.per_page } : undefined,
  });
}

/** Fetch all available profile frames. */
export function getProfileFrames(
  client: ApiClient,
  params?: PaginationParams,
): Promise<ProfileFrame[]> {
  return client.get<ProfileFrame[]>('/api/v1/cosmetics/profile-frames', {
    params: params ? { page: params.page, per_page: params.per_page } : undefined,
  });
}

/** Fetch all available name styles. */
export function getNameStyles(
  client: ApiClient,
  params?: PaginationParams,
): Promise<NameStyle[]> {
  return client.get<NameStyle[]>('/api/v1/cosmetics/name-styles', {
    params: params ? { page: params.page, per_page: params.per_page } : undefined,
  });
}
