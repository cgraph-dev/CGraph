/**
 * ClaimSuccessModal Component
 *
 * Success animation overlay after claiming reward
 */

import { motion, AnimatePresence } from 'framer-motion';
import { SparklesIcon } from '@heroicons/react/24/outline';
import type { ClaimSuccessModalProps } from './types';

/**
 * Claim success celebration overlay
 */
export function ClaimSuccessModal({ claimedReward }: ClaimSuccessModalProps) {
  return (
    <AnimatePresence>
      {claimedReward && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
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
              className="mb-4 text-6xl"
            >
              🎁
            </motion.div>
            <h2 className="mb-2 text-2xl font-bold">Reward Claimed!</h2>
            <div className="flex items-center justify-center gap-4">
              <span className="flex items-center gap-1 text-xl text-purple-400">
                <SparklesIcon className="h-6 w-6" />+{claimedReward.xp} XP
              </span>
              {claimedReward.coins && (
                <span className="flex items-center gap-1 text-xl text-amber-400">
                  <span>🪙</span>+{claimedReward.coins}
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
  );
}

export default ClaimSuccessModal;
