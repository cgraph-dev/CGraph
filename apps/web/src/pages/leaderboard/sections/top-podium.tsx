/**
 * Top 3 podium display component
 * @module pages/leaderboard/sections
 */

import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { BoltIcon, StarIcon } from '@heroicons/react/24/outline';

import { AnimatedAvatar } from '@/shared/components/ui';

import { formatValue, getRankConfig } from '../utils';
import type { PodiumProps } from './types';
import { tweens, loop } from '@/lib/animation-presets';

/**
 * unknown for the leaderboard module.
 */
/**
 * Top Podium component.
 */
export function TopPodium({ entries }: PodiumProps) {
  const navigate = useNavigate();

  if (entries.length < 3) return null;

  return (
    <div className="relative border-b border-dark-700/50 bg-gradient-to-b from-dark-800/50 to-transparent px-4 py-8">
      {/* Spotlights */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-0 h-96 w-96 -translate-x-1/2 rounded-full bg-yellow-500/10 blur-3xl" />
      </div>

      <div className="relative flex items-end justify-center gap-4 sm:gap-8">
        {[1, 0, 2].map((index) => {
          const entry = entries[index];
          if (!entry) return null;
          const config = getRankConfig(entry.rank);
          const isFirst = entry.rank === 1;
          const podiumHeight = isFirst ? 'h-36' : entry.rank === 2 ? 'h-28' : 'h-20';

          return (
            <motion.div
              key={entry.userId}
              initial={{ opacity: 0, y: 50, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{
                delay: 0.3 + index * 0.15,
                type: 'spring',
                stiffness: 100,
              }}
              whileHover={{ y: -8, scale: 1.02 }}
              onClick={() => navigate(`/profile/${entry.userId}`)}
              className={`flex cursor-pointer flex-col items-center text-center ${
                isFirst ? 'order-2' : index === 0 ? 'order-1' : 'order-3'
              }`}
            >
              {/* Avatar Section */}
              <div className="relative mb-2">
                {/* Crown for #1 */}
                {config.crown && (
                  <motion.div
                    className="absolute -top-8 left-1/2 z-10 -translate-x-1/2"
                    animate={{
                      y: [0, -5, 0],
                      rotate: [0, 5, -5, 0],
                    }}
                    transition={loop(tweens.ambient)}
                  >
                    <span className="text-3xl drop-shadow-lg">👑</span>
                  </motion.div>
                )}

                {/* Glow Effect */}
                <motion.div
                  className={`absolute inset-0 rounded-full blur-xl ${config.bg}`}
                  animate={{
                    opacity: [0.5, 0.8, 0.5],
                    scale: [1, 1.1, 1],
                  }}
                  transition={loop(tweens.ambient)}
                  style={{ boxShadow: `0 0 40px ${config.glowColor}` }}
                />

                <div
                  className={`relative rounded-full p-1 ${config.bg} border-2 ${config.border}`}
                  style={{ boxShadow: `0 0 30px ${config.glowColor}` }}
                >
                  <AnimatedAvatar
                    src={entry.avatarUrl}
                    alt={entry.displayName || entry.username}
                    size={isFirst ? '2xl' : 'xl'}
                    showStatus={entry.isOnline}
                    statusType={entry.isOnline ? 'online' : 'offline'}
                  />
                </div>

                {/* Medal Badge */}
                <motion.div
                  className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-2xl drop-shadow-lg"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={loop(tweens.verySlow)}
                >
                  {config.medal}
                </motion.div>
              </div>

              {/* User Info */}
              <div className="mt-4">
                <div className="mb-1 flex items-center justify-center gap-1">
                  <p className={`max-w-[80px] truncate font-bold sm:max-w-[120px] ${config.text}`}>
                    {entry.displayName || entry.username}
                  </p>
                  {entry.isPremium && <BoltIcon className="h-4 w-4 text-yellow-400" />}
                  {entry.isVerified && <StarIcon className="h-4 w-4 text-primary-400" />}
                </div>
                {entry.title && (
                  <p className="mb-1 text-xs font-medium text-primary-400">{entry.title}</p>
                )}
                <p className="text-xs text-gray-500">Level {entry.level}</p>
                <p className={`text-lg font-black ${config.text} mt-1`}>
                  {formatValue(entry.value)}
                </p>
              </div>

              {/* Podium */}
              <motion.div
                className={`${podiumHeight} mt-3 w-20 rounded-t-lg sm:w-28 ${config.bg} border-x-2 border-t-2 ${config.border} flex items-start justify-center pt-2`}
                initial={{ height: 0 }}
                animate={{ height: 'auto' }}
                transition={{ ...tweens.standard, delay: 0.5 + index * 0.1 }}
              >
                <span className={`text-3xl font-black ${config.text}`}>#{entry.rank}</span>
              </motion.div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
