/**
 * Notification Header
 *
 * Page header with title, unread count, and mark all read button.
 */

import { motion, AnimatePresence } from 'framer-motion';
import { BellIcon, CheckIcon } from '@heroicons/react/24/outline';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import type { NotificationHeaderProps } from './types';
import { tweens, loop } from '@/lib/animation-presets';

/**
 * unknown for the notifications module.
 */
/**
 * Notification Header component.
 */
export function NotificationHeader({ unreadCount, onMarkAllRead }: NotificationHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={tweens.moderate}
      className="mb-6 flex items-center justify-between"
    >
      <div>
        <h1 className="flex items-center gap-2 bg-gradient-to-r from-white via-primary-200 to-purple-200 bg-clip-text text-2xl font-bold text-transparent">
          <BellIcon className="h-6 w-6 text-primary-400" />
          Notifications
        </h1>
        <AnimatePresence mode="wait">
          {unreadCount > 0 && (
            <motion.p
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="mt-1 text-sm text-gray-400"
            >
              <motion.span
                className="mr-2 inline-block rounded-full bg-gradient-to-r from-primary-600 to-purple-600 px-2 py-0.5 text-xs font-medium text-white"
                style={{ boxShadow: '0 0 10px rgba(16, 185, 129, 0.4)' }}
                animate={{
                  scale: [1, 1.05, 1],
                }}
                transition={loop(tweens.ambient)}
              >
                {unreadCount}
              </motion.span>
              unread notification{unreadCount !== 1 ? 's' : ''}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      <div className="flex items-center gap-3">
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                onMarkAllRead();
                HapticFeedback.success();
              }}
              className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-primary-600 to-primary-700 px-4 py-2 text-sm font-medium shadow-lg shadow-primary-500/20 transition-all hover:from-primary-700 hover:to-primary-800"
            >
              <CheckIcon className="h-4 w-4" />
              Mark all read
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
