import { useEffect, useState, useMemo } from 'react';
import {
  LinkIcon,
  ClipboardDocumentIcon,
  CheckIcon,
  ShareIcon,
  GiftIcon,
  TrophyIcon,
  UsersIcon,
  ArrowPathIcon,
  SparklesIcon,
  ChevronRightIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
} from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';
import { useReferralStore } from '@/stores/gamification';
import { ThemedAvatar } from '@/components/theme/ThemedAvatar';
import { createLogger } from '@/lib/logger';

const logger = createLogger('ReferralDashboard');

/**
 * Referral Dashboard Component
 *
 * MyBB-style referral system dashboard with:
 * - Referral link/code
 * - Stats overview
 * - Leaderboard
 * - Reward tiers
 * - Recent referrals
 */

export default function ReferralDashboard() {
  const {
    referrals,
    referralCode,
    stats,
    leaderboard,
    rewardTiers,
    isLoading,
    // isLoadingStats,
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
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [leaderboardPeriod, setLeaderboardPeriod] = useState<'all' | 'month' | 'week'>('all');

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
      setTimeout(() => {
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
          {/* Referral Link Card */}
          <div className="from-primary/10 to-primary/5 border-primary/20 rounded-xl border bg-gradient-to-br p-6">
            <h2 className="text-foreground mb-4 flex items-center gap-2 text-lg font-semibold">
              <LinkIcon className="text-primary h-5 w-5" />
              Your Referral Link
            </h2>

            {isLoading || !referralCode ? (
              <div className="bg-background/50 h-12 animate-pulse rounded-lg" />
            ) : (
              <>
                {/* URL Display */}
                <div className="mb-4 flex items-center gap-2">
                  <div className="bg-background border-border flex-1 truncate rounded-lg border px-4 py-3 font-mono text-sm">
                    {referralCode.url}
                  </div>
                  <button
                    onClick={() => copyToClipboard(referralCode.url, 'url')}
                    className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg p-3 transition-colors"
                    title="Copy link"
                  >
                    {copied && copiedType === 'url' ? (
                      <CheckIcon className="h-5 w-5" />
                    ) : (
                      <ClipboardDocumentIcon className="h-5 w-5" />
                    )}
                  </button>
                  <button
                    onClick={shareReferral}
                    className="bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-lg p-3 transition-colors"
                    title="Share"
                  >
                    <ShareIcon className="h-5 w-5" />
                  </button>
                </div>

                {/* Code Display */}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Your code:</span>
                    <code className="bg-background rounded px-2 py-1 font-mono font-semibold">
                      {referralCode.code}
                    </code>
                    <button
                      onClick={() => copyToClipboard(referralCode.code, 'code')}
                      className="text-primary hover:text-primary/80"
                    >
                      {copied && copiedType === 'code' ? (
                        <CheckIcon className="h-4 w-4" />
                      ) : (
                        <ClipboardDocumentIcon className="h-4 w-4" />
                      )}
                    </button>
                  </div>

                  <button
                    onClick={handleRegenerateCode}
                    disabled={isRegenerating}
                    className="text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                  >
                    <ArrowPathIcon className={`h-4 w-4 ${isRegenerating ? 'animate-spin' : ''}`} />
                    Regenerate
                  </button>
                </div>

                {/* Usage stats */}
                <div className="border-border/50 text-muted-foreground mt-4 flex items-center gap-4 border-t pt-4 text-sm">
                  <span>
                    Used <strong className="text-foreground">{referralCode.usageCount}</strong>{' '}
                    times
                  </span>
                  {referralCode.maxUsage && (
                    <span>
                      Max: <strong className="text-foreground">{referralCode.maxUsage}</strong>
                    </span>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="bg-card border-border rounded-lg border p-4">
              <UsersIcon className="text-primary mb-2 h-6 w-6" />
              <div className="text-foreground text-2xl font-bold">{stats?.totalReferrals || 0}</div>
              <div className="text-muted-foreground text-sm">Total Referrals</div>
            </div>

            <div className="bg-card border-border rounded-lg border p-4">
              <CheckIcon className="mb-2 h-6 w-6 text-green-500" />
              <div className="text-foreground text-2xl font-bold">
                {stats?.verifiedReferrals || 0}
              </div>
              <div className="text-muted-foreground text-sm">Verified</div>
            </div>

            <div className="bg-card border-border rounded-lg border p-4">
              <SparklesIcon className="mb-2 h-6 w-6 text-yellow-500" />
              <div className="text-foreground text-2xl font-bold">
                {stats?.totalRewardsEarned.xp.toLocaleString() || 0}
              </div>
              <div className="text-muted-foreground text-sm">XP Earned</div>
            </div>

            <div className="bg-card border-border rounded-lg border p-4">
              <TrophyIcon className="mb-2 h-6 w-6 text-amber-500" />
              <div className="text-foreground flex items-center gap-1 text-2xl font-bold">
                #{stats?.rank || '-'}
                {stats?.rankChange !== 0 && (
                  <span
                    className={`text-sm ${stats?.rankChange && stats.rankChange > 0 ? 'text-green-500' : 'text-red-500'}`}
                  >
                    {stats?.rankChange && stats.rankChange > 0 ? (
                      <ArrowTrendingUpIcon className="h-4 w-4" />
                    ) : (
                      <ArrowTrendingDownIcon className="h-4 w-4" />
                    )}
                  </span>
                )}
              </div>
              <div className="text-muted-foreground text-sm">Your Rank</div>
            </div>
          </div>

          {/* Progress to Next Tier */}
          {nextTier && (
            <div className="bg-card border-border rounded-lg border p-4">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-foreground font-medium">Progress to {nextTier.tier.name}</h3>
                <span className="text-muted-foreground text-sm">
                  {stats?.verifiedReferrals || 0} / {nextTier.tier.referralsRequired} referrals
                </span>
              </div>
              <div className="bg-muted h-3 w-full overflow-hidden rounded-full">
                <div
                  className="from-primary to-primary/70 h-full rounded-full bg-gradient-to-r transition-all duration-500"
                  style={{ width: `${nextTier.progress}%` }}
                />
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {nextTier.tier.rewards.map((reward, i) => (
                  <span
                    key={i}
                    className="bg-muted text-muted-foreground rounded-full px-2 py-1 text-xs"
                  >
                    {reward.description}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Recent Referrals */}
          <div className="bg-card border-border overflow-hidden rounded-lg border">
            <div className="border-border flex items-center justify-between border-b p-4">
              <h3 className="text-foreground font-semibold">Recent Referrals</h3>
              <Link
                to="/referrals/history"
                className="text-primary flex items-center gap-1 text-sm hover:underline"
              >
                View All <ChevronRightIcon className="h-4 w-4" />
              </Link>
            </div>

            {recentReferrals.length === 0 ? (
              <div className="text-muted-foreground p-8 text-center">
                <UsersIcon className="mx-auto mb-3 h-12 w-12 opacity-50" />
                <p>No referrals yet</p>
                <p className="text-sm">Share your link to start earning rewards!</p>
              </div>
            ) : (
              <div className="divide-border divide-y">
                {recentReferrals.map((referral) => (
                  <div key={referral.id} className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      {referral.referredAvatarUrl ? (
                        <ThemedAvatar
                          src={referral.referredAvatarUrl}
                          alt={referral.referredUsername}
                          size="small"
                          className="h-10 w-10"
                        />
                      ) : (
                        <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-full">
                          <UsersIcon className="text-primary h-5 w-5" />
                        </div>
                      )}
                      <div>
                        <div className="text-foreground font-medium">
                          {referral.referredUsername}
                        </div>
                        <div className="text-muted-foreground text-xs">
                          {new Date(referral.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <span
                      className={`rounded-full px-2 py-1 text-xs ${
                        referral.status === 'rewarded'
                          ? 'bg-green-500/10 text-green-500'
                          : referral.status === 'verified'
                            ? 'bg-blue-500/10 text-blue-500'
                            : referral.status === 'pending'
                              ? 'bg-yellow-500/10 text-yellow-500'
                              : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {referral.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Leaderboard */}
          <div className="bg-card border-border overflow-hidden rounded-lg border">
            <div className="border-border border-b p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-foreground flex items-center gap-2 font-semibold">
                  <TrophyIcon className="h-5 w-5 text-amber-500" />
                  Leaderboard
                </h3>
                <select
                  value={leaderboardPeriod}
                  onChange={(e) => setLeaderboardPeriod(e.target.value as typeof leaderboardPeriod)}
                  className="bg-muted rounded border-0 px-2 py-1 text-xs"
                >
                  <option value="all">All Time</option>
                  <option value="month">This Month</option>
                  <option value="week">This Week</option>
                </select>
              </div>
            </div>

            {leaderboard.length === 0 ? (
              <div className="text-muted-foreground p-8 text-center text-sm">No data yet</div>
            ) : (
              <div className="divide-border divide-y">
                {leaderboard.slice(0, 10).map((leader, index) => (
                  <div key={leader.userId} className="flex items-center gap-3 p-3">
                    <div
                      className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                        index === 0
                          ? 'bg-amber-500 text-white'
                          : index === 1
                            ? 'bg-gray-400 text-white'
                            : index === 2
                              ? 'bg-amber-700 text-white'
                              : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {leader.rank}
                    </div>
                    {leader.avatarUrl ? (
                      <ThemedAvatar
                        src={leader.avatarUrl}
                        alt={leader.username}
                        size="xs"
                        className="h-8 w-8"
                      />
                    ) : (
                      <div className="bg-primary/10 flex h-8 w-8 items-center justify-center rounded-full">
                        <UsersIcon className="text-primary h-4 w-4" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <Link
                        to={`/profile/${leader.username}`}
                        className="text-foreground hover:text-primary block truncate font-medium"
                      >
                        {leader.displayName || leader.username}
                      </Link>
                    </div>
                    <div className="text-foreground text-sm font-medium">
                      {leader.referralCount}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Reward Tiers */}
          <div className="bg-card border-border overflow-hidden rounded-lg border">
            <div className="border-border border-b p-4">
              <h3 className="text-foreground flex items-center gap-2 font-semibold">
                <GiftIcon className="text-primary h-5 w-5" />
                Reward Tiers
              </h3>
            </div>

            <div className="divide-border divide-y">
              {rewardTiers.map((tier) => (
                <div key={tier.id} className={`p-4 ${tier.achieved ? 'bg-green-500/5' : ''}`}>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-foreground font-medium">{tier.name}</span>
                    <span className="text-muted-foreground text-xs">
                      {tier.referralsRequired} referrals
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {tier.rewards.map((reward) => (
                      <div key={reward.id} className="flex items-center gap-1">
                        <span
                          className={`rounded px-2 py-0.5 text-xs ${
                            reward.claimed
                              ? 'bg-green-500/10 text-green-500'
                              : tier.achieved
                                ? 'bg-primary/10 text-primary'
                                : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {reward.description}
                        </span>
                        {tier.achieved && !reward.claimed && (
                          <button
                            onClick={() => claimReward(reward.id)}
                            className="text-primary text-xs hover:underline"
                          >
                            Claim
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* How it Works */}
          <div className="bg-card border-border rounded-lg border p-4">
            <h3 className="text-foreground mb-3 font-semibold">How it Works</h3>
            <ol className="text-muted-foreground space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <span className="bg-primary text-primary-foreground flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-xs">
                  1
                </span>
                Share your referral link with friends
              </li>
              <li className="flex items-start gap-2">
                <span className="bg-primary text-primary-foreground flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-xs">
                  2
                </span>
                They sign up using your link
              </li>
              <li className="flex items-start gap-2">
                <span className="bg-primary text-primary-foreground flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-xs">
                  3
                </span>
                Once verified, you both get rewards!
              </li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
