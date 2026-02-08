/**
 * Referral Dashboard
 *
 * MyBB-style referral system dashboard with:
 * - Referral link/code
 * - Stats overview
 * - Leaderboard
 * - Reward tiers
 * - Recent referrals
 */

import { useEffect, useState, useMemo, useRef } from 'react';
import { GiftIcon } from '@heroicons/react/24/outline';
import { useReferralStore } from '@/modules/gamification/store';
import { createLogger } from '@/lib/logger';
import { ReferralLinkCard } from './ReferralLinkCard';
import { StatsCards } from './StatsCards';
import { ProgressTierCard } from './ProgressTierCard';
import { RecentReferrals } from './RecentReferrals';
import { ReferralLeaderboard } from './ReferralLeaderboard';
import { RewardTiers } from './RewardTiers';
import { HowItWorks } from './HowItWorks';
import type {
  LeaderboardPeriod,
  ReferralLinkCardProps,
  RecentReferralsProps,
  LeaderboardProps,
} from './types';

const logger = createLogger('ReferralDashboard');

export default function ReferralDashboard() {
  const {
    referrals,
    referralCode,
    stats,
    leaderboard,
    rewardTiers,
    isLoading,
    fetchReferralCode,
    fetchReferrals,
    fetchStats,
    fetchLeaderboard,
    fetchRewardTiers,
    regenerateCode,
    claimReward,
    getReferralUrl,
  } = useReferralStore();

  // UI State
  const [copied, setCopied] = useState(false);
  const [copiedType, setCopiedType] = useState<'code' | 'url' | null>(null);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(
    () => () => {
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    },
    []
  );
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [leaderboardPeriod, setLeaderboardPeriod] = useState<LeaderboardPeriod>('all');

  useEffect(() => {
    fetchReferralCode();
    fetchReferrals();
    fetchStats();
    fetchLeaderboard(leaderboardPeriod);
    fetchRewardTiers();
  }, [
    fetchReferralCode,
    fetchReferrals,
    fetchStats,
    fetchLeaderboard,
    fetchRewardTiers,
    leaderboardPeriod,
  ]);

  // Copy to clipboard
  const copyToClipboard = async (text: string, type: 'code' | 'url') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setCopiedType(type);
      copyTimerRef.current = setTimeout(() => {
        setCopied(false);
        setCopiedType(null);
      }, 2000);
    } catch (error) {
      logger.error('Failed to copy:', error);
    }
  };

  // Regenerate code
  const handleRegenerateCode = async () => {
    if (!window.confirm('Are you sure? Your current referral code will no longer work.')) {
      return;
    }
    setIsRegenerating(true);
    try {
      await regenerateCode();
    } finally {
      setIsRegenerating(false);
    }
  };

  // Share referral
  const shareReferral = async () => {
    const url = getReferralUrl();
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join our community!',
          text: 'Check out this awesome community forum!',
          url,
        });
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          logger.error('Share failed:', error);
        }
      }
    } else {
      copyToClipboard(url, 'url');
    }
  };

  const nextTier = useMemo(() => {
    if (!stats || rewardTiers.length === 0) return null;
    const unachieved = rewardTiers.find((tier) => !tier.achieved);
    if (!unachieved) return null;

    const progress = (stats.verifiedReferrals / unachieved.referralsRequired) * 100;
    return { tier: unachieved, progress: Math.min(progress, 100) };
  }, [stats, rewardTiers]);

  // Recent referrals
  const recentReferrals = useMemo(() => referrals.slice(0, 5), [referrals]);

  return (
    <div className="container mx-auto max-w-7xl px-4 py-6">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <GiftIcon className="text-primary h-8 w-8" />
          <div>
            <h1 className="text-foreground text-2xl font-bold">Referral Program</h1>
            <p className="text-muted-foreground text-sm">Invite friends and earn rewards</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-6 lg:col-span-2">
          <ReferralLinkCard
            referralCode={referralCode as ReferralLinkCardProps['referralCode']}
            isLoading={isLoading}
            copied={copied}
            copiedType={copiedType}
            isRegenerating={isRegenerating}
            onCopyUrl={() => referralCode && copyToClipboard(referralCode.url, 'url')}
            onCopyCode={() => referralCode && copyToClipboard(referralCode.code, 'code')}
            onShare={shareReferral}
            onRegenerate={handleRegenerateCode}
          />

          <StatsCards stats={stats} />

          <ProgressTierCard nextTier={nextTier} verifiedReferrals={stats?.verifiedReferrals || 0} />

          <RecentReferrals referrals={recentReferrals as RecentReferralsProps['referrals']} />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <ReferralLeaderboard
            leaderboard={leaderboard as LeaderboardProps['leaderboard']}
            period={leaderboardPeriod}
            onPeriodChange={setLeaderboardPeriod}
          />

          <RewardTiers tiers={rewardTiers} onClaimReward={claimReward} />

          <HowItWorks />
        </div>
      </div>
    </div>
  );
}

export { ReferralDashboard };
