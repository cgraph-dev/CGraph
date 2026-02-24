/**
 * Empty State
 *
 * Displayed when there are no notifications to show.
 */

import { motion } from 'framer-motion';
import { BellIcon } from '@heroicons/react/24/outline';
import { GlassCard } from '@/shared/components/ui';
import type { EmptyStateProps } from './types';
import { tweens, loop } from '@/lib/animation-presets';

export function EmptyState({ filter }: EmptyStateProps) {
  return (
    <motion.div
      key="empty"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
    >
      <GlassCard variant="holographic" glow glowColor="rgba(16, 185, 129, 0.3)" className="p-12">
        <div className="flex flex-col items-center justify-center text-center">
          <motion.div
            className="relative mb-4"
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={loop(tweens.glacial)}
          >
            <div className="rounded-full bg-gradient-to-br from-primary-500/20 to-purple-500/20 p-4">
              <BellIcon className="h-12 w-12 text-primary-400" />
            </div>
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-primary-500/30"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 0, 0.5],
              }}
              transition={loop(tweens.decorative)}
            />
          </motion.div>
          <h3 className="mb-2 bg-gradient-to-r from-white via-primary-200 to-purple-200 bg-clip-text text-lg font-medium text-transparent">
            {filter === 'unread' ? 'All caught up!' : 'No notifications yet'}
          </h3>
          <p className="text-gray-400">
            {filter === 'unread'
              ? 'You have no unread notifications'
              : 'When you get notifications, they will appear here'}
          </p>
        </div>
      </GlassCard>
    </motion.div>
  );
}
