/**
 * LoadingSpinner - conversation loading state
 */

import { motion } from 'motion/react';
import { tweens, loop } from '@/lib/animation-presets';

/**
 * unknown for the messages module.
 */
/**
 * Loading Spinner — loading placeholder.
 */
export function LoadingSpinner() {
  return (
    <div className="flex flex-1 items-center justify-center bg-dark-900">
      <motion.div
        className="h-12 w-12 rounded-full border-4 border-primary-500 border-t-transparent"
        animate={{ rotate: 360 }}
        transition={loop(tweens.slow)}
      />
    </div>
  );
}
