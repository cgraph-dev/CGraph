/**
 * Loading state spinner for leaderboard
 * @module pages/leaderboard/sections
 */

import { motion } from 'motion/react';

import type { LoadingStateProps } from './types';
import { tweens, loop } from '@/lib/animation-presets';

/**
 * unknown for the leaderboard module.
 */
/**
 * Loading State — loading placeholder.
 */
export function LoadingState({ currentCategory }: LoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-24">
      <motion.div
        className={`h-16 w-16 rounded-full border-4 border-t-transparent bg-gradient-to-r ${currentCategory.gradient}`}
        style={{ borderColor: 'currentColor', borderTopColor: 'transparent' }}
        animate={{ rotate: 360 }}
        transition={loop(tweens.slow)}
      />
      <p className="mt-4 text-gray-400">Loading rankings...</p>
    </div>
  );
}
