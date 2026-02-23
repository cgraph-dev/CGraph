/**
 * Achievement detail modal dialog.
 * @module
 */
import { motion } from 'framer-motion';
import {
  TrophyIcon,
  SparklesIcon,
  LockClosedIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { GlassCard } from '@/shared/components/ui';
import { TitleBadge } from '@/modules/gamification/components/title-badge';
import type { Achievement } from './types';
import { RARITY_COLORS } from './constants';

interface AchievementDetailModalProps {
  achievement: Achievement | null;
  onClose: () => void;
}

export function AchievementDetailModal({ achievement, onClose }: AchievementDetailModalProps) {
  if (!achievement) return null;

  return (
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
        <GlassCard variant="holographic" glow className="p-6">
          <div className="mb-6 text-center">
            <motion.div
              className="mb-4 text-6xl"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {achievement.icon}
            </motion.div>
            <h2 className="mb-2 text-2xl font-bold text-white">{achievement.title}</h2>
            <p
              className={`text-sm font-bold uppercase tracking-wider ${RARITY_COLORS[achievement.rarity].text}`}
            >
              {achievement.rarity}
            </p>
          </div>

          <p className="mb-6 text-center text-gray-300">{achievement.description}</p>

          {/* Progress */}
          {achievement.maxProgress > 1 && (
            <div className="mb-6">
              <div className="mb-2 flex justify-between text-sm text-gray-400">
                <span>Progress</span>
                <span>
                  {achievement.progress} / {achievement.maxProgress}
                </span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-dark-700">
                <motion.div
                  className="h-full bg-gradient-to-r from-primary-500 to-purple-500"
                  initial={{ width: 0 }}
                  animate={{
                    width: `${(achievement.progress / achievement.maxProgress) * 100}%`,
                  }}
                />
              </div>
            </div>
          )}

          {/* Rewards */}
          <div className="mb-6 flex items-center justify-center gap-6">
            {achievement.xpReward > 0 && (
              <div className="text-center">
                <SparklesIcon className="mx-auto mb-1 h-6 w-6 text-purple-400" />
                <p className="text-lg font-bold text-white">+{achievement.xpReward}</p>
                <p className="text-xs text-gray-500">XP</p>
              </div>
            )}
            {achievement.titleReward && (
              <div className="text-center">
                <TrophyIcon className="mx-auto mb-1 h-6 w-6 text-yellow-400" />
                <TitleBadge title={achievement.titleReward} size="sm" />
              </div>
            )}
          </div>

          {/* Status */}
          {achievement.unlocked ? (
            <div className="rounded-xl border border-green-500/40 bg-green-500/20 p-3 text-center">
              <CheckCircleIcon className="mx-auto mb-1 h-6 w-6 text-green-400" />
              <p className="font-medium text-green-400">Unlocked!</p>
              {achievement.unlockedAt && (
                <p className="text-xs text-green-400/70">
                  {new Date(achievement.unlockedAt).toLocaleDateString()}
                </p>
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-dark-700 bg-dark-800 p-3 text-center">
              <LockClosedIcon className="mx-auto mb-1 h-6 w-6 text-gray-500" />
              <p className="font-medium text-gray-400">Locked</p>
              <p className="text-xs text-gray-500">Keep progressing to unlock!</p>
            </div>
          )}
        </GlassCard>
      </motion.div>
    </motion.div>
  );
}
