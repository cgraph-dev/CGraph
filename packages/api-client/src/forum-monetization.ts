/**
 * Typed API methods for Forum Monetization.
 *
 * Follows the inline-types pattern (no shared-types imports).
 * All methods take a pre-configured ApiClient instance.
 *
 * @module @cgraph/api-client/forum-monetization
 */

import type { ApiClient } from './client';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Monetization mode for a forum. */
export type MonetizationMode = 'free' | 'gated' | 'hybrid';

/** A single monetization tier. */
export interface MonetizationTier {
  id: string;
  forum_id: string;
  name: string;
  monthly_price_nodes: number;
  yearly_price_nodes: number;
  features: string[];
  inserted_at: string;
  updated_at: string;
}

/** Input for creating or updating a tier. */
export interface TierInput {
  name: string;
  monthly_price_nodes: number;
  yearly_price_nodes: number;
  features: string[];
}

/** Forum monetization settings. */
export interface MonetizationSettings {
  forum_id: string;
  mode: MonetizationMode;
  tiers: MonetizationTier[];
}

// ---------------------------------------------------------------------------
// API methods
// ---------------------------------------------------------------------------

/** Fetch monetization settings for a forum. */
export function getMonetizationSettings(
  client: ApiClient,
  forumId: string
): Promise<MonetizationSettings> {
  return client.get<MonetizationSettings>(`/api/v1/forums/${forumId}/monetization`);
}

/** Update the monetization mode for a forum. */
export function updateMonetizationMode(
  client: ApiClient,
  forumId: string,
  mode: MonetizationMode
): Promise<MonetizationSettings> {
  return client.put<MonetizationSettings>(`/api/v1/forums/${forumId}/monetization`, {
    body: { mode },
  });
}

/** Create a new monetization tier. */
export function createTier(
  client: ApiClient,
  forumId: string,
  data: TierInput
): Promise<MonetizationTier> {
  return client.post<MonetizationTier>(`/api/v1/forums/${forumId}/monetization/tiers`, {
    body: data,
  });
}

/** Update an existing monetization tier. */
export function updateTier(
  client: ApiClient,
  forumId: string,
  tierId: string,
  data: TierInput
): Promise<MonetizationTier> {
  return client.put<MonetizationTier>(`/api/v1/forums/${forumId}/monetization/tiers/${tierId}`, {
    body: data,
  });
}

/** Delete a monetization tier. */
export function deleteTier(client: ApiClient, forumId: string, tierId: string): Promise<void> {
  return client.delete(`/api/v1/forums/${forumId}/monetization/tiers/${tierId}`);
}
