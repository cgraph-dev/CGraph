/**
 * Welcome panel component for Friends page
 * Displays when viewing friends list
 */

import { motion } from 'framer-motion';
import { GlassCard } from '@/shared/components/ui';
import { HeartIcon, SparklesIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import { tweens, loop, springs } from '@/lib/animation-presets';

interface WelcomePanelProps {
  friendsCount: number;
  pendingRequestsCount: number;
}

/**
 * unknown for the friends module.
 */
/**
 * Welcome Panel component.
 */
export function WelcomePanel({ friendsCount, pendingRequestsCount }: WelcomePanelProps) {
  return (
    <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
      <motion.div
        className="relative flex flex-1 items-center justify-center overflow-hidden bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={tweens.smooth}
      >
        {/* Ambient particles */}
        {[...Array(10)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute h-1 w-1 rounded-full bg-primary-400"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              opacity: 0.1,
            }}
            animate={{
              y: [0, -40, 0],
              opacity: [0.1, 0.3, 0.1],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: 5 + Math.random() * 3,
              repeat: Infinity,
              delay: Math.random() * 5,
            }}
          />
        ))}

        <motion.div
          className="relative z-10 text-center"
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          transition={springs.dramatic}
        >
          <div className="relative mb-6 inline-block">
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-3xl border border-primary-500/30 bg-gradient-to-br from-primary-500/20 via-purple-500/20 to-pink-500/20 shadow-2xl backdrop-blur-sm">
              <HeartIcon className="h-12 w-12 text-primary-400" />
            </div>
            <motion.div
              className="absolute inset-0 rounded-3xl bg-gradient-to-br from-primary-400/20 to-purple-400/20"
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.5, 0, 0.5],
                rotate: [0, 180, 360],
              }}
              transition={loop(tweens.glacial)}
            />
            <motion.div
              className="absolute -inset-4 rounded-3xl border border-primary-400/20"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.3, 0, 0.3],
              }}
              transition={{ ...loop(tweens.decorative), delay: 0.5 }}
            />
          </div>

          <h3 className="mb-3 flex items-center justify-center gap-2 bg-gradient-to-r from-white via-primary-200 to-purple-200 bg-clip-text text-3xl font-bold text-transparent">
            Your Friends
            <SparklesIcon className="h-6 w-6 animate-pulse text-primary-400" />
          </h3>
          <p className="max-w-md text-lg text-gray-400">
            Connect with your friends, start conversations, and stay in touch
          </p>

          <motion.div
            className="mt-6 inline-flex items-center gap-2 text-sm text-gray-500"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={loop(tweens.ambient)}
          >
            <ShieldCheckIcon className="h-4 w-4 text-primary-500" />
            Your friendships are private
          </motion.div>

          {/* Stats cards */}
          <motion.div
            className="mt-8 flex items-center justify-center gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <GlassCard
              variant="holographic"
              glow
              glowColor="rgba(16, 185, 129, 0.2)"
              className="px-6 py-3"
            >
              <p className="bg-gradient-to-r from-primary-400 to-purple-400 bg-clip-text text-2xl font-bold text-transparent">
                {friendsCount}
              </p>
              <p className="text-xs text-gray-400">Friends</p>
            </GlassCard>
            <GlassCard
              variant="holographic"
              glow
              glowColor="rgba(168, 85, 247, 0.2)"
              className="px-6 py-3"
            >
              <p className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-2xl font-bold text-transparent">
                {pendingRequestsCount}
              </p>
              <p className="text-xs text-gray-400">Requests</p>
            </GlassCard>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
}
