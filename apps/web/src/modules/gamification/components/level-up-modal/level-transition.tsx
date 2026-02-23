/**
 * Level transition animation component.
 * @module
 */
import { motion } from 'framer-motion';
import { springs } from '@/lib/animation-presets/presets';
import { ChevronRightIcon } from '@heroicons/react/24/outline';

interface LevelTransitionProps {
  oldLevel: number;
  newLevel: number;
}

/**
 * Animated old-level → arrow → new-level badge with pulsing glow ring.
 */
export default function LevelTransition({ oldLevel, newLevel }: LevelTransitionProps) {
  return (
    <motion.div
      className="flex items-center justify-center gap-6"
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ ...springs.smooth, delay: 0.5 }}
    >
      {/* Old Level */}
      <motion.div
        className="relative"
        animate={{ x: [-100, 0], opacity: [0, 1] }}
        transition={{ delay: 0.6 }}
      >
        <div className="h-24 w-24 rounded-full bg-gradient-to-br from-gray-600 to-gray-800 p-1">
          <div className="flex h-full w-full flex-col items-center justify-center rounded-full bg-dark-900">
            <span className="text-3xl font-bold text-gray-500">{oldLevel}</span>
            <span className="text-[10px] uppercase tracking-wider text-gray-600">Previous</span>
          </div>
        </div>
      </motion.div>

      {/* Arrow */}
      <motion.div
        animate={{
          x: [0, 10, 0],
          opacity: [0.5, 1, 0.5],
        }}
        transition={{ duration: 1, repeat: Infinity }}
      >
        <ChevronRightIcon className="h-8 w-8 text-primary-400" />
      </motion.div>

      {/* New Level */}
      <motion.div
        className="relative"
        animate={{
          scale: [0, 1.2, 1],
          rotate: [0, 360],
        }}
        transition={{ delay: 0.8, duration: 1, ...springs.default }}
      >
        <div className="h-32 w-32 rounded-full bg-gradient-to-br from-primary-500 via-purple-500 to-pink-500 p-1.5">
          <div className="flex h-full w-full flex-col items-center justify-center rounded-full bg-dark-900">
            <span className="bg-gradient-to-r from-primary-400 to-purple-400 bg-clip-text text-4xl font-bold text-transparent">
              {newLevel}
            </span>
            <span className="text-xs uppercase tracking-wider text-gray-400">Current</span>
          </div>
        </div>
        {/* Pulsing Glow */}
        <motion.div
          className="absolute inset-0 rounded-full bg-gradient-to-br from-primary-400 to-purple-400"
          animate={{
            opacity: [0.3, 0.7, 0.3],
            scale: [1, 1.3, 1],
          }}
          transition={{ duration: 2, repeat: Infinity }}
          style={{ filter: 'blur(20px)', zIndex: -1 }}
        />
      </motion.div>
    </motion.div>
  );
}
