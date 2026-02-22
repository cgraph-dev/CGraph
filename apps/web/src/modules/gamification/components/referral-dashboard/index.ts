/**
 * Referral Dashboard Module
 *
 * Barrel exports for the modular referral dashboard.
 */

// Main component
export { default, ReferralDashboard } from './referral-dashboard';

// Sub-components
export { ReferralLinkCard } from './referral-link-card';
export { StatsCards } from './stats-cards';
export { ProgressTierCard } from './progress-tier-card';
export { RecentReferrals } from './recent-referrals';
export { ReferralLeaderboard } from './referral-leaderboard';
export { RewardTiers } from './reward-tiers';
export { HowItWorks } from './how-it-works';

// Types
export type {
  LeaderboardPeriod,
  ReferralLinkCardProps,
  StatsCardsProps,
  ProgressTierProps,
  RecentReferralsProps,
  LeaderboardProps,
  RewardTiersProps,
} from './types';
