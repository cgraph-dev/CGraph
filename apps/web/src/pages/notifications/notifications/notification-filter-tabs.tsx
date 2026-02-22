/**
 * Notification Filter Tabs
 *
 * Toggle between all and unread notifications.
 */

import { motion, AnimatePresence } from 'framer-motion';
import { GlassCard } from '@/shared/components/ui';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import type { NotificationFilterTabsProps } from './types';
import { springs } from '@/lib/animation-presets/presets';

export function NotificationFilterTabs({
  filter,
  onFilterChange,
  unreadCount,
}: NotificationFilterTabsProps) {
  return (
    <GlassCard variant="default" className="mb-6 p-1">
      <div className="relative flex gap-1">
        <motion.button
          onClick={() => {
            onFilterChange('all');
            HapticFeedback.light();
          }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="relative z-10 flex-1 rounded-md px-4 py-2 text-sm font-medium transition-all"
        >
          {filter === 'all' && (
            <motion.div
              layoutId="notificationFilterTab"
              className="absolute inset-0 rounded-md bg-gradient-to-r from-primary-500/20 via-purple-500/20 to-transparent"
              style={{ boxShadow: '0 0 15px rgba(16, 185, 129, 0.3)' }}
              transition={springs.bouncy}
            />
          )}
          <span className={`relative z-10 ${filter === 'all' ? 'text-white' : 'text-gray-400'}`}>
            All
          </span>
        </motion.button>
        <motion.button
          onClick={() => {
            onFilterChange('unread');
            HapticFeedback.light();
          }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="relative z-10 flex-1 rounded-md px-4 py-2 text-sm font-medium transition-all"
        >
          {filter === 'unread' && (
            <motion.div
              layoutId="notificationFilterTab"
              className="absolute inset-0 rounded-md bg-gradient-to-r from-primary-500/20 via-purple-500/20 to-transparent"
              style={{ boxShadow: '0 0 15px rgba(16, 185, 129, 0.3)' }}
              transition={springs.bouncy}
            />
          )}
          <span className={`relative z-10 ${filter === 'unread' ? 'text-white' : 'text-gray-400'}`}>
            Unread{' '}
            <AnimatePresence mode="wait">
              {unreadCount > 0 && (
                <motion.span
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0, rotate: 180 }}
                  className="inline-block"
                >
                  ({unreadCount})
                </motion.span>
              )}
            </AnimatePresence>
          </span>
        </motion.button>
      </div>
    </GlassCard>
  );
}
