/**
 * Types for Streak Tracker Module
 */

/**
 * Represents a single day in the streak calendar
 */
export interface StreakDay {
  date: string;
  completed: boolean;
  reward?: {
    xp: number;
    coins?: number;
    special?: string;
  };
}

/**
 * Represents a streak milestone with rewards
 */
export interface StreakMilestone {
  days: number;
  reward: {
    xp: number;
    coins?: number;
    title?: string;
    badge?: string;
  };
  claimed: boolean;
}

/**
 * Variant options for the StreakTracker display
 */
export type StreakTrackerVariant = 'default' | 'compact' | 'widget';

/**
 * Props for the main StreakTracker component
 */
export interface StreakTrackerProps {
  currentStreak: number;
  longestStreak: number;
  weeklyProgress: StreakDay[];
  milestones?: StreakMilestone[];
  hasFreeze?: boolean;
  freezesRemaining?: number;
  onClaimDaily?: () => Promise<void>;
  onClaimMilestone?: (days: number) => Promise<void>;
  onUseFreeze?: () => Promise<void>;
  todayClaimed?: boolean;
  streakMultiplier?: number;
  variant?: StreakTrackerVariant;
  className?: string;
}

/**
 * Props for the FireAnimation component
 */
export interface FireAnimationProps {
  intensity?: 'low' | 'medium' | 'high';
  size?: 'small' | 'medium' | 'large';
}

/**
 * Props for the WeeklyCalendar component
 */
export interface WeeklyCalendarProps {
  weeklyProgress: StreakDay[];
  todayClaimed: boolean;
}

/**
 * Props for the MilestoneProgress component
 */
export interface MilestoneProgressProps {
  currentStreak: number;
  milestones: StreakMilestone[];
}

/**
 * Props for the ClaimableMilestones component
 */
export interface ClaimableMilestonesProps {
  milestones: StreakMilestone[];
  currentStreak: number;
  onClaim: (days: number) => Promise<void>;
  claimingMilestone: number | null;
}

/**
 * Props for the MilestonesList component
 */
export interface MilestonesListProps {
  milestones: StreakMilestone[];
  currentStreak: number;
  isVisible: boolean;
}
