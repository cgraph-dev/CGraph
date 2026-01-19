import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GiftIcon,
  ClockIcon,
  SparklesIcon,
  LockClosedIcon,
  CheckCircleIcon,
  ChevronRightIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { GiftIcon as GiftIconSolid, StarIcon } from '@heroicons/react/24/solid';
import GlassCard from '@/components/ui/GlassCard';
import { HapticFeedback } from '@/lib/animations/AnimationEngine';
import { useThemeStore, THEME_COLORS } from '@/stores/themeStore';
import confetti from 'canvas-confetti';

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

interface DailyReward {
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

interface DailyRewardsProps {
  rewards: DailyReward[];
  currentDay: number;
  canClaim: boolean;
  nextClaimTime?: Date;
  isPremium?: boolean;
  onClaim?: () => Promise<void>;
  onClaimWithAd?: () => Promise<void>;
  monthlyProgress?: number;
  monthlyReward?: {
    name: string;
    icon: string;
    daysRequired: number;
  };
  variant?: 'default' | 'compact' | 'modal';
  className?: string;
}

const DEFAULT_REWARDS: DailyReward[] = [
  { day: 1, xp: 50, coins: 10 },
  { day: 2, xp: 75, coins: 15 },
  { day: 3, xp: 100, coins: 25 },
  { day: 4, xp: 150, coins: 35, isPremium: true },
  { day: 5, xp: 200, coins: 50 },
  { day: 6, xp: 250, coins: 75 },
  { day: 7, xp: 500, coins: 150, special: { type: 'badge', name: 'Weekly Warrior', icon: '🏆' } },
];

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
  const [showConfetti, setShowConfetti] = useState(false);
  const [claimedReward, setClaimedReward] = useState<DailyReward | null>(null);

  // Calculate time until next claim
  const [timeUntilClaim, setTimeUntilClaim] = useState('');

