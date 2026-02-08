/**
 * Type definitions for Event Banner system
 * @module modules/gamification/components/events/event-banner/types
 */

import type { SeasonalEvent, EventReward, BattlePassTier } from '@/modules/gamification/store';

/**
 * Extended reward with icon support (for display purposes)
 */
export interface DisplayReward extends EventReward {
  icon?: string;
}

/**
 * Extended tier type that includes singular reward accessors for backward compatibility
 */
export interface BattlePassTierExtended extends Omit<
  BattlePassTier,
  'freeRewards' | 'premiumRewards'
> {
  id: number;
  claimed?: boolean;
  freeReward: DisplayReward;
  premiumReward: DisplayReward;
  freeRewards: EventReward[];
  premiumRewards: EventReward[];
}

/**
 * Props for EventBanner component
 */
export interface EventBannerProps {
  event: SeasonalEvent;
  variant?: 'full' | 'compact' | 'minimal';
  onClick?: () => void;
}

/**
 * Props for BattlePassProgress component
 */
export interface BattlePassProgressProps {
  tiers: BattlePassTier[];
  currentTier: number;
  currentXP: number;
  xpPerTier: number;
  isPremium: boolean;
  onClaimReward?: (tierId: number) => void;
  onUpgrade?: () => void;
}

/**
 * Leaderboard entry data structure
 */
export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  avatarBorderId?: string | null;
  avatar_border_id?: string | null;
  score: number;
  change?: number;
}

/**
 * Props for EventLeaderboard component
 */
export interface EventLeaderboardProps {
  entries: LeaderboardEntry[];
  currentUserId?: string;
  isLoading?: boolean;
  onLoadMore?: () => void;
  hasMore?: boolean;
}

/**
 * Quest data structure
 */
export interface Quest {
  id: string;
  title: string;
  description: string;
  type: 'daily' | 'weekly' | 'event';
  progress: number;
  target: number;
  reward: {
    type: string;
    amount: number;
    icon: string;
  };
  expiresAt?: Date;
  completed: boolean;
  claimed: boolean;
}

/**
 * Props for QuestTracker component
 */
export interface QuestTrackerProps {
  quests: Quest[];
  onClaimReward?: (questId: string) => void;
}

/**
 * Props for CountdownUnit component
 */
export interface CountdownUnitProps {
  value: number;
  label: string;
}

/**
 * Time remaining structure for countdown
 */
export interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}
