/**
 * ExpandedProfileCard - Full-width profile with cover image
 */

import { memo } from 'react';
import { motion } from 'framer-motion';
import type { CardProps } from './types';
import { MOCK_BADGES } from './constants';
import { AnimatedAvatar } from '../AnimatedAvatar';

export const ExpandedProfileCard = memo(function ExpandedProfileCard({
  state,
  colors,
  speedMultiplier,
}: CardProps) {
  return (
    <div className="space-y-4">
      {/* Cover Image */}
      <motion.div
        className="relative -m-6 mb-2 h-24 overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
        }}
        animate={{ backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'] }}
        transition={{ duration: 10, repeat: Infinity }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-gray-900/50"></div>
      </motion.div>

      {/* Avatar overlapping cover */}
      <div className="relative -mt-12 mb-2 flex justify-center">
        <AnimatedAvatar
          borderType={state.avatarBorder}
          borderColor={state.avatarBorderColor}
          size="large"
          speedMultiplier={speedMultiplier}
        />
      </div>

      {/* Content */}
      <div className="text-center">
        <h3 className="mb-1 text-xl font-bold text-white">CGraph User</h3>
        <p className="mb-3 text-sm text-gray-400">Full-stack developer & community enthusiast</p>
        {state.showStatus && (
          <div className="mb-3 flex items-center justify-center gap-1.5 text-sm text-emerald-400">
            <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
            Online
          </div>
        )}

        {/* Stats */}
        <div className="mb-4 grid grid-cols-4 gap-2">
          {[
            { label: 'Level', value: '42' },
            { label: 'Posts', value: '1.2K' },
            { label: 'Karma', value: '8.5K' },
            { label: 'Streak', value: '30d' },
          ].map((stat) => (
            <div key={stat.label} className="rounded-lg bg-white/5 p-2">
              <div className="text-base font-bold" style={{ color: colors.primary }}>
                {stat.value}
              </div>
              <div className="text-[10px] text-gray-400">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Badges */}
        {state.showBadges && (
          <div className="flex justify-center gap-2">
            {MOCK_BADGES.map((badge, i) => (
              <motion.div
                key={badge.id}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-gray-700 to-gray-800 text-xl"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ scale: 1.2 }}
              >
                {badge.emoji}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
});
