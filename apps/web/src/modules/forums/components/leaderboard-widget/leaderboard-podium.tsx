/**
 * LeaderboardPodium — Top 3 positions with animated entrance.
 *
 * Shows gold/silver/bronze podium positions in a centered layout:
 * 2nd place (left, shorter) — 1st place (center, tallest) — 3rd place (right, shorter).
 *
 * @module modules/forums/components/leaderboard-widget/leaderboard-podium
 */

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import type { LeaderboardEntry } from '@cgraph/shared-types';
import { RankBadge } from './rank-badge';
import { TrophyIcon, StarIcon } from '@heroicons/react/24/solid';

// ── Types ──────────────────────────────────────────────────────────────

export interface LeaderboardPodiumProps {
  entries: LeaderboardEntry[];
  className?: string;
}

// ── Podium Config ──────────────────────────────────────────────────────

const PODIUM_CONFIG = [
  {
    position: 1,
    order: 1,
    height: 'h-36',
    color: 'from-yellow-500/20 to-yellow-600/10',
    border: 'border-yellow-500/40',
    medal: '🥇',
    medalColor: 'text-yellow-400',
    scale: 1.05,
  },
  {
    position: 0,
    order: 0,
    height: 'h-28',
    color: 'from-gray-400/20 to-gray-500/10',
    border: 'border-gray-400/40',
    medal: '🥈',
    medalColor: 'text-gray-300',
    scale: 1,
  },
  {
    position: 2,
    order: 2,
    height: 'h-24',
    color: 'from-orange-500/20 to-orange-600/10',
    border: 'border-orange-500/40',
    medal: '🥉',
    medalColor: 'text-orange-400',
    scale: 1,
  },
] as const;

// ── Component ──────────────────────────────────────────────────────────

export function LeaderboardPodium({ entries, className = '' }: LeaderboardPodiumProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  if (entries.length === 0) return null;

  // Reorder to: 2nd, 1st, 3rd for podium display
  const podiumOrder = [entries[1], entries[0], entries[2]].filter(Boolean);

  return (
    <div className={`flex items-end justify-center gap-3 py-6 ${className}`}>
      {podiumOrder.map((entry, idx) => {
        const config = PODIUM_CONFIG[idx] ?? PODIUM_CONFIG[0];
        if (!entry) return null;

        return (
          <motion.div
            key={entry.user.id}
            className="flex flex-col items-center"
            initial={{ opacity: 0, scale: 0.7, y: 30 }}
            animate={
              isVisible
                ? { opacity: 1, scale: config.scale, y: 0 }
                : { opacity: 0, scale: 0.7, y: 30 }
            }
            transition={{
              type: 'spring',
              damping: 15,
              stiffness: 120,
              delay: idx * 0.15,
            }}
          >
            {/* Medal */}
            <span className="mb-1 text-2xl">{config.medal}</span>

            {/* Avatar */}
            <div className="relative mb-2">
              {entry.user.avatarUrl ? (
                <img
                  src={entry.user.avatarUrl}
                  alt={entry.user.username}
                  className={`rounded-full object-cover ring-2 ${config.border} ${entry.position === 1 ? 'h-16 w-16' : 'h-12 w-12'}`}
                />
              ) : (
                <div
                  className={`flex items-center justify-center rounded-full bg-dark-600 ring-2 ${config.border} ${entry.position === 1 ? 'h-16 w-16' : 'h-12 w-12'}`}
                >
                  <span className="text-lg font-bold text-gray-400">
                    {entry.user.username?.charAt(0)?.toUpperCase() ?? '?'}
                  </span>
                </div>
              )}

              {/* Crown for 1st */}
              {entry.position === 1 && (
                <motion.div
                  className="absolute -top-3 left-1/2 -translate-x-1/2"
                  initial={{ scale: 0, rotate: -20 }}
                  animate={isVisible ? { scale: 1, rotate: 0 } : {}}
                  transition={{ type: 'spring', delay: 0.5 }}
                >
                  <StarIcon className="h-5 w-5 text-yellow-400 drop-shadow-lg" />
                </motion.div>
              )}
            </div>

            {/* Username */}
            <p className="max-w-[100px] truncate text-center text-sm font-medium text-white">
              {entry.user.displayName || entry.user.username}
            </p>

            {/* Rank badge */}
            {entry.rank && (
              <div className="mt-0.5">
                <RankBadge
                  rankName={entry.rank.name}
                  rankImage={entry.rank.imageUrl}
                  rankColor={entry.rank.color}
                  rank={entry.rank}
                  size="sm"
                />
              </div>
            )}

            {/* Score */}
            <p className="mt-1 text-xs font-semibold text-gray-400">
              {Math.round(entry.score).toLocaleString()} pts
            </p>

            {/* Podium bar */}
            <motion.div
              className={`mt-2 w-20 rounded-t-lg border ${config.border} bg-gradient-to-t ${config.color} ${config.height}`}
              initial={{ height: 0 }}
              animate={isVisible ? { height: 'auto' } : { height: 0 }}
              transition={{ type: 'spring', damping: 20, stiffness: 100, delay: idx * 0.15 + 0.2 }}
            >
              <div className="flex h-full items-center justify-center">
                <span className="text-2xl font-bold text-white/60">#{entry.position}</span>
              </div>
            </motion.div>
          </motion.div>
        );
      })}
    </div>
  );
}

export default LeaderboardPodium;
