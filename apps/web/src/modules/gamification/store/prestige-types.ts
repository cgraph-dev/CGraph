/**
 * Prestige system type definitions.
 * @module
 */
// ==================== TYPE DEFINITIONS ====================

export interface PrestigeBonuses {
  xp: number; // Percentage as decimal (0.05 = 5%)
  coins: number;
  karma: number;
  dropRate: number;
}

export interface LifetimeStats {
  xp: number;
  karma: number;
  coinsEarned: number;
  messages: number;
}

export interface PrestigeHistoryEntry {
  level: number;
  prestigedAt: string;
  xpAtPrestige: number;
  lifetimeXpAtPrestige: number;
}

export interface PrestigeReward {
  type: 'title' | 'border' | 'effect' | 'badge' | 'xp_bonus' | 'coins';
  name?: string;
  id?: string;
  amount?: number;
}

export interface PrestigeTier {
  level: number;
  xpRequired: number;
  bonuses: PrestigeBonuses;
  exclusiveRewards: PrestigeReward[];
}

export interface PrestigeRequirements {
  requiredXp: number;
  currentXp: number;
  progress: number;
  nextLevel: number;
}

export interface PrestigeData {
  level: number;
  xp: number;
  xpToNext: number;
  bonuses: PrestigeBonuses;
  lifetime: LifetimeStats;
  totalResets: number;
  lastPrestigeAt: string | null;
  exclusiveTitles: string[];
  exclusiveBorders: string[];
  exclusiveEffects: string[];
}

// ==================== STATE INTERFACE ====================

export interface PrestigeState {
  // Current prestige data
  prestige: PrestigeData | null;
  requirements: PrestigeRequirements | null;
  canPrestige: boolean;

  // Tier information
  allTiers: PrestigeTier[];

  // Leaderboard
  leaderboard: Array<{
    rank: number;
    userId: string;
    username: string;
    displayName: string;
    avatarUrl: string;
    prestigeLevel: number;
    lifetimeXp: number;
    totalResets: number;
  }>;

  // Loading states
  isLoading: boolean;
  isPrestiging: boolean;

  // Actions
  fetchPrestige: () => Promise<void>;
  fetchRewards: () => Promise<void>;
  fetchLeaderboard: (limit?: number, offset?: number) => Promise<void>;
  performPrestige: () => Promise<{ success: boolean; rewards?: PrestigeReward[] }>;

  // Computed
  getProgressPercent: () => number;
  getBonusForLevel: (level: number) => PrestigeBonuses;
  getXpWithBonus: (baseXp: number) => number;
  getCoinWithBonus: (baseCoins: number) => number;

  /** Reset store to initial state */
  reset: () => void;
}
