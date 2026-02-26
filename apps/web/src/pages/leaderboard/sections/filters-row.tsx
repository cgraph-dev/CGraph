/**
 * Time period filters and search controls
 * @module pages/leaderboard/sections
 */

import { motion } from 'framer-motion';
import { MagnifyingGlassIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

import { HapticFeedback } from '@/lib/animations/animation-engine';

import { TIME_PERIODS } from '../constants';
import type { FiltersRowProps } from './types';

/**
 * unknown for the leaderboard module.
 */
/**
 * Filters Row component.
 */
export function FiltersRow({
  timePeriod,
  onTimePeriodChange,
  searchQuery,
  onSearchChange,
  onRefresh,
  isRefreshing,
  currentCategory,
}: FiltersRowProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="mb-8 flex flex-col items-center justify-between gap-4 sm:flex-row"
    >
      {/* Time Period Tabs */}
      <div className="flex items-center gap-1 rounded-2xl border border-dark-700 bg-dark-800/80 p-1.5 backdrop-blur-sm">
        {TIME_PERIODS.map((period) => (
          <motion.button
            key={period.id}
            onClick={() => {
              onTimePeriodChange(period.id);
              HapticFeedback.light();
            }}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all ${
              timePeriod === period.id
                ? `bg-gradient-to-r ${currentCategory.gradient} text-white shadow-md`
                : 'text-gray-400 hover:bg-dark-700/50 hover:text-white'
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {period.icon}
            <span className="hidden sm:inline">{period.name}</span>
          </motion.button>
        ))}
      </div>

      {/* Search & Refresh */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-48 rounded-xl border border-dark-700 bg-dark-800/80 py-2 pl-9 pr-4 text-white placeholder-gray-500 transition-all focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500/50 sm:w-64"
          />
        </div>
        <motion.button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="rounded-xl border border-dark-700 bg-dark-800/80 p-2.5 text-gray-400 transition-all hover:bg-dark-700 hover:text-white disabled:opacity-50"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <ArrowPathIcon className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
        </motion.button>
      </div>
    </motion.div>
  );
}
