/**
 * CollectionHeader - displays achievement stats and progress bar
 */

import { motion } from 'framer-motion';
import { TrophyIcon } from '@heroicons/react/24/outline';
import type { CollectionStats } from './types';
import { tweens } from '@/lib/animation-presets';

interface CollectionHeaderProps {
  stats: CollectionStats;
}

/**
 * unknown for the gamification module.
 */
/**
 * Collection Header component.
 */
export function CollectionHeader({ stats }: CollectionHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <TrophyIcon className="h-6 w-6 text-amber-400" />
        <div>
          <h2 className="text-lg font-bold text-white">Achievements</h2>
          <p className="text-sm text-gray-400">
            {stats.unlocked} / {stats.total} unlocked ({stats.percentage}%)
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2 w-32 overflow-hidden rounded-full bg-dark-700">
        <motion.div
          className="h-full bg-gradient-to-r from-primary-500 to-primary-400"
          initial={{ width: 0 }}
          animate={{ width: `${stats.percentage}%` }}
          transition={tweens.smooth}
        />
      </div>
    </div>
  );
}
