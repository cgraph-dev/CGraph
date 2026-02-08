/**
 * Referral System Store
 *
 * Complete MyBB-style referral system with:
 * - Unique referral codes/links
 * - Referral tracking
 * - Reward system (XP, coins, badges)
 * - Leaderboard
 * - Statistics
 *
 * Split into submodules:
 * - referral-types.ts: All type/interface definitions
 * - referral-actions.ts: Store actions and API mapping helpers
 */

import { create } from 'zustand';
import { createReferralActions } from './referral-actions';
import type { ReferralState } from './referral-types';

// Re-export all types for consumers
export type {
  Referral,
  ReferralCode,
  ReferralLeader,
  ReferralReward,
  ReferralState,
  ReferralStats,
  ReferralStatus,
  RewardTier,
} from './referral-types';

// Re-export helper for testing/reuse
export { mapReferralFromApi } from './referral-actions';

// Create the store
export const useReferralStore = create<ReferralState>(createReferralActions);
