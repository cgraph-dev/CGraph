/**
 * DailyRewards Types
 *
 * Type definitions for daily rewards system
 */

/**
 * Individual daily reward
 */
export interface DailyReward {
  day: number;
  xp: number;
  coins?: number;
  special?: {
    type: 'border' | 'badge' | 'title' | 'item';
    name: string;
    icon?: string;
  };
  isPremium?: boolean;
  claimed?: boolean;
}

/**
 * Monthly reward configuration
 */
export interface MonthlyRewardConfig {
  name: string;
  icon: string;
  daysRequired: number;
}

/**
 * Props for main DailyRewards component
 */
export interface DailyRewardsProps {
  rewards?: DailyReward[];
  currentDay: number;
  canClaim: boolean;
  nextClaimTime?: Date;
  isPremium?: boolean;
  onClaim?: () => Promise<void>;
  onClaimWithAd?: () => Promise<void>;
  monthlyProgress?: number;
  monthlyReward?: MonthlyRewardConfig;
  variant?: 'default' | 'compact' | 'modal';
  className?: string;
}

/**
 * Props for RewardCard sub-component
 */
export interface RewardCardProps {
  reward: DailyReward;
  index: number;
  currentDay: number;
  canClaim: boolean;
  isPremium: boolean;
  primaryColor: string;
}

/**
 * Props for CompactView sub-component
 */
export interface CompactViewProps {
  canClaim: boolean;
  todayReward: DailyReward;
  timeUntilClaim: string;
  isClaiming: boolean;
  primaryColor: string;
  onClaim?: () => void;
  className?: string;
}

/**
 * Props for RewardDetails sub-component
 */
export interface RewardDetailsProps {
  todayReward: DailyReward;
  canClaim: boolean;
  isClaiming: boolean;
  primaryColor: string;
  onClaim?: () => void;
}

/**
 * Props for ClaimSuccessModal sub-component
 */
export interface ClaimSuccessModalProps {
  claimedReward: DailyReward | null;
}
