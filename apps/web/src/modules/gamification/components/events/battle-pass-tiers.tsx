/**
 * BattlePassTiers — Enhanced battle pass tier display with progress bar,
 * claim button, and premium track visualization.
 *
 * @module modules/gamification/components/events/battle-pass-tiers
 */

import { durations } from '@cgraph/animation-constants';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  StarIcon,
  LockClosedIcon,
  CheckCircleIcon,
  GiftIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { GlassCard } from '@/shared/components/ui';

export interface TierReward {
  id: string;
  name: string;
  type: string;
  rarity: string;
  icon?: string;
  previewUrl?: string;
}

export interface BattlePassTier {
  tier: number;
  xpRequired: number;
  freeRewards: TierReward[];
  premiumRewards: TierReward[];
}

export interface BattlePassTiersProps {
  tiers: BattlePassTier[];
  currentTier: number;
  currentXP: number;
  xpToNextTier: number;
  hasPremium: boolean;
  claimedFree: number[];
  claimedPremium: number[];
  onClaimReward: (tier: number, rewardType: 'free' | 'premium') => void;
  onPurchaseBattlePass: () => void;
  isPurchasing?: boolean;
}

/**
 * Enhanced BattlePassTiers component with progress bar, claim buttons,
 * and premium track visualization.
 */
