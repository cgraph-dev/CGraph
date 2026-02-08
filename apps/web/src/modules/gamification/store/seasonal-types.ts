/**
 * Seasonal Event Types
 *
 * Type definitions for the seasonal event system including
 * events, rewards, milestones, battle pass, and leaderboards.
 */

// ==================== TYPE DEFINITIONS ====================

export type EventType = 'seasonal' | 'holiday' | 'special' | 'anniversary' | 'collab' | 'community';
export type EventStatus = 'upcoming' | 'active' | 'ending' | 'ended';

export interface EventReward {
  id: string;
  type: 'coins' | 'gems' | 'xp' | 'title' | 'border' | 'effect' | 'badge';
  name: string;
  amount?: number;
  rarity?: string;
  previewUrl?: string;
}

export interface EventMilestone {
  id: string;
  pointsRequired: number;
  rewards: EventReward[];
  description?: string;
}

export interface BattlePassTier {
  tier: number;
  xpRequired: number;
  freeRewards: EventReward[];
  premiumRewards: EventReward[];
}

export interface SeasonalEvent {
  id: string;
  slug: string;
  name: string;
  description: string;
  type: EventType;
  status: EventStatus;
  startsAt: string;
  endsAt: string;
  bannerUrl?: string;
  iconUrl?: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  hasBattlePass: boolean;
  battlePassCost: number;
  hasLeaderboard: boolean;
  featured: boolean;
  isActive: boolean;
  inGracePeriod: boolean;
  // Detailed info (optional)
  theme?: Record<string, unknown>;
  rewards?: EventReward[];
  milestoneRewards?: EventMilestone[];
  participationRewards?: EventReward[];
  eventCurrency?: string;
  eventCurrencyIcon?: string;
  multipliers?: {
    xp: number;
    coins: number;
    karma: number;
  };
  dailyChallenges?: Array<{
    id: string;
    name: string;
    description: string;
    reward: EventReward;
    progress: number;
    target: number;
  }>;
  battlePassTiers?: BattlePassTier[];
  leaderboardRewards?: EventReward[];
}

export interface EventProgress {
  eventPoints: number;
  currencyEarned: number;
  currencyBalance: number;
  questsCompleted: number;
  milestonesClaimed: string[];
  hasBattlePass: boolean;
  battlePassTier: number;
  battlePassXp: number;
  leaderboardPoints: number;
  bestRank: number | null;
  firstParticipatedAt: string | null;
  lastParticipatedAt: string | null;
  totalSessions: number;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  points: number;
  eventPoints: number;
  battlePassTier: number;
}

// ==================== STATE INTERFACE ====================

export interface SeasonalEventState {
  // Events
  activeEvents: SeasonalEvent[];
  upcomingEvents: SeasonalEvent[];
  endedEvents: SeasonalEvent[];
  featuredEvent: SeasonalEvent | null;

  // Current event tracking
  currentEventId: string | null;
  currentEvent: SeasonalEvent | null;
  currentProgress: EventProgress | null;
  nextMilestone: EventMilestone | null;
  availableRewards: EventMilestone[];

  // Leaderboard
  leaderboard: LeaderboardEntry[];
  userRank: number | null;

  // Loading states
  isLoading: boolean;
  isJoining: boolean;
  isClaiming: boolean;
  isPurchasing: boolean;

  // Actions
  fetchEvents: (includeEnded?: boolean) => Promise<void>;
  fetchEventDetails: (eventId: string) => Promise<void>;
  fetchProgress: (eventId: string) => Promise<void>;
  joinEvent: (eventId: string) => Promise<{ success: boolean; welcomeRewards?: EventReward[] }>;
  claimReward: (
    eventId: string,
    rewardId: string
  ) => Promise<{ success: boolean; reward?: EventReward }>;
  fetchLeaderboard: (eventId: string, limit?: number, offset?: number) => Promise<void>;
  purchaseBattlePass: (
    eventId: string
  ) => Promise<{ success: boolean; retroactiveRewards?: EventReward[] }>;

  // Computed
  getTimeRemaining: (eventId: string) => { days: number; hours: number; minutes: number } | null;
  isEventActive: (eventId: string) => boolean;
  canClaimMilestone: (milestoneId: string) => boolean;
}
