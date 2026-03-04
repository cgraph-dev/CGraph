/**
 * BadgesSection Component
 *
 * Displays the badges selection grid with equipped badges management.
 */

import { motion } from 'motion/react';
import { LockClosedIcon, SparklesIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleIconSolid } from '@heroicons/react/24/solid';
import { GlassCard } from '@/shared/components/ui';
import type { Badge, Rarity } from '../types';
import { tweens } from '@/lib/animation-presets';

export interface BadgesSectionProps {
  badges: Badge[];
  equippedBadges: string[];
  onToggle: (badgeId: string, badge: Badge) => void;
  getRarityColor: (rarity: Rarity) => string;
}

/**
 * unknown for the customize module.
 */
/**
 * Badges Section component.
 */
export function BadgesSection({
  badges,
  equippedBadges,
  onToggle,
  getRarityColor,
}: BadgesSectionProps) {
  const isMaxEquipped = equippedBadges.length >= 5;

  return (
    <div>
      {/* Equipped Badges Display */}
      <GlassCard variant="holographic" className="mb-6 p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <SparklesIcon className="h-6 w-6 text-primary-400" />
            <h3 className="text-lg font-bold text-white">Equipped Badges</h3>
          </div>
          <div
            className={`flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium ${
              isMaxEquipped
                ? 'border border-yellow-500/30 bg-yellow-500/20 text-yellow-400'
                : 'bg-white/10 text-white/60'
            }`}
          >
            <span>{equippedBadges.length}/5</span>
            {isMaxEquipped && (
              <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-xs">
                MAX
              </motion.span>
            )}
          </div>
        </div>

        {/* Progress bar for equipped badges */}
        <div className="mb-4 h-2 w-full overflow-hidden rounded-full bg-white/10">
          <motion.div
            className={`h-full rounded-full ${
              isMaxEquipped
                ? 'bg-gradient-to-r from-yellow-500 to-orange-500'
                : 'bg-gradient-to-r from-primary-500 to-purple-500'
            }`}
            initial={{ width: 0 }}
            animate={{ width: `${(equippedBadges.length / 5) * 100}%` }}
            transition={tweens.standard}
          />
        </div>

        <div className="grid grid-cols-5 gap-3">
          {[...Array(5)].map((_, index) => {
            const badgeId = equippedBadges[index];
            const badge = badges.find((b) => b.id === badgeId);
            const isSlotFilled = !!badge;

            return (
              <motion.div
                key={index}
                className={`group relative flex aspect-square items-center justify-center rounded-xl border-2 transition-all duration-200 ${
                  isSlotFilled
                    ? 'border-primary-500/50 bg-primary-500/10'
                    : isMaxEquipped
                      ? 'border-dashed border-white/10 bg-white/5 opacity-50'
                      : 'border-dashed border-white/20 bg-white/5 hover:border-white/30'
                }`}
                whileHover={isSlotFilled ? { scale: 1.05 } : undefined}
              >
                {badge ? (
                  <>
                    <span className="text-4xl">{badge.icon}</span>
                    <button
                      onClick={() => onToggle(badge.id, badge)}
                      className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white opacity-0 transition-all hover:scale-110 hover:bg-red-600 group-hover:opacity-100"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                    {/* Badge name tooltip */}
                    <div className="pointer-events-none absolute -bottom-8 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded bg-white/[0.04] px-2 py-1 text-[10px] text-white/80 opacity-0 transition-opacity group-hover:opacity-100">
                      {badge.name}
                    </div>
                  </>
                ) : (
                  <span className="text-xs text-white/30">
                    {isMaxEquipped ? '—' : `Slot ${index + 1}`}
                  </span>
                )}
              </motion.div>
            );
          })}
        </div>

        {isMaxEquipped && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 text-center text-xs text-yellow-400/80"
          >
            ⚠️ Maximum badges equipped! Remove one to add another.
          </motion.p>
        )}
      </GlassCard>

      {/* Available Badges Grid */}
      <div className="grid grid-cols-3 gap-4">
        {badges.map((badge, index) => {
          const isEquipped = equippedBadges.includes(badge.id);
          const canEquip = badge.unlocked && !isEquipped && !isMaxEquipped;

          return (
            <motion.div
              key={badge.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.02 }}
            >
              <GlassCard
                variant={badge.unlocked ? 'crystal' : ('frosted' as const)}
                glow={isEquipped}
                glowColor={isEquipped ? 'rgba(34, 197, 94, 0.3)' : undefined}
                className={`relative p-4 transition-all ${
                  canEquip
                    ? 'cursor-pointer hover:scale-105'
                    : isEquipped
                      ? 'cursor-pointer'
                      : badge.unlocked && isMaxEquipped
                        ? 'cursor-not-allowed opacity-70'
                        : 'cursor-not-allowed opacity-60'
                }`}
                onClick={() => onToggle(badge.id, badge)}
              >
                {/* Max equipped indicator for available badges */}
                {badge.unlocked && !isEquipped && isMaxEquipped && (
                  <div className="absolute right-2 top-2 rounded bg-yellow-500/20 px-1.5 py-0.5 text-[10px] text-yellow-400">
                    MAX
                  </div>
                )}

                {/* Badge Icon */}
                <div className="mb-3 text-center text-5xl">{badge.icon}</div>

                {/* Badge Name */}
                <h4 className="mb-1 truncate text-center text-sm font-semibold text-white">
                  {badge.name}
                </h4>

                {/* Badge Description */}
                <p className="mb-2 line-clamp-2 text-center text-xs text-white/60">
                  {badge.description}
                </p>

                {/* Rarity */}
                <p className={`mb-2 text-center text-xs ${getRarityColor(badge.rarity)}`}>
                  {badge.rarity.charAt(0).toUpperCase() + badge.rarity.slice(1)}
                </p>

                {/* Status */}
                {badge.unlocked ? (
                  isEquipped ? (
                    <div className="flex items-center justify-center gap-1 text-xs text-green-400">
                      <CheckCircleIconSolid className="h-4 w-4" />
                      <span>Equipped</span>
                    </div>
                  ) : (
                    <div className="text-center text-xs text-primary-400">Click to equip</div>
                  )
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center rounded-xl bg-black/60 backdrop-blur-sm">
                    <LockClosedIcon className="mb-2 h-8 w-8 text-white/40" />
                    <p className="px-2 text-center text-xs text-white/60">
                      {badge.unlockRequirement}
                    </p>
                  </div>
                )}
              </GlassCard>
            </motion.div>
          );
        })}

        {badges.length === 0 && (
          <div className="col-span-3 py-12 text-center text-white/60">
            No badges found matching your search.
          </div>
        )}
      </div>
    </div>
  );
}
