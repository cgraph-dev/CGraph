import { motion } from 'framer-motion';
import { GlassCard } from '@/shared/components/ui';
import type { LeaderboardsSectionProps } from './types';

export function LeaderboardsSection({
  entries,
  leaderboardType,
  onTypeChange,
}: LeaderboardsSectionProps) {
  return (
    <div className="space-y-4">
      {/* Leaderboard Type Selector */}
      <div className="flex gap-2">
        {['global', 'friends', 'weekly'].map((type) => (
          <button
            key={type}
            onClick={() => onTypeChange(type as typeof leaderboardType)}
            className={`rounded-lg px-4 py-2 font-medium transition-all ${
              leaderboardType === type
                ? 'bg-primary-600 text-white'
                : 'bg-white/5 text-white/60 hover:bg-white/10'
            }`}
          >
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </button>
        ))}
      </div>

      {/* Leaderboard List */}
      <div className="space-y-2">
        {entries.map((entry, index) => (
          <motion.div
            key={entry.userId}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <GlassCard
              variant={entry.isCurrentUser ? 'neon' : 'crystal'}
              glow={entry.isCurrentUser}
              className={`p-4 ${entry.isCurrentUser ? 'ring-2 ring-primary-500' : ''}`}
            >
              <div className="flex items-center gap-4">
                {/* Rank Badge */}
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full font-bold ${
                    entry.rank === 1
                      ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-white'
                      : entry.rank === 2
                        ? 'bg-gradient-to-br from-gray-300 to-gray-500 text-white'
                        : entry.rank === 3
                          ? 'bg-gradient-to-br from-orange-400 to-orange-600 text-white'
                          : 'bg-dark-700 text-white/60'
                  }`}
                >
                  #{entry.rank}
                </div>

                {/* User Info */}
                <div className="flex-1">
                  <p className="font-medium text-white">
                    {entry.displayName}
                    {entry.isCurrentUser && (
                      <span className="ml-2 rounded-full bg-primary-600 px-2 py-0.5 text-xs">
                        You
                      </span>
                    )}
                  </p>
                  <p className="text-sm text-white/60">@{entry.username}</p>
                </div>

                {/* Level & XP */}
                <div className="text-right">
                  <p className="text-lg font-bold text-white">Level {entry.level}</p>
                  <p className="text-sm text-white/60">{entry.xp.toLocaleString()} XP</p>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
