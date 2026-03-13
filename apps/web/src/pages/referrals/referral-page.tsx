/**
 * Referral program page component.
 *
 * Dashboard showing the user's referral code, stats, referral history,
 * and available reward tiers. Connected to backend ReferralController.
 *
 * @module pages/referrals/referral-page
 */

import { useState, useEffect, useCallback } from 'react';
import {
  referralsApi,
  type ReferralCode,
  type ReferralStats,
  type ReferralEntry,
  type RewardTier,
} from './referrals-api';

/**
 * Referral Page — route-level page component.
 */
export default function ReferralPage(): React.ReactElement {
  const [code, setCode] = useState<ReferralCode | null>(null);
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [referrals, setReferrals] = useState<ReferralEntry[]>([]);
  const [rewards, setRewards] = useState<RewardTier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [codeResult, statsResult, referralsResult, rewardsResult] = await Promise.all([
        referralsApi.getCode(),
        referralsApi.getStats(),
        referralsApi.listReferrals({ per_page: 10 }),
        referralsApi.getRewardTiers(),
      ]);
      setCode(codeResult);
      setStats(statsResult);
      setReferrals(referralsResult.referrals);
      setRewards(rewardsResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load referral data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCopyCode = useCallback(async () => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = code.code;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [code]);

  const handleRegenerateCode = useCallback(async () => {
    try {
      const newCode = await referralsApi.regenerateCode();
      setCode(newCode);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to regenerate code');
    }
  }, []);

  const handleClaimReward = useCallback(async (tierId: string) => {
    try {
      await referralsApi.claimReward(tierId);
      // Refresh rewards after claiming
      const updatedRewards = await referralsApi.getRewardTiers();
      setRewards(updatedRewards);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to claim reward');
    }
  }, []);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black/95">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
          <p className="mt-4 text-gray-400">Loading referrals...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black/95 p-6 text-white">
      <div className="mx-auto max-w-4xl space-y-8">
        {/* Header */}
        <div>
          <h1 className="bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-3xl font-bold text-transparent">
            Referral Program
          </h1>
          <p className="mt-1 text-gray-400">Invite friends and earn rewards together</p>
          {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
        </div>

        {/* Referral Code Card */}
        {code && (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <h2 className="mb-4 text-lg font-semibold">Your Referral Code</h2>
            <div className="flex items-center gap-4">
              <code className="flex-1 rounded-lg bg-black/50 px-6 py-3 text-center font-mono text-2xl tracking-widest text-purple-400">
                {code.code}
              </code>
              <button
                type="button"
                onClick={handleCopyCode}
                className="rounded-lg bg-purple-600 px-4 py-3 text-sm font-medium transition-colors hover:bg-purple-500"
              >
                {copied ? '✓ Copied!' : 'Copy'}
              </button>
              <button
                type="button"
                onClick={handleRegenerateCode}
                className="rounded-lg border border-white/10 px-4 py-3 text-sm font-medium text-gray-400 transition-colors hover:border-white/20 hover:text-white"
              >
                Regenerate
              </button>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatCard label="Total Referrals" value={stats.totalReferrals} />
            <StatCard label="Confirmed" value={stats.confirmedReferrals} />
            <StatCard label="Pending" value={stats.pendingReferrals} />
            <StatCard label="Rewards Earned" value={stats.rewardsEarned} />
          </div>
        )}

        {/* Reward Tiers */}
        {rewards.length > 0 && (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <h2 className="mb-4 text-lg font-semibold">Reward Tiers</h2>
            <div className="space-y-3">
              {rewards.map((tier) => (
                <div
                  key={tier.id}
                  className="flex items-center justify-between rounded-xl border border-white/5 bg-white/5 px-4 py-3"
                >
                  <div>
                    <p className="font-medium">{tier.name}</p>
                    <p className="text-sm text-gray-400">
                      {tier.requiredReferrals} referrals — {tier.reward}
                    </p>
                  </div>
                  {tier.claimed ? (
                    <span className="rounded-full bg-green-500/20 px-3 py-1 text-xs font-medium text-green-400">
                      Claimed
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleClaimReward(tier.id)}
                      disabled={!stats || stats.confirmedReferrals < tier.requiredReferrals}
                      className="rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-medium transition-colors hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Claim
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Referral History */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="mb-4 text-lg font-semibold">Recent Referrals</h2>
          {referrals.length > 0 ? (
            <div className="space-y-2">
              {referrals.map((ref) => (
                <div
                  key={ref.id}
                  className="flex items-center justify-between rounded-xl border border-white/5 bg-white/5 px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-500/20 text-sm">
                      {ref.referredUser?.username?.[0]?.toUpperCase() ?? '?'}
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {ref.referredUser?.displayName ?? ref.referredUser?.username ?? 'Anonymous'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(ref.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={ref.status} />
                </div>
              ))}
            </div>
          ) : (
            <p className="py-8 text-center text-gray-500">
              No referrals yet. Share your code to get started!
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StatCard({ label, value }: { label: string; value: number }): React.ReactElement {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-center">
      <p className="text-2xl font-bold text-purple-400">{value}</p>
      <p className="mt-1 text-xs text-gray-400">{label}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }): React.ReactElement {
  const styles: Record<string, string> = {
    confirmed: 'bg-green-500/20 text-green-400',
    pending: 'bg-yellow-500/20 text-yellow-400',
    expired: 'bg-red-500/20 text-red-400',
  };

  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-medium ${styles[status] ?? 'bg-gray-500/20 text-gray-400'}`}
    >
      {status}
    </span>
  );
}
