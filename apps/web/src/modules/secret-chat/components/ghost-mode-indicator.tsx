/**
 * GhostModeIndicator
 *
 * Displays the current ghost mode status with a pulsing animation
 * when active. Ghost mode hides read receipts and typing indicators.
 *
 * @module modules/secret-chat/components/GhostModeIndicator
 */

import { memo } from 'react';
import { motion, AnimatePresence } from 'motion/react';

/** Props for the GhostModeIndicator component */
export interface GhostModeIndicatorProps {
  /** Whether ghost mode is currently active */
  isActive: boolean;
  /** Whether a toggle operation is in progress */
  isToggling?: boolean;
}

/**
 * Ghost mode status indicator with pulse animation.
 * Shows a ghost icon with a pulsing glow when ghost mode is active.
 */
export const GhostModeIndicator = memo(function GhostModeIndicator({
  isActive,
  isToggling = false,
}: GhostModeIndicatorProps) {
  return (
    <AnimatePresence mode="wait">
      {isActive && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.2 }}
          className="flex items-center gap-1.5"
        >
          {/* Pulsing dot */}
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>

          <span className="text-xs font-medium text-emerald-400">
            {isToggling ? '...' : 'Ghost'}
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
});
