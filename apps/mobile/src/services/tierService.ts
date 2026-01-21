/**
 * Tier Service
 * 
 * API service for subscription tiers and limits.
 * Provides methods to check limits, get tier info, and compare tiers.
 */

import { api } from './api';
import type {
  TierBasic,
  TierFull,
  UserTierInfo,
  TiersListResponse,
  TierShowResponse,
  MyTierResponse,
  TierCompareResponse,
  TierCheckActionResponse,
  TierCheckFeatureResponse,
} from '@cgraph/shared-types';

// =============================================================================
// API Functions
// =============================================================================

/**
 * List all available subscription tiers
 */
export async function listTiers(): Promise<TierBasic[]> {
  const response = await api.get<TiersListResponse>('/api/v1/tiers');
  return response.data.data;
}

/**
 * Get details for a specific tier
 */
export async function getTier(tierName: string): Promise<TierFull> {
  const response = await api.get<TierShowResponse>(`/api/v1/tiers/${tierName}`);
  return response.data.data;
}

/**
 * Get current user's tier and effective limits
 */
export async function getMyTier(): Promise<UserTierInfo> {
  const response = await api.get<MyTierResponse>('/api/v1/tiers/me');
  return response.data.data;
}

/**
 * Compare two tiers for upgrade/downgrade UI
 */
export async function compareTiers(fromTier: string, toTier: string): Promise<TierCompareResponse['data']> {
  const response = await api.get<TierCompareResponse>('/api/v1/tiers/compare', {
    params: { from: fromTier, to: toTier },
  });
  return response.data.data;
}

/**
 * Check if user can perform a specific action
 */
export type TierAction = 'create_forum' | 'join_forum' | 'create_thread' | 'create_post' | 'use_ai_moderation';

export async function checkAction(action: TierAction): Promise<TierCheckActionResponse['data']> {
  const response = await api.get<TierCheckActionResponse>(`/api/v1/tiers/check/${action}`);
  return response.data.data;
}

/**
 * Check if user has access to a feature
 */
export async function checkFeature(featureKey: string): Promise<boolean> {
  const response = await api.get<TierCheckFeatureResponse>(`/api/v1/tiers/features/${featureKey}`);
  return response.data.data.enabled;
}

// =============================================================================
// Convenience Functions
// =============================================================================

/**
 * Check if user can create a new forum
 */
export async function canCreateForum(): Promise<boolean> {
  const result = await checkAction('create_forum');
  return result.allowed;
}

/**
 * Check if user can join another forum
 */
export async function canJoinForum(): Promise<boolean> {
  const result = await checkAction('join_forum');
  return result.allowed;
}

/**
 * Check if user can create a thread today
 */
export async function canCreateThread(): Promise<boolean> {
  const result = await checkAction('create_thread');
  return result.allowed;
}

/**
 * Check if user has AI moderation access
 */
export async function hasAIModeration(): Promise<boolean> {
  return checkFeature('ai.moderation');
}

/**
 * Check if user has custom CSS access
 */
export async function hasCustomCSS(): Promise<boolean> {
  return checkFeature('forums.custom_css');
}

/**
 * Check if user has API access
 */
export async function hasAPIAccess(): Promise<boolean> {
  return checkFeature('api.access');
}

// =============================================================================
// Export all
// =============================================================================

export const tierService = {
  listTiers,
  getTier,
  getMyTier,
  compareTiers,
  checkAction,
  checkFeature,
  canCreateForum,
  canJoinForum,
  canCreateThread,
  hasAIModeration,
  hasCustomCSS,
  hasAPIAccess,
};

export default tierService;