export function BattlePassTiers({
  tiers,
  currentTier,
  currentXP,
  xpToNextTier,
  hasPremium,
  claimedFree,
  claimedPremium,
  onClaimReward,
  onPurchaseBattlePass,
  isPurchasing = false,
}: BattlePassTiersProps) {
  const [selectedTier, setSelectedTier] = useState<number | null>(null);

  const progressPercent = xpToNextTier > 0
    ? Math.min(100, ((currentXP % 1000) / 1000) * 100)
    : 100;

  return (
    <div className="space-y-6">
      {/* Overall Progress Bar */}
      <GlassCard variant="frosted" className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white">Battle Pass Progress</h3>
            <p className="text-sm text-gray-400">
              Tier {currentTier} / {tiers.length} &mdash; {currentXP.toLocaleString()} XP
            </p>
          </div>
          {!hasPremium && (
            <button
              onClick={onPurchaseBattlePass}
              disabled={isPurchasing}
              className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-yellow-500 to-orange-500 px-4 py-2 font-medium text-black transition-all hover:from-yellow-400 hover:to-orange-400 disabled:opacity-50"
            >
              <StarIcon className="h-5 w-5" />
              {isPurchasing ? 'Purchasing...' : 'Upgrade to Premium'}
            </button>
          )}
          {hasPremium && (
            <div className="flex items-center gap-1.5 rounded-lg bg-yellow-500/20 px-3 py-1.5 text-sm font-medium text-yellow-400">
              <StarIcon className="h-4 w-4" />
              Premium Active
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="relative h-3 overflow-hidden rounded-full bg-dark-700">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: durations.extended.ms / 1000, ease: 'easeOut' }}
            className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500"
          />
          <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white/80">
            {Math.round(progressPercent)}% to next tier
          </div>
        </div>

        {/* XP to next tier */}
        <div className="mt-2 text-right text-xs text-gray-500">
          {xpToNextTier.toLocaleString()} XP to Tier {currentTier + 1}
        </div>
      </GlassCard>

      {/* Tier Cards Grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {tiers.map((tier) => {
          const isUnlocked = currentTier >= tier.tier;
          const isCurrent = currentTier === tier.tier;
          const freeIsClaimed = claimedFree.includes(tier.tier);
          const premiumIsClaimed = claimedPremium.includes(tier.tier);
          const canClaimFree = isUnlocked && !freeIsClaimed && tier.freeRewards.length > 0;
          const canClaimPremium = isUnlocked && hasPremium && !premiumIsClaimed && tier.premiumRewards.length > 0;

          return (
            <motion.div
              key={tier.tier}
              whileHover={{ scale: 1.03 }}
              onClick={() => setSelectedTier(selectedTier === tier.tier ? null : tier.tier)}
              className={`relative cursor-pointer rounded-xl border p-4 transition-all ${
                isCurrent
                  ? 'border-yellow-500/50 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 ring-1 ring-yellow-500/30'
                  : isUnlocked
                    ? 'border-white/20 bg-white/5'
                    : 'border-white/10 bg-white/5 opacity-50'
              }`}
            >
              {/* Tier Number */}
              <div className="mb-3 text-center">
                <div
                  className={`inline-flex h-10 w-10 items-center justify-center rounded-full font-bold ${
                    isUnlocked ? 'bg-yellow-500/20 text-yellow-400' : 'bg-white/10 text-white/40'
                  }`}
                >
                  {isUnlocked ? <CheckCircleIcon className="h-5 w-5" /> : tier.tier}
                </div>
                <div className="mt-1 text-xs text-white/60">{tier.xpRequired.toLocaleString()} XP</div>
              </div>

              {/* Free Rewards */}
              <div className="mb-2">
                <div className="mb-1 text-center text-xs font-semibold text-white/70">Free</div>
                <div className="flex flex-wrap justify-center gap-1">
                  {tier.freeRewards.map((reward) => (
                    <div
                      key={reward.id}
                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-dark-600 text-sm"
                      title={reward.name}
                    >
                      {reward.icon ? <span>{reward.icon}</span> : <GiftIcon className="h-4 w-4 text-gray-400" />}
                    </div>
                  ))}
                </div>
                {canClaimFree && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onClaimReward(tier.tier, 'free'); }}
                    className="mt-2 w-full rounded-lg bg-green-500/20 py-1 text-xs font-medium text-green-400 transition-colors hover:bg-green-500/30"
                  >
                    Claim Free
                  </button>
                )}
                {freeIsClaimed && (
                  <div className="mt-2 text-center text-xs text-green-500">
                    <CheckCircleIcon className="mx-auto h-4 w-4" />
                  </div>
                )}
              </div>

              {/* Premium Rewards */}
              {tier.premiumRewards.length > 0 && (
                <div>
                  <div className="mb-1 flex items-center justify-center gap-1 text-xs font-semibold text-yellow-400">
                    <StarIcon className="h-3 w-3" />
                    <span>Premium</span>
                  </div>
                  <div className="relative flex flex-wrap justify-center gap-1">
                    {!hasPremium && (
                      <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-black/60 backdrop-blur-sm">
                        <LockClosedIcon className="h-4 w-4 text-white/60" />
                      </div>
                    )}
                    {tier.premiumRewards.map((reward) => (
                      <div
                        key={reward.id}
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-yellow-500/10 text-sm"
                        title={reward.name}
                      >
                        {reward.icon ? <span>{reward.icon}</span> : <SparklesIcon className="h-4 w-4 text-yellow-400" />}
                      </div>
                    ))}
                  </div>
                  {canClaimPremium && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onClaimReward(tier.tier, 'premium'); }}
                      className="mt-2 w-full rounded-lg bg-yellow-500/20 py-1 text-xs font-medium text-yellow-400 transition-colors hover:bg-yellow-500/30"
                    >
                      Claim Premium
                    </button>
                  )}
                  {premiumIsClaimed && (
                    <div className="mt-2 text-center text-xs text-yellow-500">
                      <CheckCircleIcon className="mx-auto h-4 w-4" />
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Detail Overlay */}
      <AnimatePresence>
        {selectedTier !== null && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="rounded-xl border border-white/10 bg-dark-800/90 p-4 backdrop-blur-sm"
          >
            <h4 className="mb-2 font-bold text-white">Tier {selectedTier} Details</h4>
            {tiers.find((t) => t.tier === selectedTier) && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="mb-1 text-xs font-semibold text-gray-400">Free Rewards</p>
                  {tiers
                    .find((t) => t.tier === selectedTier)!
                    .freeRewards.map((r) => (
                      <div key={r.id} className="text-sm text-white">
                        {r.name} <span className="text-gray-500">({r.rarity})</span>
                      </div>
                    ))}
                </div>
                <div>
                  <p className="mb-1 text-xs font-semibold text-yellow-400">Premium Rewards</p>
                  {tiers
                    .find((t) => t.tier === selectedTier)!
                    .premiumRewards.map((r) => (
                      <div key={r.id} className="text-sm text-white">
                        {r.name} <span className="text-gray-500">({r.rarity})</span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
