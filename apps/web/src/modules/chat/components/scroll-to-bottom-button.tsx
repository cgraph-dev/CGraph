/**
 * ScrollToBottomButton — floating indicator shown when the user has
 * scrolled up in a conversation, with optional unread count badge.
 *
 * @module chat/components
 */

import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDownIcon } from '@heroicons/react/24/solid';
import { tweens, springs, loop } from '@/lib/animation-presets';

export interface ScrollToBottomButtonProps {
  /** Whether the button should be visible */
  visible: boolean;
  /** Number of new unread messages below viewport */
  newCount?: number;
  /** Callback to scroll to the bottom */
  onClick: () => void;
}

export function ScrollToBottomButton({
  visible,
  newCount = 0,
  onClick,
}: ScrollToBottomButtonProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          initial={{ y: 20, opacity: 0, scale: 0.9 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 20, opacity: 0, scale: 0.9 }}
          transition={springs.snappy}
          onClick={onClick}
          className="absolute bottom-24 right-6 z-30 flex items-center gap-1.5 rounded-full border border-dark-600 bg-dark-800/90 px-3 py-2 text-sm text-white shadow-xl backdrop-blur-sm transition-colors hover:bg-dark-700"
          aria-label="Scroll to latest messages"
        >
          {/* Bouncing arrow */}
          <motion.span
            animate={{ y: [0, 3, 0] }}
            transition={loop(tweens.slow)}
          >
            <ChevronDownIcon className="h-4 w-4" />
          </motion.span>

          {/* Unread count badge */}
          <AnimatePresence>
            {newCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: [1, 1.2, 1] }}
                exit={{ scale: 0 }}
                transition={springs.bouncy}
                className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary-600 px-1.5 text-[10px] font-bold"
              >
                {newCount > 99 ? '99+' : newCount}
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      )}
    </AnimatePresence>
  );
}

export default ScrollToBottomButton;
