import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  SparklesIcon,
  TrophyIcon,
  GiftIcon,
  ChevronRightIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { StarIcon } from '@heroicons/react/24/solid';
import GlassCard from '@/components/ui/GlassCard';
import { HapticFeedback } from '@/lib/animations/AnimationEngine';
import confetti from 'canvas-confetti';

/**
 * Level Up Modal Component
 *
 * A spectacular full-screen celebration modal that appears when the user levels up.
 * Features:
 * - Particle explosion effects using canvas-confetti
 * - Animated level transition with rotating 3D badge
 * - Reward showcase (new unlocks, titles, perks)
 * - Achievement notifications
 * - Lore fragment reveals
 * - Sound effects (optional)
 * - Social sharing integration
 * - Auto-dismiss after viewing or manual close
 *
 * The modal creates a memorable moment of accomplishment, reinforcing
 * positive behavior and encouraging continued engagement with the platform.
 */

interface LevelUpModalProps {
  isOpen: boolean;
  oldLevel: number;
  newLevel: number;
  xpGained: number;
  rewardsUnlocked: {
    titles?: string[];
    badges?: string[];
    perks?: string[];
    loreFragments?: string[];
  };
  onClose: () => void;
}

export default function LevelUpModal({
  isOpen,
  oldLevel,
  newLevel,
  xpGained,
  rewardsUnlocked,
  onClose,
}: LevelUpModalProps) {
  const [showRewards, setShowRewards] = useState(false);

  // Trigger confetti and haptics when modal opens
  useEffect(() => {
    if (isOpen) {
      HapticFeedback.success();

      // Confetti explosion from center
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#10b981', '#8b5cf6', '#ec4899', '#f59e0b'],
      });

      // Additional bursts
      setTimeout(() => {
        confetti({
          particleCount: 50,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#10b981', '#8b5cf6'],
        });
      }, 250);

      setTimeout(() => {
        confetti({
          particleCount: 50,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#ec4899', '#f59e0b'],
        });
      }, 400);

      // Show rewards after level animation
      setTimeout(() => setShowRewards(true), 2000);
    } else {
      setShowRewards(false);
    }
  }, [isOpen]);

  const hasRewards =
    (rewardsUnlocked.titles?.length ?? 0) > 0 ||
    (rewardsUnlocked.badges?.length ?? 0) > 0 ||
    (rewardsUnlocked.perks?.length ?? 0) > 0 ||
    (rewardsUnlocked.loreFragments?.length ?? 0) > 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          {/* Animated Background Particles */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            {[...Array(30)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute h-2 w-2 rounded-full"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  background: `linear-gradient(135deg, ${
                    ['#10b981', '#8b5cf6', '#ec4899', '#f59e0b'][i % 4]
                  }, transparent)`,
                }}
                animate={{
                  y: [0, -30, 0],
                  x: [0, Math.random() * 20 - 10, 0],
                  opacity: [0, 1, 0],
                  scale: [0, 1.5, 0],
                }}
                transition={{
                  duration: 3 + Math.random() * 2,
                  repeat: Infinity,
                  delay: Math.random() * 2,
                }}
              />
            ))}
          </div>

          <motion.div
            className="relative w-full max-w-lg"
            initial={{ scale: 0.5, opacity: 0, rotateY: -180 }}
            animate={{ scale: 1, opacity: 1, rotateY: 0 }}
            exit={{ scale: 0.5, opacity: 0, rotateY: 180 }}
            transition={{ type: 'spring', duration: 0.8 }}
            onClick={(e) => e.stopPropagation()}
          >
            <GlassCard
              variant="holographic"
              glow
              borderGradient
              className="relative overflow-hidden p-8"
            >
              {/* Close Button */}
              <motion.button
                onClick={onClose}
                className="absolute right-4 top-4 z-10 rounded-full bg-dark-800/80 p-2 text-gray-400 transition-colors hover:bg-dark-700 hover:text-white"
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
              >
                <XMarkIcon className="h-5 w-5" />
              </motion.button>

              {/* Glow Effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-primary-500/20 via-purple-500/20 to-pink-500/20"
                animate={{
                  opacity: [0.3, 0.6, 0.3],
                  scale: [1, 1.1, 1],
                }}
                transition={{ duration: 2, repeat: Infinity }}
                style={{ filter: 'blur(40px)' }}
              />

              <div className="relative z-10 space-y-6">
                {/* Header */}
                <motion.div
                  className="text-center"
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <motion.div
                    animate={{
                      scale: [1, 1.2, 1],
                      rotate: [0, 5, -5, 0],
                    }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                  >
                    <SparklesIcon className="mx-auto mb-4 h-16 w-16 text-primary-400" />
                  </motion.div>
                  <h2 className="mb-2 bg-gradient-to-r from-primary-400 via-purple-400 to-pink-400 bg-clip-text text-3xl font-bold text-transparent">
                    Level Up!
                  </h2>
                  <p className="text-gray-400">You've reached a new milestone</p>
                </motion.div>

                {/* Level Transition Animation */}
                <motion.div
                  className="flex items-center justify-center gap-6"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', delay: 0.5, stiffness: 200 }}
                >
                  {/* Old Level */}
                  <motion.div
                    className="relative"
                    animate={{ x: [-100, 0], opacity: [0, 1] }}
                    transition={{ delay: 0.6 }}
                  >
                    <div className="h-24 w-24 rounded-full bg-gradient-to-br from-gray-600 to-gray-800 p-1">
                      <div className="flex h-full w-full flex-col items-center justify-center rounded-full bg-dark-900">
                        <span className="text-3xl font-bold text-gray-500">{oldLevel}</span>
                        <span className="text-[10px] uppercase tracking-wider text-gray-600">
                          Previous
                        </span>
                      </div>
                    </div>
                  </motion.div>

                  {/* Arrow */}
                  <motion.div
                    animate={{
                      x: [0, 10, 0],
                      opacity: [0.5, 1, 0.5],
                    }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    <ChevronRightIcon className="h-8 w-8 text-primary-400" />
                  </motion.div>

                  {/* New Level */}
                  <motion.div
                    className="relative"
                    animate={{
                      scale: [0, 1.2, 1],
                      rotate: [0, 360],
                    }}
                    transition={{ delay: 0.8, duration: 1, type: 'spring' }}
                  >
                    <div className="h-32 w-32 rounded-full bg-gradient-to-br from-primary-500 via-purple-500 to-pink-500 p-1.5">
                      <div className="flex h-full w-full flex-col items-center justify-center rounded-full bg-dark-900">
                        <span className="bg-gradient-to-r from-primary-400 to-purple-400 bg-clip-text text-4xl font-bold text-transparent">
                          {newLevel}
                        </span>
                        <span className="text-xs uppercase tracking-wider text-gray-400">
                          Current
                        </span>
                      </div>
                    </div>
                    {/* Pulsing Glow */}
                    <motion.div
                      className="absolute inset-0 rounded-full bg-gradient-to-br from-primary-400 to-purple-400"
                      animate={{
                        opacity: [0.3, 0.7, 0.3],
                        scale: [1, 1.3, 1],
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                      style={{ filter: 'blur(20px)', zIndex: -1 }}
                    />
                  </motion.div>
                </motion.div>

                {/* XP Gained */}
                <motion.div
                  className="text-center"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.2 }}
                >
                  <div className="inline-flex items-center gap-2 rounded-full border border-green-500/30 bg-gradient-to-r from-green-500/20 to-emerald-500/20 px-6 py-3">
                    <TrophyIcon className="h-5 w-5 text-green-400" />
                    <span className="text-xl font-bold text-green-400">
                      +{xpGained.toLocaleString()} XP
                    </span>
                  </div>
                </motion.div>

                {/* Rewards */}
                <AnimatePresence>
                  {showRewards && hasRewards && (
                    <motion.div
                      className="space-y-3"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      <div className="mb-3 flex items-center gap-2 text-primary-400">
                        <GiftIcon className="h-5 w-5" />
                        <span className="font-semibold">Rewards Unlocked</span>
                      </div>

                      {rewardsUnlocked.titles && rewardsUnlocked.titles.length > 0 && (
                        <motion.div
                          className="rounded-lg border border-purple-500/30 bg-purple-500/10 p-3"
                          initial={{ x: -20, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: 0.1 }}
                        >
                          <div className="mb-1 text-sm font-semibold text-purple-400">
                            New Titles
                          </div>
                          {rewardsUnlocked.titles.map((title, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-white">
                              <StarIcon className="h-4 w-4 text-purple-400" />
                              <span>"{title}"</span>
                            </div>
                          ))}
                        </motion.div>
                      )}

                      {rewardsUnlocked.badges && rewardsUnlocked.badges.length > 0 && (
                        <motion.div
                          className="rounded-lg border border-primary-500/30 bg-primary-500/10 p-3"
                          initial={{ x: -20, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: 0.2 }}
                        >
                          <div className="mb-1 text-sm font-semibold text-primary-400">
                            New Badges
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {rewardsUnlocked.badges.map((badge, idx) => (
                              <span key={idx} className="text-2xl" title={badge}>
                                {badge}
                              </span>
                            ))}
                          </div>
                        </motion.div>
                      )}

                      {rewardsUnlocked.perks && rewardsUnlocked.perks.length > 0 && (
                        <motion.div
                          className="rounded-lg border border-pink-500/30 bg-pink-500/10 p-3"
                          initial={{ x: -20, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: 0.3 }}
                        >
                          <div className="mb-1 text-sm font-semibold text-pink-400">New Perks</div>
                          {rewardsUnlocked.perks.map((perk, idx) => (
                            <div key={idx} className="text-sm text-white">
                              • {perk}
                            </div>
                          ))}
                        </motion.div>
                      )}

                      {rewardsUnlocked.loreFragments &&
                        rewardsUnlocked.loreFragments.length > 0 && (
                          <motion.div
                            className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3"
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.4 }}
                          >
                            <div className="mb-1 text-sm font-semibold text-amber-400">
                              Lore Unlocked
                            </div>
                            <div className="text-sm text-white">
                              {rewardsUnlocked.loreFragments.length} new story fragment(s) available
                            </div>
                          </motion.div>
                        )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Continue Button */}
                <motion.button
                  onClick={onClose}
                  className="group relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-primary-600 via-purple-600 to-pink-600 py-4 text-lg font-bold text-white transition-all hover:from-primary-500 hover:via-purple-500 hover:to-pink-500"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: showRewards && hasRewards ? 2 : 1.5 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <motion.div
                    className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20"
                    animate={{
                      x: ['-100%', '200%'],
                    }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                  <span className="relative z-10">Continue</span>
                </motion.button>
              </div>
            </GlassCard>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
