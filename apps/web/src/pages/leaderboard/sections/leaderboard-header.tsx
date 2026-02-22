/**
 * Leaderboard header with trophy badge and title
 * @module pages/leaderboard/sections
 */

import { motion } from 'framer-motion';
import { TrophyIcon } from '@heroicons/react/24/outline';

import type { HeaderProps } from './types';

export function LeaderboardHeader({ className = '' }: HeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`mb-8 text-center ${className}`}
    >
      {/* Trophy Badge */}
      <motion.div
        className="mb-6 inline-flex items-center gap-3 rounded-2xl border border-yellow-500/30 bg-gradient-to-r from-yellow-500/20 via-amber-500/20 to-orange-500/20 px-6 py-3 backdrop-blur-sm"
        whileHover={{ scale: 1.02 }}
        animate={{
          boxShadow: [
            '0 0 20px rgba(250, 204, 21, 0.2)',
            '0 0 40px rgba(250, 204, 21, 0.3)',
            '0 0 20px rgba(250, 204, 21, 0.2)',
          ],
        }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <motion.div
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <TrophyIcon className="h-7 w-7 text-yellow-400" />
        </motion.div>
        <span className="text-lg font-bold text-yellow-400">Global Rankings</span>
        <motion.span
          className="text-2xl"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          🏆
        </motion.span>
      </motion.div>

      <h1 className="mb-4 text-4xl font-black sm:text-5xl md:text-6xl">
        <span className="bg-gradient-to-r from-white via-yellow-200 to-orange-300 bg-clip-text text-transparent">
          Leaderboard
        </span>
      </h1>
      <p className="mx-auto max-w-xl text-lg text-gray-400">
        Compete with the community, earn achievements, and climb to the top
      </p>
    </motion.div>
  );
}
