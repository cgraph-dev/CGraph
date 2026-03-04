/**
 * Rankings list component for leaderboard entries
 * @module pages/leaderboard/sections
 */

import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { BoltIcon, StarIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

import { AnimatedAvatar } from '@/shared/components/ui';

import { formatValue, getRankChange, getRankConfig } from '../utils';
import type { RankingsListProps } from './types';

/**
 * unknown for the leaderboard module.
 */
/**
 * Rankings List component.
 */
export function RankingsList({ entries, currentUserId, currentCategory, page }: RankingsListProps) {
  const navigate = useNavigate();
  const displayEntries = page === 1 ? entries.slice(3) : entries;

  return (
    <div className="divide-y divide-dark-800/50">
      <AnimatePresence mode="popLayout">
        {displayEntries.map((entry, index) => {
          const isCurrentUser = currentUserId === entry.userId;
          const config = getRankConfig(entry.rank);

          return (
            <motion.div
              key={entry.userId}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ delay: index * 0.02 }}
              onClick={() => navigate(`/profile/${entry.userId}`)}
              className={`group flex cursor-pointer items-center gap-3 p-4 transition-all hover:bg-dark-800/50 sm:gap-4 ${
                isCurrentUser
                  ? `border-l-4 border-primary-500 bg-gradient-to-r from-primary-500/10 to-transparent`
                  : ''
              }`}
            >
              {/* Rank */}
              <div className="w-10 shrink-0 text-center sm:w-14">
                <span
                  className={`text-base font-bold sm:text-lg ${entry.rank <= 3 ? config.text : 'text-gray-400'}`}
                >
                  #{entry.rank}
                </span>
              </div>

              {/* Rank Change */}
              <div className="w-14 shrink-0 sm:w-16">
                {getRankChange(entry.rank, entry.previousRank)}
              </div>

              {/* Avatar */}
              <div className="shrink-0">
                <AnimatedAvatar
                  src={entry.avatarUrl}
                  alt={entry.displayName || entry.username}
                  size="md"
                  showStatus={entry.isOnline}
                  statusType={entry.isOnline ? 'online' : 'offline'}
                />
              </div>

              {/* User Info */}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`truncate font-semibold ${isCurrentUser ? 'text-primary-400' : 'text-white transition-colors group-hover:text-primary-300'}`}
                  >
                    {entry.displayName || entry.username}
                  </span>
                  {entry.isPremium && <BoltIcon className="h-4 w-4 shrink-0 text-yellow-400" />}
                  {entry.isVerified && <StarIcon className="h-4 w-4 shrink-0 text-primary-400" />}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span>Level {entry.level}</span>
                  {entry.title && (
                    <>
                      <span>•</span>
                      <span className="text-primary-400/70">{entry.title}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Value */}
              <div className="shrink-0 text-right">
                <p
                  className={`bg-gradient-to-r text-base font-bold sm:text-lg ${currentCategory.gradient} bg-clip-text text-transparent`}
                >
                  {formatValue(entry.value)}
                </p>
                <p className="hidden text-xs text-gray-500 sm:block">
                  {currentCategory.description}
                </p>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* Empty State */}
      {displayEntries.length === 0 && (
        <div className="py-16 text-center">
          <MagnifyingGlassIcon className="mx-auto mb-4 h-12 w-12 text-gray-600" />
          <p className="text-gray-400">No users found</p>
        </div>
      )}
    </div>
  );
}
