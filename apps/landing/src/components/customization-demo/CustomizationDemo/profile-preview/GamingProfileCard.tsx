/**
 * GamingProfileCard - Gaming-themed profile with Pulse reputation
 */

import { memo } from 'react';
import { motion } from 'framer-motion';
import { springs } from '../../animations';
import type { CardProps } from './types';
import { MOCK_BADGES, getBadgeGlow } from './constants';
import { AnimatedAvatar } from '../AnimatedAvatar';

export const GamingProfileCard = memo(function GamingProfileCard({
  state,
  colors,
  speedMultiplier,
}: CardProps) {
  return (
    <div>
      {/* Gaming-style header with Pulse bar */}
      <div className="mb-4">
        <div className="mb-3 flex items-center gap-4">
          <AnimatedAvatar
            borderType={state.avatarBorder}
            borderColor={state.avatarBorderColor}
            size="medium"
            speedMultiplier={speedMultiplier}
          />
          <div className="flex-1">
            <h3 className="mb-1 text-lg font-bold text-white">CGraph User</h3>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold" style={{ color: colors.primary }}>
                Pillar
              </span>
              <span className="text-xs text-gray-500">•</span>
              <span className="text-xs text-gray-400">Legendary Tier</span>
            </div>
          </div>
        </div>

        {/* Pulse Progress Bar */}
        <div>
          <div className="mb-1 flex justify-between text-xs text-gray-400">
            <span>Pulse Reputation</span>
            <span>1,420 / 5,000</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-gray-700">
            <motion.div
              className="h-full rounded-full"
              style={{
                background: `linear-gradient(90deg, ${colors.primary}, ${colors.secondary})`,
              }}
              initial={{ width: 0 }}
              animate={{ width: '28%' }}
              transition={{ duration: 1, delay: 0.3 }}
            />
          </div>
        </div>
      </div>

      {/* Gaming Stats Grid */}
      <div className="mb-4 grid grid-cols-2 gap-2">
        {[
          { icon: '⚔️', label: 'Achievements', value: '24' },
          { icon: '🎯', label: 'Cosmetics', value: '47' },
          { icon: '💎', label: 'Nodes', value: '3,200' },
          { icon: '👑', label: 'Rank', value: '#127' },
        ].map((stat) => (
          <motion.div
            key={stat.label}
            className="rounded-lg border border-white/10 bg-white/5 p-3"
            whileHover={{ scale: 1.05, borderColor: colors.primary + '40' }}
          >
            <div className="mb-1 text-lg">{stat.icon}</div>
            <div className="text-sm font-bold text-white">{stat.value}</div>
            <div className="text-xs text-gray-400">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Achievement Badges */}
      {state.showBadges && (
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-400">
            <span>🏆</span> Recent Achievements
          </div>
          <div className="grid grid-cols-4 gap-2">
            {MOCK_BADGES.map((badge, i) => (
              <motion.div
                key={badge.id}
                className="group relative aspect-square"
                initial={{ opacity: 0, rotate: -180, scale: 0 }}
                animate={{ opacity: 1, rotate: 0, scale: 1 }}
                transition={{ delay: i * 0.1, ...springs.dramatic }}
                whileHover={{ scale: 1.15, rotate: 10 }}
              >
                <motion.div
                  className="flex h-full w-full items-center justify-center rounded-lg bg-gradient-to-br from-gray-700 to-gray-800 text-2xl"
                  animate={{
                    boxShadow: [
                      `0 0 8px ${getBadgeGlow(badge.rarity)}40`,
                      `0 0 16px ${getBadgeGlow(badge.rarity)}80`,
                      `0 0 8px ${getBadgeGlow(badge.rarity)}40`,
                    ],
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  {badge.emoji}
                </motion.div>
                {/* Tooltip */}
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-black/90 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
                  {badge.name}
                </div>
                {/* Rarity indicator */}
                <div
                  className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-gray-900"
                  style={{ backgroundColor: getBadgeGlow(badge.rarity) }}
                />
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});
