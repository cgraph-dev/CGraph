/**
 * StatsGrid - karma and streak stats display
 */

import { motion } from 'framer-motion';
import { GlassCard } from '@/shared/components/ui';

interface StatsGridProps {
  karma: number;
  streak: number;
}

const STATS_CONFIG = [
  {
    key: 'karma',
    label: 'Karma',
    icon: '🏆',
    color: 'from-yellow-500 to-orange-500',
  },
  {
    key: 'streak',
    label: 'Streak',
    icon: '🔥',
    color: 'from-red-500 to-pink-500',
  },
] as const;

/**
 * unknown for the chat module.
 */
/**
 * Stats Grid component.
 */
export function StatsGrid({ karma, streak }: StatsGridProps) {
  const values = { karma, streak };

  return (
    <div className="grid grid-cols-2 gap-2">
      {STATS_CONFIG.map((stat, index) => (
        <motion.div
          key={stat.key}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 + index * 0.05 }}
        >
          <GlassCard variant="crystal" className="p-3 text-center">
            <div className="mb-1 text-2xl">{stat.icon}</div>
            <div
              className={`bg-gradient-to-r text-2xl font-bold ${stat.color} bg-clip-text text-transparent`}
            >
              {values[stat.key].toLocaleString()}
            </div>
            <div className="text-xs font-medium text-gray-400">{stat.label}</div>
          </GlassCard>
        </motion.div>
      ))}
    </div>
  );
}
