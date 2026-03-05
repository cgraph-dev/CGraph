/**
 * Gamification Module
 *
 * Unified gamification system combining:
 * - Core XP, levels, achievements, quests (gamificationStore)
 * - Prestige system (prestigeSlice)
 * - Seasonal events (seasonalEventSlice)
 * - Marketplace (marketplaceSlice)
 * - Referral program (referralSlice)
 * - Avatar borders (avatarBorderStore)
 *
 * This module provides a single entry point for all gamification features
 * while maintaining backward compatibility with existing imports.
 */

// Re-export the main gamification store
export {
  useGamificationStore,
  type Achievement,
  type Quest,
  type QuestObjective,
  type UserTitle,
  type LoreEntry,
  type LevelInfo,
  type AchievementCategory,
  type AchievementRarity,
  type QuestType,
  XP_REWARDS,
} from './gamificationStore';

// Also re-export types from the module's types file for compatibility
export * from './types';

// Re-export prestige slice
export {
  usePrestigeStore,
  type PrestigeData,
  type PrestigeTier,
  type PrestigeRequirements,
  type PrestigeBonuses,
  type PrestigeReward,
  type PrestigeHistoryEntry,
  type LifetimeStats,
} from './prestigeSlice';

// Re-export seasonal events slice (store + types only)
export {
  useSeasonalEventStore,
  type SeasonalEvent,
  type EventProgress,
  type EventReward,
  type BattlePassTier,
  type EventMilestone,
  type EventType,
  type EventStatus,
} from './seasonalEventSlice';

// Seasonal selector hooks — imported directly to avoid circular dep
export {
  useActiveEvents,
  useFeaturedEvent,
  useCurrentEventProgress,
  useEventLeaderboard,
  useHasActiveBattlePass,
} from './seasonal-selectors';

// Re-export marketplace slice
export {
  useMarketplaceStore,
  type MarketplaceListing,
  type MarketplaceFilters,
  type MarketplaceStats,
  type ItemType,
  type CurrencyType,
  type SortOption,
} from './marketplaceSlice';

// Re-export referral slice
export {
  useReferralStore,
  type Referral,
  type ReferralStats,
  type ReferralReward,
  type RewardTier,
  type ReferralStatus,
} from './referralSlice';

// Import types for the unified interface
import type { Achievement, Quest } from './gamificationStore';
import type { PrestigeBonuses } from './prestigeSlice';
import type { SeasonalEvent } from './seasonalEventSlice';

// Unified type for all gamification data
export interface GamificationData {
  // Core gamification
  level: number;
  xp: number;
  karma: number;
  achievements: Achievement[];
  quests: Quest[];

  // Prestige
  prestigeLevel: number;
  prestigeBonuses: PrestigeBonuses;

  // Seasonal
  activeEvents: SeasonalEvent[];

  // Marketplace
  coinBalance: number;
  ownedItems: string[];

  // Referrals
  referralCode: string;
  referralCount: number;
}

// Re-export coin shop store
export { useCoinShopStore } from './coinShopStore';

// Re-export avatar border store
export * from './avatarBorderStore.impl';
