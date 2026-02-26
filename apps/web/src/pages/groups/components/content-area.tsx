/**
 * ContentArea component
 * @module pages/groups
 */

import { durations } from '@cgraph/animation-constants';
import { motion } from 'framer-motion';
import { Outlet } from 'react-router-dom';
import { HashtagIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import { GlassCard } from '@/shared/components/ui';
import type { ContentAreaProps } from './types';
import { tweens, loop, springs } from '@/lib/animation-presets';

/**
 * unknown for the groups module.
 */
/**
 * Content Area component.
 */
export function ContentArea({ activeGroup, groupId, channelId }: ContentAreaProps) {
  // Has channel selected
  if (channelId) {
    return <Outlet />;
  }

  // Has group selected but no channel
  if (groupId) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={springs.bouncy}
        >
          <GlassCard
            variant="holographic"
            glow
            glowColor="rgba(16, 185, 129, 0.3)"
            className="p-12 text-center"
          >
            <motion.div
              animate={{ rotate: [0, 5, -5, 0], y: [0, -5, 0] }}
              transition={loop(tweens.glacial)}
              className="relative mb-4 inline-block"
            >
              <HashtagIcon className="mx-auto h-16 w-16 text-primary-400" />
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-primary-500/30"
                animate={{
                  scale: [1, 1.3, 1],
                  opacity: [0.5, 0, 0.5],
                }}
                transition={loop(tweens.decorative)}
              />
            </motion.div>
            <h3 className="mb-2 bg-gradient-to-r from-white via-primary-200 to-purple-200 bg-clip-text text-xl font-semibold text-transparent">
              Welcome to {activeGroup?.name}
            </h3>
            <p className="text-gray-400">Select a channel to start chatting</p>
          </GlassCard>
        </motion.div>
      </div>
    );
  }

  // No group selected
  return (
    <div className="flex flex-1 items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={springs.bouncy}
      >
        <GlassCard
          variant="holographic"
          glow
          glowColor="rgba(16, 185, 129, 0.3)"
          className="p-16 text-center"
        >
          {/* Floating particles */}
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute h-1 w-1 rounded-full bg-primary-400"
              style={{
                left: `${50 + Math.cos((i * Math.PI * 2) / 6) * 20}%`,
                top: `${40 + Math.sin((i * Math.PI * 2) / 6) * 20}%`,
              }}
              animate={{
                y: [0, -10, 0],
                opacity: [0.2, 0.5, 0.2],
              }}
              transition={{
                duration: durations.cinematic.ms / 1000,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            />
          ))}
          <motion.div
            animate={{ rotate: [0, 5, -5, 0], scale: [1, 1.05, 1] }}
            transition={loop(tweens.glacial)}
            className="relative mb-4 inline-block"
          >
            <UserGroupIcon className="mx-auto h-20 w-20 text-primary-400" />
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-primary-500/30"
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.5, 0, 0.5],
              }}
              transition={loop(tweens.decorative)}
            />
          </motion.div>
          <h3 className="mb-2 bg-gradient-to-r from-white via-primary-200 to-purple-200 bg-clip-text text-2xl font-bold text-transparent">
            Welcome to Groups
          </h3>
          <p className="max-w-md text-gray-400">
            Select a server from the sidebar or create a new one to get started
          </p>
        </GlassCard>
      </motion.div>
    </div>
  );
}
