/**
 * Recent achievements grid for the Gamification Hub.
 */

import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { TrophyIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import type { Achievement } from '@/modules/gamification/store/gamificationStore.types';

interface RecentAchievementsProps {
  recentAchievements: Achievement[];
}

/**
 * unknown for the gamification module.
 */
/**
 * Recent Achievements component.
 */
export function RecentAchievements({ recentAchievements }: RecentAchievementsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="mt-8"
    >
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
          <TrophyIcon className="h-5 w-5 text-yellow-400" />
          Recent Achievements
        </h2>
        <Link
          to="/achievements"
          className="flex items-center gap-1 text-sm text-primary-400 transition-colors hover:text-primary-300"
        >
          View all
          <ArrowRightIcon className="h-4 w-4" />
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6">
        {recentAchievements.map((achievement, index) => (
          <motion.div
            key={achievement.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 + index * 0.05 }}
            whileHover={{ scale: 1.05 }}
            className="cursor-pointer rounded-xl border border-yellow-500/20 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 p-3 text-center"
            onClick={() => HapticFeedback.light()}
          >
            <span className="text-2xl">{achievement.icon}</span>
            <p className="mt-1 truncate text-xs font-medium text-white">{achievement.title}</p>
          </motion.div>
        ))}

        {recentAchievements.length === 0 && (
          <div className="col-span-full py-8 text-center text-gray-500">
            No achievements unlocked yet. Start exploring!
          </div>
        )}
      </div>
    </motion.div>
  );
}
