/**
 * AchievementModal component - detailed view modal
 */

import { motion, AnimatePresence } from 'motion/react';
import { TrophyIcon as TrophyIconSolid } from '@heroicons/react/24/solid';
import { GlassCard } from '@/shared/components/ui';
import { RARITY_COLORS } from './constants';
import type { Achievement } from './types';

interface AchievementModalProps {
  achievement: Achievement | null;
  isUnlocked: boolean;
  progress: number;
  onClose: () => void;
}

/**
 * unknown for the gamification module.
 */
/**
 * Achievement Modal dialog component.
 */
export function AchievementModal({
  achievement,
  isUnlocked,
  progress,
  onClose,
}: AchievementModalProps) {
  return (
    <AnimatePresence>
      {achievement && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md"
          >
            <GlassCard variant="neon" className="p-6">
              <div className="text-center">
                <div
                  className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl"
                  style={{
                    backgroundColor: `${RARITY_COLORS[achievement.rarity]}20`,
                  }}
                >
                  {achievement.iconUrl ? (
                    <img src={achievement.iconUrl} alt={achievement.name} className="h-14 w-14" />
                  ) : (
                    <TrophyIconSolid
                      className="h-12 w-12"
                      style={{ color: RARITY_COLORS[achievement.rarity] }}
                    />
                  )}
                </div>

                <span
                  className="mb-3 inline-block rounded-full px-3 py-1 text-sm font-medium capitalize"
                  style={{
                    backgroundColor: `${RARITY_COLORS[achievement.rarity]}20`,
                    color: RARITY_COLORS[achievement.rarity],
                  }}
                >
                  {achievement.rarity}
                </span>

                <h3 className="mb-2 text-xl font-bold">{achievement.name}</h3>
                <p className="mb-4 text-gray-400">{achievement.description}</p>

                {/* Progress */}
                {achievement.targetProgress && !isUnlocked && (
                  <div className="mb-4">
                    <div className="h-3 overflow-hidden rounded-full bg-white/[0.06]">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ backgroundColor: RARITY_COLORS[achievement.rarity] }}
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                      />
                    </div>
                    <p className="mt-2 text-sm text-gray-400">
                      {achievement.currentProgress || 0} / {achievement.targetProgress}
                    </p>
                  </div>
                )}

                {/* Rewards */}
                <div className="flex items-center justify-center gap-6">
                  {achievement.xpReward > 0 && (
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-400">
                        +{achievement.xpReward}
                      </div>
                      <div className="text-sm text-gray-400">XP</div>
                    </div>
                  )}
                  {achievement.coinReward > 0 && (
                    <div className="text-center">
                      <div className="text-2xl font-bold text-amber-400">
                        +{achievement.coinReward}
                      </div>
                      <div className="text-sm text-gray-400">Coins</div>
                    </div>
                  )}
                </div>

                {isUnlocked && achievement.unlockedAt && (
                  <p className="mt-4 text-sm text-gray-500">
                    Unlocked on {new Date(achievement.unlockedAt).toLocaleDateString()}
                  </p>
                )}
              </div>
            </GlassCard>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
