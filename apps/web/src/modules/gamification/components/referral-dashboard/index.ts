/**
 * Referral Dashboard Module
 *
 * Barrel exports for the modular referral dashboard.
 */

// Main component
export { default, ReferralDashboard } from './ReferralDashboard';

// Sub-components
export { ReferralLinkCard } from './ReferralLinkCard';
export { StatsCards } from './StatsCards';
export { ProgressTierCard } from './ProgressTierCard';
export { RecentReferrals } from './RecentReferrals';
export { ReferralLeaderboard } from './ReferralLeaderboard';
export { RewardTiers } from './RewardTiers';
export { HowItWorks } from './HowItWorks';

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
