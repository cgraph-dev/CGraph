/**
 * Battle Pass Progress component
 * @module modules/gamification/components/events/event-banner/battle-pass
 */

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { normalizeTiers } from './utils';
import type { BattlePassProgressProps } from './types';
import { tweens, loop } from '@/lib/animation-presets';

/**
 * unknown for the gamification module.
 */
/**
 * Battle Pass Progress component.
 */
export function BattlePassProgress({
  tiers: rawTiers,
  currentTier,
  currentXP,
  xpPerTier,
  isPremium,
  onClaimReward,
  onUpgrade,
}: BattlePassProgressProps) {
  // Normalize tiers to have both singular and plural reward accessors
  const tiers = normalizeTiers(rawTiers);
  const progressRef = useRef<HTMLDivElement>(null);
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 10 });

  // Intersection observer for virtual scrolling
  useEffect(() => {
    const container = progressRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollLeft = container.scrollLeft;
      const itemWidth = 120; // Approximate tier width
      const start = Math.max(0, Math.floor(scrollLeft / itemWidth) - 2);
      const end = Math.min(tiers.length, start + Math.ceil(container.clientWidth / itemWidth) + 4);
      setVisibleRange({ start, end });
    };

    container.addEventListener('scroll', handleScroll);
    handleScroll();

    return () => container.removeEventListener('scroll', handleScroll);
  }, [tiers.length]);

  // Auto-scroll to current tier
  useEffect(() => {
    if (progressRef.current) {
      const tierElement = progressRef.current.querySelector(`[data-tier="${currentTier}"]`);
      if (tierElement) {
        tierElement.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    }
  }, [currentTier]);

  const progressInCurrentTier = (currentXP % xpPerTier) / xpPerTier;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-white">Battle Pass</h3>
          <p className="text-sm text-gray-400">
            Tier {currentTier} • {Math.floor(progressInCurrentTier * 100)}% to next tier
          </p>
        </div>

        {!isPremium && (
          <motion.button
            onClick={onUpgrade}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="rounded-lg bg-gradient-to-r from-yellow-500 to-orange-500 px-6 py-2 font-medium"
          >
            ⭐ Upgrade to Premium
          </motion.button>
        )}

        {isPremium && (
          <span className="rounded-lg border border-yellow-500/30 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 px-4 py-2 font-medium text-yellow-400">
            ⭐ Premium
          </span>
        )}
      </div>

      {/* XP Progress Bar */}
      <div className="relative mb-6 h-3 overflow-hidden rounded-full bg-black/30">
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-purple-500 to-pink-500"
          initial={{ width: 0 }}
          animate={{ width: `${progressInCurrentTier * 100}%` }}
          transition={tweens.smooth}
        />
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full bg-white/30"
          style={{ width: `${progressInCurrentTier * 100}%` }}
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={loop(tweens.verySlow)}
        />
      </div>

      {/* Tiers Track */}
      <div
        ref={progressRef}
        className="scrollbar-thin scrollbar-thumb-white/10 flex gap-4 overflow-x-auto pb-4"
        style={{ scrollBehavior: 'smooth' }}
      >
        {tiers.map((tier, index) => {
          const isVisible = index >= visibleRange.start && index <= visibleRange.end;
          const isUnlocked = index < currentTier;
          const isCurrent = index === currentTier - 1;
          const canClaim = isUnlocked && !tier.claimed;

          return (
            <motion.div
              key={tier.id}
              data-tier={index + 1}
              layout
              className={`w-28 flex-shrink-0 ${!isVisible ? 'invisible' : ''}`}
            >
              <div
                className={`relative rounded-xl border p-3 transition-all ${
                  isCurrent
                    ? 'border-purple-500 bg-purple-500/20'
                    : isUnlocked
                      ? 'border-green-500/30 bg-green-500/10'
                      : 'border-white/10 bg-white/5'
                }`}
              >
                {/* Tier Number */}
                <div className="mb-2 text-center">
                  <span
                    className={`text-xs font-medium ${isCurrent ? 'text-purple-400' : 'text-gray-500'}`}
                  >
                    Tier {index + 1}
                  </span>
                </div>

                {/* Free Reward */}
                <div className="mb-2 text-center">
                  <span className="text-2xl">{tier.freeReward.icon}</span>
                  <p className="truncate text-xs text-gray-400">{tier.freeReward.name}</p>
                </div>

                {/* Premium Reward */}
                <div
                  className={`rounded-lg p-2 text-center ${
                    isPremium ? 'bg-yellow-500/10' : 'bg-black/20'
                  }`}
                >
                  <span className="text-2xl">{tier.premiumReward.icon}</span>
                  <p className="truncate text-xs text-gray-400">{tier.premiumReward.name}</p>
                  {!isPremium && <span className="text-xs text-yellow-400">⭐ Premium</span>}
                </div>

                {/* Claim Button */}
                {canClaim && (
                  <motion.button
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    onClick={() => onClaimReward?.(tier.id)}
                    className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-green-500 text-sm font-bold text-white"
                  >
                    ✓
                  </motion.button>
                )}

                {/* Lock overlay */}
                {!isUnlocked && !isCurrent && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/50">
                    <span className="text-2xl">🔒</span>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
