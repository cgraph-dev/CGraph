/**
 * DailyRewards Component
 *
 * Daily login reward calendar with:
 * - 7-day reward cycle
 * - Progressive rewards
 * - Premium bonus rewards
 * - Claim animation
 * - Countdown to next reward
 * - Monthly special bonuses
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronRightIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { GiftIcon as GiftIconSolid, StarIcon } from '@heroicons/react/24/solid';
import { GlassCard } from '@/shared/components/ui';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import { useThemeStore, THEME_COLORS } from '@/stores/theme';
import confetti from 'canvas-confetti';
import type { DailyRewardsProps, DailyReward } from './types';
import { DEFAULT_REWARDS, CONFETTI_COLORS, ANIMATION_DURATIONS } from './constants';
import { useTimeUntilClaim, useTodayReward } from './hooks';
import { RewardCard } from './reward-card';
import { CompactView } from './compact-view';
import { RewardDetails } from './reward-details';
import { ClaimSuccessModal } from './claim-success-modal';

/**
 * Daily rewards calendar component
 */
export function DailyRewards({
  rewards = DEFAULT_REWARDS,
  currentDay,
  canClaim,
  nextClaimTime,
  isPremium = false,
  onClaim,
  onClaimWithAd,
  monthlyProgress = 0,
  monthlyReward,
  variant = 'default',
  className = '',
}: DailyRewardsProps) {
  const { theme } = useThemeStore();
  const primaryColor = THEME_COLORS[theme.colorPreset]?.primary || '#10B981';

  const [isClaiming, setIsClaiming] = useState(false);
  const [claimedReward, setClaimedReward] = useState<DailyReward | null>(null);
  const claimedTimerRef = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(
    () => () => {
      if (claimedTimerRef.current) clearTimeout(claimedTimerRef.current);
    },
    []
  );

  const timeUntilClaim = useTimeUntilClaim(nextClaimTime);
  const todayReward = useTodayReward(rewards, currentDay);

  const handleClaim = useCallback(async () => {
    if (!canClaim || isClaiming || !onClaim) return;

    setIsClaiming(true);
    HapticFeedback.success();

    try {
      await onClaim();
      setClaimedReward(todayReward);

      // Celebration
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: [...CONFETTI_COLORS, primaryColor],
      });

      claimedTimerRef.current = setTimeout(
        () => setClaimedReward(null),
        ANIMATION_DURATIONS.claimedOverlay
      );
    } finally {
      setIsClaiming(false);
    }
  }, [canClaim, isClaiming, onClaim, todayReward, primaryColor]);

  // Compact variant
  if (variant === 'compact') {
    return (
      <CompactView
        canClaim={canClaim}
        todayReward={todayReward}
        timeUntilClaim={timeUntilClaim}
        isClaiming={isClaiming}
        primaryColor={primaryColor}
        onClaim={handleClaim}
        className={className}
      />
    );
  }

  return (
    <div className={className}>
      <GlassCard variant="frosted" className="overflow-hidden">
        {/* Header */}
        <div className="border-b border-dark-700 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.div
                animate={canClaim ? { rotate: [0, -10, 10, -10, 0] } : {}}
                transition={{
                  duration: 0.5,
                  repeat: Infinity,
                  repeatDelay: ANIMATION_DURATIONS.shakeRepeat,
                }}
                className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-500"
              >
                <GiftIconSolid className="h-6 w-6 text-white" />
              </motion.div>
              <div>
                <h2 className="text-lg font-semibold">Daily Rewards</h2>
                <p className="text-sm text-gray-400">Day {currentDay} of 7</p>
              </div>
            </div>

            {!canClaim && nextClaimTime && (
              <div className="text-right">
                <div className="text-sm text-gray-400">Next reward in</div>
                <div className="font-mono font-medium">{timeUntilClaim}</div>
              </div>
            )}
          </div>
        </div>

        {/* Rewards Grid */}
        <div className="p-4">
          <div className="grid grid-cols-7 gap-2">
            {rewards.map((reward, index) => (
              <RewardCard
                key={reward.day}
                reward={reward}
                index={index}
                currentDay={currentDay}
                canClaim={canClaim}
                isPremium={isPremium}
                primaryColor={primaryColor}
              />
            ))}
          </div>
        </div>

        {/* Today's Reward Details */}
        <RewardDetails
          todayReward={todayReward}
          canClaim={canClaim}
          isClaiming={isClaiming}
          primaryColor={primaryColor}
          onClaim={handleClaim}
        />

        {/* Premium Bonus */}
        {!isPremium && (
          <div className="px-4 pb-4">
            <div className="flex items-center justify-between rounded-lg border border-amber-500/30 bg-gradient-to-r from-amber-500/10 to-orange-500/10 p-3">
              <div className="flex items-center gap-3">
                <StarIcon className="h-6 w-6 text-amber-500" />
                <div>
                  <span className="font-medium">Premium Bonus</span>
                  <p className="text-xs text-gray-400">Get 2x daily rewards with Premium</p>
                </div>
              </div>
              <ChevronRightIcon className="h-5 w-5 text-gray-400" />
            </div>
          </div>
        )}

        {/* Monthly Progress */}
        {monthlyReward && (
          <div className="px-4 pb-4">
            <div className="rounded-lg bg-dark-700/50 p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm text-gray-400">Monthly Reward Progress</span>
                <span className="text-sm font-medium">
                  {monthlyProgress}/{monthlyReward.daysRequired} days
                </span>
              </div>
              <div className="mb-3 h-2 overflow-hidden rounded-full bg-dark-600">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${(monthlyProgress / monthlyReward.daysRequired) * 100}%` }}
                />
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-xl">{monthlyReward.icon}</span>
                <span className="text-gray-300">{monthlyReward.name}</span>
              </div>
            </div>
          </div>
        )}

        {/* Watch Ad for Double */}
        {onClaimWithAd && canClaim && !isPremium && (
          <div className="px-4 pb-4">
            <button
              onClick={onClaimWithAd}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-dark-600 p-3 text-gray-400 transition-colors hover:border-gray-500 hover:text-white"
            >
              <ArrowPathIcon className="h-5 w-5" />
              Watch ad for 2x reward
            </button>
          </div>
        )}
      </GlassCard>

      {/* Claim Success Animation */}
      <ClaimSuccessModal claimedReward={claimedReward} />
    </div>
  );
}

export default DailyRewards;
