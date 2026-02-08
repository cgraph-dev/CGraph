import { motion, AnimatePresence } from 'framer-motion';
import { SparklesIcon, TrophyIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { GlassCard } from '@/shared/components/ui';
import {
  BackgroundParticles,
  LevelTransition,
  RewardsUnlockedList,
  useLevelUpEffects,
} from './level-up-modal';

/**
 * Level Up Modal Component
 *
 * A spectacular full-screen celebration modal that appears when the user levels up.
 * Features confetti, animated level transition, reward showcase, and social sharing.
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
  const { showRewards, hasRewards } = useLevelUpEffects(isOpen, rewardsUnlocked);

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
          <BackgroundParticles />

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
                <LevelTransition oldLevel={oldLevel} newLevel={newLevel} />

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
                <RewardsUnlockedList
                  visible={showRewards && hasRewards}
                  titles={rewardsUnlocked.titles}
                  badges={rewardsUnlocked.badges}
                  perks={rewardsUnlocked.perks}
                  loreFragments={rewardsUnlocked.loreFragments}
                />

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
