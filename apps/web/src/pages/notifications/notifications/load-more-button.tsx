/**
 * Load More Button
 *
 * Button to load additional notifications with loading state.
 */

import { motion, AnimatePresence } from 'motion/react';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import type { LoadMoreButtonProps } from './types';
import { tweens, loop } from '@/lib/animation-presets';

/**
 * unknown for the notifications module.
 */
/**
 * Load More Button component.
 */
export function LoadMoreButton({ hasMore, isLoading, onLoadMore }: LoadMoreButtonProps) {
  return (
    <AnimatePresence>
      {hasMore && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="mt-6 text-center"
        >
          <motion.button
            onClick={() => {
              onLoadMore();
              HapticFeedback.medium();
            }}
            disabled={isLoading}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="rounded-lg bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-3 text-sm font-medium text-white shadow-lg shadow-primary-500/20 transition-all hover:from-primary-700 hover:to-primary-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <motion.div
                  className="h-4 w-4 rounded-full border-2 border-white border-t-transparent"
                  animate={{ rotate: 360 }}
                  transition={loop(tweens.slow)}
                />
                Loading...
              </span>
            ) : (
              'Load more'
            )}
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
