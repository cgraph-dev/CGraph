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
import { useReferralStore } from '@/stores/referralStore';

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

  // Fetch data on mount
  useEffect(() => {
    fetchReferralCode();
    fetchReferrals();
    fetchStats();
    fetchLeaderboard(leaderboardPeriod);
    fetchRewardTiers();
  }, [fetchReferralCode, fetchReferrals, fetchStats, fetchLeaderboard, fetchRewardTiers, leaderboardPeriod]);

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
      console.error('[ReferralDashboard] Failed to copy:', error);
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
          console.error('[ReferralDashboard] Share failed:', error);
        }
      }
    } else {
      copyToClipboard(url, 'url');
    }
  };

  // Calculate progress to next tier
  const nextTier = useMemo(() => {
    if (!stats || rewardTiers.length === 0) return null;
    const unachieved = rewardTiers.find((t) => !t.achieved);
    if (!unachieved) return null;
    const progress = (stats.verifiedReferrals / unachieved.referralsRequired) * 100;
    return { tier: unachieved, progress: Math.min(progress, 100) };
  }, [stats, rewardTiers]);

  // Recent referrals
  const recentReferrals = useMemo(
    () => referrals.slice(0, 5),
    [referrals]
  );

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div className="flex items-center gap-3">
          <GiftIcon className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">Referral Program</h1>
            <p className="text-sm text-muted-foreground">
              Invite friends and earn rewards
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Referral Link Card */}
          <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <LinkIcon className="h-5 w-5 text-primary" />
              Your Referral Link
            </h2>

            {isLoading || !referralCode ? (
              <div className="h-12 bg-background/50 rounded-lg animate-pulse" />
            ) : (
              <>
                {/* URL Display */}
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex-1 bg-background border border-border rounded-lg px-4 py-3 font-mono text-sm truncate">
                    {referralCode.url}
                  </div>
                  <button
                    onClick={() => copyToClipboard(referralCode.url, 'url')}
                    className="p-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
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
                    className="p-3 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors"
                    title="Share"
                  >
                    <ShareIcon className="h-5 w-5" />
                  </button>
                </div>

                {/* Code Display */}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Your code:</span>
                    <code className="px-2 py-1 bg-background rounded font-mono font-semibold">
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
                    className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ArrowPathIcon className={`h-4 w-4 ${isRegenerating ? 'animate-spin' : ''}`} />
                    Regenerate
                  </button>
                </div>

                {/* Usage stats */}
                <div className="mt-4 pt-4 border-t border-border/50 flex items-center gap-4 text-sm text-muted-foreground">
                  <span>
                    Used <strong className="text-foreground">{referralCode.usageCount}</strong> times
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
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-card border border-border rounded-lg p-4">
              <UsersIcon className="h-6 w-6 text-primary mb-2" />
              <div className="text-2xl font-bold text-foreground">
                {stats?.totalReferrals || 0}
              </div>
              <div className="text-sm text-muted-foreground">Total Referrals</div>
            </div>

            <div className="bg-card border border-border rounded-lg p-4">
              <CheckIcon className="h-6 w-6 text-green-500 mb-2" />
              <div className="text-2xl font-bold text-foreground">
                {stats?.verifiedReferrals || 0}
              </div>
              <div className="text-sm text-muted-foreground">Verified</div>
            </div>

            <div className="bg-card border border-border rounded-lg p-4">
              <SparklesIcon className="h-6 w-6 text-yellow-500 mb-2" />
              <div className="text-2xl font-bold text-foreground">
                {stats?.totalRewardsEarned.xp.toLocaleString() || 0}
              </div>
              <div className="text-sm text-muted-foreground">XP Earned</div>
            </div>

            <div className="bg-card border border-border rounded-lg p-4">
              <TrophyIcon className="h-6 w-6 text-amber-500 mb-2" />
              <div className="text-2xl font-bold text-foreground flex items-center gap-1">
                #{stats?.rank || '-'}
                {stats?.rankChange !== 0 && (
                  <span className={`text-sm ${stats?.rankChange && stats.rankChange > 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {stats?.rankChange && stats.rankChange > 0 ? (
                      <ArrowTrendingUpIcon className="h-4 w-4" />
                    ) : (
                      <ArrowTrendingDownIcon className="h-4 w-4" />
                    )}
                  </span>
                )}
              </div>
              <div className="text-sm text-muted-foreground">Your Rank</div>
            </div>
          </div>

          {/* Progress to Next Tier */}
          {nextTier && (
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-foreground">
                  Progress to {nextTier.tier.name}
                </h3>
                <span className="text-sm text-muted-foreground">
                  {stats?.verifiedReferrals || 0} / {nextTier.tier.referralsRequired} referrals
                </span>
              </div>
              <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full transition-all duration-500"
                  style={{ width: `${nextTier.progress}%` }}
                />
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {nextTier.tier.rewards.map((reward, i) => (
                  <span key={i} className="text-xs px-2 py-1 bg-muted rounded-full text-muted-foreground">
                    {reward.description}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Recent Referrals */}
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h3 className="font-semibold text-foreground">Recent Referrals</h3>
              <Link
                to="/referrals/history"
                className="text-sm text-primary hover:underline flex items-center gap-1"
              >
                View All <ChevronRightIcon className="h-4 w-4" />
              </Link>
            </div>

            {recentReferrals.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <UsersIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No referrals yet</p>
                <p className="text-sm">Share your link to start earning rewards!</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {recentReferrals.map((referral) => (
                  <div key={referral.id} className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {referral.referredAvatarUrl ? (
                        <img
                          src={referral.referredAvatarUrl}
                          alt={referral.referredUsername}
                          className="w-10 h-10 rounded-full"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <UsersIcon className="h-5 w-5 text-primary" />
                        </div>
                      )}
                      <div>
                        <div className="font-medium text-foreground">
                          {referral.referredUsername}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(referral.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
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
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="p-4 border-b border-border">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <TrophyIcon className="h-5 w-5 text-amber-500" />
                  Leaderboard
                </h3>
                <select
                  value={leaderboardPeriod}
                  onChange={(e) => setLeaderboardPeriod(e.target.value as typeof leaderboardPeriod)}
                  className="text-xs bg-muted border-0 rounded px-2 py-1"
                >
                  <option value="all">All Time</option>
                  <option value="month">This Month</option>
                  <option value="week">This Week</option>
                </select>
              </div>
            </div>

            {leaderboard.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">
                No data yet
              </div>
            ) : (
              <div className="divide-y divide-border">
                {leaderboard.slice(0, 10).map((leader, index) => (
                  <div
                    key={leader.userId}
                    className="p-3 flex items-center gap-3"
                  >
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
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
                      <img
                        src={leader.avatarUrl}
                        alt={leader.username}
                        className="w-8 h-8 rounded-full"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <UsersIcon className="h-4 w-4 text-primary" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <Link
                        to={`/profile/${leader.username}`}
                        className="font-medium text-foreground hover:text-primary truncate block"
                      >
                        {leader.displayName || leader.username}
                      </Link>
                    </div>
                    <div className="text-sm font-medium text-foreground">
                      {leader.referralCount}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Reward Tiers */}
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="p-4 border-b border-border">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <GiftIcon className="h-5 w-5 text-primary" />
                Reward Tiers
              </h3>
            </div>

            <div className="divide-y divide-border">
              {rewardTiers.map((tier) => (
                <div
                  key={tier.id}
                  className={`p-4 ${tier.achieved ? 'bg-green-500/5' : ''}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-foreground">{tier.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {tier.referralsRequired} referrals
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {tier.rewards.map((reward) => (
                      <div key={reward.id} className="flex items-center gap-1">
                        <span
                          className={`text-xs px-2 py-0.5 rounded ${
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
                            className="text-xs text-primary hover:underline"
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
          <div className="bg-card border border-border rounded-lg p-4">
            <h3 className="font-semibold text-foreground mb-3">How it Works</h3>
            <ol className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs flex-shrink-0">
                  1
                </span>
                Share your referral link with friends
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs flex-shrink-0">
                  2
                </span>
                They sign up using your link
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs flex-shrink-0">
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
