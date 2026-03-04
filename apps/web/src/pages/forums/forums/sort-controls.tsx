/**
 * Sort controls component for Forums page
 * @module pages/forums/forums/sort-controls
 */

import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { TrophyIcon, SparklesIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import { sortOptions, timeRangeOptions } from './constants';
import type { SortControlsProps } from './types';

/**
 * unknown for the forums module.
 */
/**
 * Sort Controls component.
 */
export function SortControls({
  sortBy,
  timeRange,
  showSortMenu,
  showTimeMenu,
  isAuthenticated,
  onSortChange,
  onTimeRangeChange,
  onToggleSortMenu,
  onToggleTimeMenu,
  onCloseSortMenu,
  onCloseTimeMenu,
  onNavigateToCreateForum,
}: SortControlsProps) {
  return (
    <div className="sticky top-0 z-10 border-b border-primary-500/20 bg-[rgb(30,32,40)]/[0.80] px-4 py-3 backdrop-blur-xl">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-primary-500/5 via-transparent to-purple-500/5" />

      <div className="relative z-10 mx-auto flex max-w-4xl items-center gap-4">
        {/* Quick Actions */}
        <div className="mr-auto flex items-center gap-2">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link
              to="/forums/leaderboard"
              onClick={() => HapticFeedback.light()}
              className="flex items-center gap-2 rounded-full bg-gradient-to-r from-yellow-600/80 to-orange-600/80 px-3 py-1.5 text-sm font-medium text-white shadow-sm transition-all hover:from-yellow-500 hover:to-orange-500 hover:shadow-yellow-500/20"
              style={{ boxShadow: '0 0 15px rgba(245, 158, 11, 0.2)' }}
            >
              <TrophyIcon className="h-4 w-4" />
              Competition
            </Link>
          </motion.div>

          {isAuthenticated && (
            <motion.button
              onClick={() => {
                HapticFeedback.light();
                onNavigateToCreateForum();
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 rounded-full bg-gradient-to-r from-primary-600 to-purple-600 px-3 py-1.5 text-sm font-medium text-white transition-all hover:from-primary-500 hover:to-purple-500"
              style={{ boxShadow: '0 0 15px rgba(16, 185, 129, 0.2)' }}
            >
              <SparklesIcon className="h-4 w-4" />
              Create Forum
            </motion.button>
          )}
        </div>

        {/* Sort Dropdown */}
        <div className="relative">
          <button
            onClick={onToggleSortMenu}
            className="flex items-center gap-2 rounded-full bg-white/[0.04] px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-white/[0.08]"
          >
            {sortOptions.find((s) => s.value === sortBy)?.icon && (
              <span className="h-4 w-4">
                {(() => {
                  const Icon = sortOptions.find((s) => s.value === sortBy)!.icon;
                  return <Icon className="h-4 w-4" />;
                })()}
              </span>
            )}
            {sortOptions.find((s) => s.value === sortBy)?.label}
            <ChevronDownIcon className="h-4 w-4" />
          </button>

          {showSortMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={onCloseSortMenu} />
              <div className="absolute left-0 top-full z-20 mt-1 rounded-lg border border-white/[0.06] bg-white/[0.04] py-1 shadow-lg">
                {sortOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      onSortChange(option.value);
                      onCloseSortMenu();
                    }}
                    className={`flex w-full items-center gap-2 px-4 py-2 transition-colors hover:bg-white/[0.08] ${
                      sortBy === option.value ? 'text-primary-400' : 'text-white'
                    }`}
                  >
                    <option.icon className="h-4 w-4" />
                    {option.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Time Range (only for Top) */}
        {sortBy === 'top' && (
          <div className="relative">
            <button
              onClick={onToggleTimeMenu}
              className="flex items-center gap-2 rounded-full bg-white/[0.04] px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-white/[0.08]"
            >
              {timeRangeOptions.find((t) => t.value === timeRange)?.label}
              <ChevronDownIcon className="h-4 w-4" />
            </button>

            {showTimeMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={onCloseTimeMenu} />
                <div className="absolute left-0 top-full z-20 mt-1 rounded-lg border border-white/[0.06] bg-white/[0.04] py-1 shadow-lg">
                  {timeRangeOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        onTimeRangeChange(option.value);
                        onCloseTimeMenu();
                      }}
                      className={`w-full px-4 py-2 text-left transition-colors hover:bg-white/[0.08] ${
                        timeRange === option.value ? 'text-primary-400' : 'text-white'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
