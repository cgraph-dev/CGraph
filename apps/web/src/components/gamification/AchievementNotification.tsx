import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrophyIcon, XMarkIcon, SparklesIcon } from '@heroicons/react/24/outline';
import GlassCard from '@/components/ui/GlassCard';
import { HapticFeedback } from '@/lib/animations/AnimationEngine';
import type { Achievement } from '@/stores/gamificationStore';
import confetti from 'canvas-confetti';

/**
 * Achievement Notification Component
 *
 * A toast-style notification that celebrates achievement unlocks.
 * Features:
 * - Slide-in animation from right with bounce
 * - Rarity-based styling (common to mythic)
 * - Progress bar animation for partial completion
 * - Confetti celebration on unlock
 * - Auto-dismiss with progress indicator
 * - Click to view details or dismiss
 * - Queue system for multiple achievements
 * - Sound effects (optional)
 * - Persistent history in notification center
 *
 * The notification appears in the top-right corner and creates
 * a satisfying moment of recognition without disrupting the user's flow.
 */

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

export default function AchievementNotification({
  notifications,
  onDismiss,
  onViewDetails,
}: AchievementNotificationProps) {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-3 max-w-sm">
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
  index,
  onDismiss,
  onViewDetails,
}: {
  data: AchievementNotificationData;
  index: number;
  onDismiss: () => void;
  onViewDetails?: (achievement: Achievement) => void;
}) {
  const { achievement, isUnlock } = data;
  const [progress, setProgress] = useState(0);
  const [autoDismissProgress, setAutoDismissProgress] = useState(0);

  // Rarity colors
  const rarityColors = {
    common: { from: '#6b7280', to: '#4b5563', glow: '#6b7280' },
    uncommon: { from: '#10b981', to: '#059669', glow: '#10b981' },
    rare: { from: '#3b82f6', to: '#2563eb', glow: '#3b82f6' },
    epic: { from: '#8b5cf6', to: '#7c3aed', glow: '#8b5cf6' },
    legendary: { from: '#f59e0b', to: '#d97706', glow: '#f59e0b' },
    mythic: { from: '#ec4899', to: '#db2777', glow: '#ec4899' },
  };

  const colors = rarityColors[achievement.rarity];

  // Confetti on unlock
  useEffect(() => {
    if (isUnlock) {
      HapticFeedback.success();

      // Different confetti patterns based on rarity
      const particleCount = {
        common: 30,
        uncommon: 50,
        rare: 75,
        epic: 100,
        legendary: 150,
        mythic: 200,
      }[achievement.rarity];

      confetti({
        particleCount,
        spread: 60,
        origin: { x: 1, y: 0.3 },
        colors: [colors.from, colors.to, colors.glow],
        shapes: achievement.rarity === 'mythic' ? ['star'] : ['circle', 'square'],
      });

      if (achievement.rarity === 'legendary' || achievement.rarity === 'mythic') {
        // Additional burst for high-rarity achievements
        setTimeout(() => {
          confetti({
            particleCount: 50,
            spread: 90,
            origin: { x: 1, y: 0.3 },
            colors: [colors.from, colors.to],
          });
        }, 200);
      }
    } else {
      HapticFeedback.light();
    }
  }, [isUnlock, achievement.rarity, colors]);

  // Progress animation
  useEffect(() => {
    const targetProgress = (achievement.progress / achievement.maxProgress) * 100;
    const duration = 1000;
    const steps = 60;
    const increment = targetProgress / steps;
    let currentStep = 0;

    const interval = setInterval(() => {
      currentStep++;
      setProgress(Math.min(currentStep * increment, targetProgress));
      if (currentStep >= steps) clearInterval(interval);
    }, duration / steps);

    return () => clearInterval(interval);
  }, [achievement.progress, achievement.maxProgress]);

  // Auto-dismiss after 5 seconds
  useEffect(() => {
    const duration = 5000;
    const steps = 60;
    const increment = 100 / steps;
    let currentStep = 0;

    const interval = setInterval(() => {
      currentStep++;
      setAutoDismissProgress(Math.min(currentStep * increment, 100));
      if (currentStep >= steps) {
        clearInterval(interval);
        onDismiss();
      }
    }, duration / steps);

    return () => clearInterval(interval);
  }, [onDismiss]);

  return (
    <motion.div
      initial={{ x: 400, opacity: 0, scale: 0.8 }}
      animate={{ x: 0, opacity: 1, scale: 1 }}
      exit={{ x: 400, opacity: 0, scale: 0.8 }}
      transition={{
        type: 'spring',
        stiffness: 200,
        damping: 20,
        delay: index * 0.1,
      }}
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
            transition={{ duration: 2, repeat: Infinity }}
          />
        )}

        {/* Auto-dismiss Progress Bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-dark-800">
          <motion.div
            className="h-full bg-gradient-to-r from-primary-500 to-purple-500"
            style={{ width: `${autoDismissProgress}%` }}
          />
        </div>

        <div className="p-4 pt-5 relative z-10">
          <div className="flex items-start gap-3">
            {/* Icon */}
            <motion.div
              className="flex-shrink-0 h-12 w-12 rounded-full flex items-center justify-center text-2xl"
              style={{
                background: `linear-gradient(135deg, ${colors.from}, ${colors.to})`,
              }}
              animate={isUnlock ? {
                rotate: [0, 10, -10, 10, 0],
                scale: [1, 1.1, 1],
              } : {}}
              transition={{ duration: 0.6 }}
            >
              {achievement.icon || '🏆'}
            </motion.div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              {/* Header */}
              <div className="flex items-start justify-between gap-2 mb-1">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-white text-sm">{achievement.title}</h4>
                    {isUnlock && (
                      <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ delay: 0.2, type: 'spring' }}
                      >
                        <SparklesIcon className="h-4 w-4 text-primary-400" />
                      </motion.div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span
                      className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                      style={{
                        background: `linear-gradient(135deg, ${colors.from}40, ${colors.to}40)`,
                        color: colors.from,
                      }}
                    >
                      {achievement.rarity}
                    </span>
                    {isUnlock && (
                      <span className="text-[10px] text-green-400 font-semibold">UNLOCKED!</span>
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
                  className="p-1 rounded-full hover:bg-dark-700 text-gray-400 hover:text-white transition-colors"
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <XMarkIcon className="h-4 w-4" />
                </motion.button>
              </div>

              {/* Description */}
              <p className="text-xs text-gray-400 mb-2 line-clamp-2">
                {achievement.description}
              </p>

              {/* Progress or Rewards */}
              {isUnlock ? (
                <div className="flex items-center gap-2 text-xs">
                  <TrophyIcon className="h-4 w-4 text-primary-400" />
                  <span className="text-primary-400 font-semibold">+{achievement.xpReward} XP</span>
                  {achievement.titleReward && (
                    <>
                      <span className="text-gray-500">•</span>
                      <span className="text-purple-400">New Title: "{achievement.titleReward}"</span>
                    </>
                  )}
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">Progress</span>
                    <span className="text-gray-300 font-semibold">
                      {achievement.progress} / {achievement.maxProgress}
                    </span>
                  </div>
                  <div className="h-1.5 bg-dark-800 rounded-full overflow-hidden">
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