  React.useEffect(() => {
    if (!nextClaimTime) return;

    const updateTime = () => {
      const now = new Date();
      const diff = nextClaimTime.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeUntilClaim('Ready to claim!');
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeUntilClaim(`${hours}h ${minutes}m ${seconds}s`);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [nextClaimTime]);

  // Get today's reward
  const todayReward = useMemo((): DailyReward => {
    const effectiveRewards = rewards.length > 0 ? rewards : DEFAULT_REWARDS;
    const found = effectiveRewards.find((r) => r.day === currentDay);
    // Fallback ensures we always have a valid reward
    return found ?? effectiveRewards[0] ?? { day: 1, xp: 50, coins: 10 };
  }, [rewards, currentDay]);

  const handleClaim = async () => {
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
        colors: ['#FFD700', primaryColor, '#FF6B6B'],
      });

      setTimeout(() => setClaimedReward(null), 3000);
    } finally {
      setIsClaiming(false);
    }
  };

  const renderRewardCard = (reward: DailyReward, index: number) => {
    const isToday = reward.day === currentDay;
    const isClaimed = reward.claimed || reward.day < currentDay;
    const isLocked = reward.day > currentDay;
    const isPremiumLocked = reward.isPremium && !isPremium;

    return (
      <motion.div
        key={reward.day}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: index * 0.05 }}
        className={`relative flex flex-col items-center p-3 rounded-xl transition-all ${
          isToday && canClaim
            ? 'ring-2 ring-offset-2 ring-offset-dark-800 bg-gradient-to-br from-amber-500/20 to-orange-500/20'
            : isClaimed
            ? 'bg-dark-700/50 opacity-60'
            : isLocked
            ? 'bg-dark-800'
            : 'bg-dark-700'
        }`}
        style={isToday && canClaim ? { '--tw-ring-color': primaryColor } as React.CSSProperties : {}}
      >
        {/* Day Badge */}
        <div
          className={`absolute -top-2 -right-2 h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold ${
            isClaimed
              ? 'bg-green-500 text-white'
              : isToday
              ? 'text-white'
              : 'bg-dark-600 text-gray-400'
          }`}
          style={isToday && !isClaimed ? { backgroundColor: primaryColor } : {}}
        >
          {isClaimed ? '✓' : reward.day}
        </div>

        {/* Icon */}
        <div className="h-10 w-10 rounded-lg flex items-center justify-center mb-2 relative">
          {reward.special?.icon ? (
            <span className="text-2xl">{reward.special.icon}</span>
          ) : (
            <GiftIcon
              className={`h-6 w-6 ${
                isClaimed
                  ? 'text-gray-500'
                  : isLocked
                  ? 'text-gray-600'
                  : 'text-amber-500'
              }`}
            />
          )}

          {isPremiumLocked && (
            <div className="absolute inset-0 flex items-center justify-center bg-dark-900/70 rounded-lg">
              <StarIcon className="h-4 w-4 text-amber-500" />
            </div>
          )}
        </div>

        {/* Rewards */}
        <div className="text-center space-y-0.5">
          <div className="flex items-center gap-1 text-xs">
            <SparklesIcon className="h-3 w-3 text-purple-400" />
            <span>{reward.xp}</span>
          </div>
          {reward.coins && (
            <div className="flex items-center gap-1 text-xs">
              <span>🪙</span>
              <span>{reward.coins}</span>
            </div>
          )}
        </div>

        {/* Premium indicator */}
        {reward.isPremium && (
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 px-1.5 py-0.5 bg-amber-500 text-black text-[10px] font-bold rounded">
            VIP
          </div>
        )}
      </motion.div>
    );
  };

  if (variant === 'compact') {
    return (
      <GlassCard variant="frosted" className={`p-4 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div
              animate={canClaim ? { scale: [1, 1.1, 1] } : {}}
              transition={{ duration: 1.5, repeat: Infinity }}
              className={`h-12 w-12 rounded-xl flex items-center justify-center ${
                canClaim ? 'bg-gradient-to-br from-amber-500 to-orange-500' : 'bg-dark-700'
              }`}
            >
              {canClaim ? (
                <GiftIconSolid className="h-6 w-6 text-white" />
              ) : (
                <ClockIcon className="h-6 w-6 text-gray-400" />
              )}
            </motion.div>
            <div>
              <div className="font-semibold">
                {canClaim ? 'Daily Reward Ready!' : 'Next Reward'}
              </div>
              <div className="text-sm text-gray-400">
                {canClaim ? (
                  <span className="flex items-center gap-1">
                    <SparklesIcon className="h-4 w-4 text-purple-400" />
                    +{todayReward.xp} XP
                    {todayReward.coins && ` · +${todayReward.coins} coins`}
                  </span>
                ) : (
                  timeUntilClaim
                )}
              </div>
            </div>
          </div>

          {canClaim && onClaim && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleClaim}
              disabled={isClaiming}
              className="px-4 py-2 rounded-lg font-medium"
              style={{ backgroundColor: primaryColor }}
            >
              {isClaiming ? 'Claiming...' : 'Claim'}
            </motion.button>
          )}
        </div>
      </GlassCard>
    );
  }

  return (
    <div className={className}>
      <GlassCard variant="frosted" className="overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-dark-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.div
                animate={canClaim ? { rotate: [0, -10, 10, -10, 0] } : {}}
                transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
                className="h-12 w-12 rounded-xl flex items-center justify-center bg-gradient-to-br from-amber-500 to-orange-500"
              >
                <GiftIconSolid className="h-6 w-6 text-white" />
              </motion.div>
              <div>
                <h2 className="font-semibold text-lg">Daily Rewards</h2>
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
            {rewards.map((reward, index) => renderRewardCard(reward, index))}
          </div>
        </div>

        {/* Today's Reward Details */}
        <div className="px-4 pb-4">
          <GlassCard variant="crystal" className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-400 mb-1">Today's Reward</div>
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1 text-lg font-bold">
                    <SparklesIcon className="h-5 w-5 text-purple-400" />
                    {todayReward.xp} XP
                  </span>
                  {todayReward.coins && (
                    <span className="flex items-center gap-1 text-lg font-bold">
                      <span>🪙</span>
                      {todayReward.coins}
                    </span>
                  )}
                </div>
                {todayReward.special && (
                  <div className="flex items-center gap-2 mt-2 text-sm">
                    <span>{todayReward.special.icon}</span>
                    <span className="text-amber-400">{todayReward.special.name}</span>
                  </div>
                )}
              </div>

              {canClaim && onClaim && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleClaim}
                  disabled={isClaiming}
                  className="px-6 py-3 rounded-xl font-medium text-white flex items-center gap-2"
                  style={{ backgroundColor: primaryColor }}
                >
                  <GiftIcon className="h-5 w-5" />
                  {isClaiming ? 'Claiming...' : 'Claim Reward'}
                </motion.button>
              )}

              {!canClaim && (
                <div className="flex items-center gap-2 text-gray-400">
                  <CheckCircleIcon className="h-6 w-6 text-green-500" />
                  <span>Claimed</span>
                </div>
              )}
            </div>
          </GlassCard>
        </div>

        {/* Premium Bonus */}
        {!isPremium && (
          <div className="px-4 pb-4">
            <div className="flex items-center justify-between p-3 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-lg">
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
            <div className="p-4 bg-dark-700/50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">Monthly Reward Progress</span>
                <span className="text-sm font-medium">
                  {monthlyProgress}/{monthlyReward.daysRequired} days
                </span>
              </div>
              <div className="h-2 bg-dark-600 rounded-full overflow-hidden mb-3">
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
              className="w-full flex items-center justify-center gap-2 p-3 border border-dashed border-dark-600 rounded-lg text-gray-400 hover:text-white hover:border-gray-500 transition-colors"
            >
              <ArrowPathIcon className="h-5 w-5" />
              Watch ad for 2x reward
            </button>
          </div>
        )}
      </GlassCard>

      {/* Claim Success Animation */}
      <AnimatePresence>
        {claimedReward && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, opacity: 0 }}
              className="text-center"
            >
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="text-6xl mb-4"
              >
                🎁
              </motion.div>
              <h2 className="text-2xl font-bold mb-2">Reward Claimed!</h2>
              <div className="flex items-center justify-center gap-4">
                <span className="flex items-center gap-1 text-xl text-purple-400">
                  <SparklesIcon className="h-6 w-6" />
                  +{claimedReward.xp} XP
                </span>
                {claimedReward.coins && (
                  <span className="flex items-center gap-1 text-xl text-amber-400">
                    <span>🪙</span>
                    +{claimedReward.coins}
                  </span>
                )}
              </div>
              {claimedReward.special && (
                <div className="mt-3 text-lg">
                  <span>{claimedReward.special.icon}</span>
                  <span className="ml-2">{claimedReward.special.name}</span>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default DailyRewards;
