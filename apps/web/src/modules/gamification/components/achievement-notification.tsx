/**
 * Achievement unlock notification component.
 * @module
 */
import { motion, AnimatePresence } from 'motion/react';
import { TrophyIcon, XMarkIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { GlassCard } from '@/shared/components/ui';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import type { Achievement } from '@/modules/gamification/store';
import { RARITY_COLORS } from '@/modules/gamification/components/achievement-notification/constants';
import {
  useUnlockCelebration,
  useAnimatedProgress,
  useAutoDismiss,
} from '@/modules/gamification/components/achievement-notification/useAchievementEffects';
import { tweens, loop, springs } from '@/lib/animation-presets';

export interface AchievementNotificationData {
  achievement: Achievement & {
    progress: number;
    unlocked: boolean;
    unlockedAt?: string;
  };
  isUnlock: boolean; // true for unlock, false for progress update
}

interface AchievementNotificationProps {
  notifications: AchievementNotificationData[];
  onDismiss: (index: number) => void;
  onViewDetails?: (achievement: Achievement) => void;
}

/**
 * Achievement Notification component.
 */
export default function AchievementNotification({
  notifications,
  onDismiss,
  onViewDetails,
}: AchievementNotificationProps) {
  return (
    <div className="fixed right-4 top-4 z-50 max-w-sm space-y-3">
      <AnimatePresence mode="popLayout">
        {notifications.map((notification, index) => (
          <AchievementToast
            key={`${notification.achievement.id}-${index}`}
            data={notification}
            index={index}
            onDismiss={() => onDismiss(index)}
            onViewDetails={onViewDetails}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

function AchievementToast({
  data,
  index: _index,
  onDismiss,
  onViewDetails,
}: {
  data: AchievementNotificationData;
  index: number;
  onDismiss: () => void;
  onViewDetails?: (achievement: Achievement) => void;
}) {
  const { achievement, isUnlock } = data;
  const colors = RARITY_COLORS[achievement.rarity];

  useUnlockCelebration(isUnlock, achievement.rarity);
  const progress = useAnimatedProgress(achievement.progress, achievement.maxProgress);
  const autoDismissProgress = useAutoDismiss(onDismiss);

  return (
    <motion.div
      initial={{ x: 400, opacity: 0, scale: 0.8 }}
      animate={{ x: 0, opacity: 1, scale: 1 }}
      exit={{ x: 400, opacity: 0, scale: 0.8 }}
      transition={springs.dramatic}
      whileHover={{ scale: 1.02, x: -5 }}
      onClick={() => onViewDetails?.(achievement)}
      className="cursor-pointer"
    >
      <GlassCard
        variant={isUnlock ? 'neon' : 'frosted'}
        glow={isUnlock}
        className="relative overflow-hidden"
      >
        {/* Rarity Glow */}
        {isUnlock && (
          <motion.div
            className="absolute inset-0 opacity-20"
            style={{
              background: `linear-gradient(135deg, ${colors.from}, ${colors.to})`,
            }}
            animate={{
              opacity: [0.2, 0.4, 0.2],
            }}
            transition={loop(tweens.ambient)}
          />
        )}

        {/* Auto-dismiss Progress Bar */}
        <div className="absolute left-0 right-0 top-0 h-1 bg-white/[0.04]">
          <motion.div
            className="h-full bg-gradient-to-r from-primary-500 to-purple-500"
            style={{ width: `${autoDismissProgress}%` }}
          />
        </div>

        <div className="relative z-10 p-4 pt-5">
          <div className="flex items-start gap-3">
            {/* Icon */}
            <motion.div
              className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full text-2xl"
              style={{
                background: `linear-gradient(135deg, ${colors.from}, ${colors.to})`,
              }}
              animate={
                isUnlock
                  ? {
                      rotate: [0, 10, -10, 10, 0],
                      scale: [1, 1.1, 1],
                    }
                  : {}
              }
              transition={tweens.emphatic}
            >
              {achievement.icon || '🏆'}
            </motion.div>

            {/* Content */}
            <div className="min-w-0 flex-1">
              {/* Header */}
              <div className="mb-1 flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-white">{achievement.title}</h4>
                    {isUnlock && (
                      <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ delay: 0.2, ...springs.default }}
                      >
                        <SparklesIcon className="h-4 w-4 text-primary-400" />
                      </motion.div>
                    )}
                  </div>
                  <div className="mt-0.5 flex items-center gap-2">
                    <span
                      className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                      style={{
                        background: `linear-gradient(135deg, ${colors.from}40, ${colors.to}40)`,
                        color: colors.from,
                      }}
                    >
                      {achievement.rarity}
                    </span>
                    {isUnlock && (
                      <span className="text-[10px] font-semibold text-green-400">UNLOCKED!</span>
                    )}
                  </div>
                </div>

                {/* Close Button */}
                <motion.button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDismiss();
                    HapticFeedback.light();
                  }}
                  className="rounded-full p-1 text-gray-400 transition-colors hover:bg-white/[0.08] hover:text-white"
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <XMarkIcon className="h-4 w-4" />
                </motion.button>
              </div>

              {/* Description */}
              <p className="mb-2 line-clamp-2 text-xs text-gray-400">{achievement.description}</p>

              {/* Progress or Rewards */}
              {isUnlock ? (
                <div className="flex items-center gap-2 text-xs">
                  <TrophyIcon className="h-4 w-4 text-primary-400" />
                  <span className="font-semibold text-primary-400">+{achievement.xpReward} XP</span>
                  {achievement.titleReward && (
                    <>
                      <span className="text-gray-500">•</span>
                      <span className="text-purple-400">
                        New Title: &quot;{achievement.titleReward}&quot;
                      </span>
                    </>
                  )}
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">Progress</span>
                    <span className="font-semibold text-gray-300">
                      {achievement.progress} / {achievement.maxProgress}
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.04]">
                    <motion.div
                      className="h-full rounded-full"
                      style={{
                        background: `linear-gradient(90deg, ${colors.from}, ${colors.to})`,
                        width: `${progress}%`,
                      }}
                      initial={{ width: 0 }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Rarity Border */}
        <div
          className="absolute inset-x-0 bottom-0 h-0.5"
          style={{
            background: `linear-gradient(90deg, ${colors.from}, ${colors.to})`,
          }}
        />
      </GlassCard>
    </motion.div>
  );
}
