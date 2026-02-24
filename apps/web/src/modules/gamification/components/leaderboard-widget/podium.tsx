/**
 * Podium Component
 *
 * Displays top 3 users in a podium layout.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { ThemedAvatar } from '@/components/theme/themed-avatar';
import { RANK_COLORS } from './constants';
import { formatScore } from './utils';
import type { PodiumProps, LeaderboardEntry } from './types';
import { tweens, loop } from '@/lib/animation-presets';

export function Podium({ entries, onUserClick }: PodiumProps) {
  const top3 = entries.slice(0, 3);
  if (top3.length < 3) return null;

  const second = top3[1];
  const first = top3[0];
  const third = top3[2];

  if (!first || !second || !third) return null;

  // Reorder for podium display: [2nd, 1st, 3rd]
  const podiumOrder = [second, first, third];
  const heights = ['h-24', 'h-32', 'h-20'];

  return (
    <div className="mb-6 flex items-end justify-center gap-4">
      {podiumOrder.map((entry, index) => {
        const actualRank = index === 0 ? 2 : index === 1 ? 1 : 3;
        return (
          <motion.div
            key={entry.userId}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex flex-col items-center"
            onClick={() => onUserClick?.(entry.userId)}
          >
            {/* Avatar */}
            <div className="relative mb-2 cursor-pointer">
              <ThemedAvatar
                src={entry.avatarUrl}
                alt={entry.displayName || entry.username}
                size={index === 1 ? 'large' : 'medium'}
                className="ring-2"
                // type assertion: CSS custom property requires CSSProperties widening
                style={{ '--tw-ring-color': RANK_COLORS[actualRank] } as React.CSSProperties}
                avatarBorderId={
                  entry.avatarBorderId ??
                  (entry as LeaderboardEntry & { avatar_border_id?: string | null }) // type assertion: extending entry with optional field
                    .avatar_border_id
                }
              />
              {actualRank === 1 && (
                <motion.div
                  className="absolute -top-3 left-1/2 -translate-x-1/2"
                  animate={{ y: [0, -4, 0] }}
                  transition={loop(tweens.verySlow)}
                >
                  <span className="text-2xl">👑</span>
                </motion.div>
              )}
            </div>

            {/* Username */}
            <span className="max-w-[80px] truncate text-sm font-medium">
              {entry.displayName || entry.username}
            </span>
            <span className="text-xs text-gray-400">Lvl {entry.level}</span>

            {/* Podium */}
            <motion.div
              className={`w-20 ${heights[index]} mt-2 flex items-center justify-center rounded-t-lg`}
              style={{
                background: `linear-gradient(180deg, ${RANK_COLORS[actualRank]}40 0%, ${RANK_COLORS[actualRank]}20 100%)`,
                borderTop: `3px solid ${RANK_COLORS[actualRank]}`,
              }}
              initial={{ height: 0 }}
              animate={{ height: 'auto' }}
              transition={{ ...tweens.moderate, delay: 0.3 + index * 0.1 }}
            >
              <div className="text-center">
                <div className="text-2xl font-bold" style={{ color: RANK_COLORS[actualRank] }}>
                  {actualRank}
                </div>
                <div className="text-sm font-medium">{formatScore(entry.score)}</div>
              </div>
            </motion.div>
          </motion.div>
        );
      })}
    </div>
  );
}
