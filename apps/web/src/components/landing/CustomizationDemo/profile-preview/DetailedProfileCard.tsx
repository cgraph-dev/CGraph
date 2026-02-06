/**
 * DetailedProfileCard - Full profile with stats and badges
 */

import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { CardProps } from './types';
import { MOCK_BADGES, getBadgeGlow } from './constants';
import { AnimatedAvatar } from '../AnimatedAvatar';

export const DetailedProfileCard = memo(function DetailedProfileCard({
  state,
  colors,
  speedMultiplier,
}: CardProps) {
  return (
    <div>
      {/* Holographic shine overlay */}
      <motion.div
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          background:
            'linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.1) 50%, transparent 70%)',
          backgroundSize: '200% 200%',
        }}
        animate={{ backgroundPosition: ['0% 0%', '200% 200%'] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
      />

      {/* Header */}
      <div className="mb-4 flex items-start gap-4">
        <motion.div
          whileHover={{ scale: 1.05, rotate: 5 }}
          transition={{ type: 'spring', stiffness: 300 }}
        >
          <AnimatedAvatar
            borderType={state.avatarBorder}
            borderColor={state.avatarBorderColor}
            size="large"
            speedMultiplier={speedMultiplier}
          />
        </motion.div>
        <div className="flex-1">
          <div className="mb-1 flex items-center gap-2">
            <h3 className="text-xl font-bold text-white">CGraph User</h3>
            {/* Fire-animated Legendary Title Badge */}
            <motion.div
              className="relative overflow-hidden rounded-full px-2.5 py-0.5 text-[11px] font-bold"
              style={{
                background: 'linear-gradient(135deg, #f59e0b, #dc2626)',
              }}
              whileHover={{ scale: 1.05 }}
            >
              {/* Fire flicker effect */}
              <motion.div
                className="pointer-events-none absolute inset-0"
                animate={{
                  boxShadow: [
                    '0 0 15px rgba(245, 158, 11, 0.6), inset 0 0 8px rgba(239, 68, 68, 0.4)',
                    '0 0 25px rgba(245, 158, 11, 0.9), inset 0 0 15px rgba(239, 68, 68, 0.6)',
                    '0 0 15px rgba(245, 158, 11, 0.6), inset 0 0 8px rgba(239, 68, 68, 0.4)',
                  ],
                }}
                transition={{ duration: 1.2, repeat: Infinity }}
              />

              {/* Animated flame particles */}
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="pointer-events-none absolute bottom-0 h-1 w-0.5 rounded-full bg-orange-400"
                  style={{ left: `${25 + i * 25}%` }}
                  animate={{
                    y: [0, -12, 0],
                    opacity: [0, 0.8, 0],
                    scale: [0.5, 1, 0.5],
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    delay: i * 0.2,
                  }}
                />
              ))}

              <span className="relative z-10 flex items-center gap-1">
                <motion.span
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 0.6, repeat: Infinity }}
                >
                  👑
                </motion.span>
                Legendary
              </span>
            </motion.div>
          </div>
          <p className="mb-2 text-sm text-gray-400">Full-stack developer & community enthusiast</p>
          {state.showStatus && (
            <div className="flex items-center gap-1.5 text-sm text-emerald-400">
              <motion.span
                className="relative h-2 w-2 rounded-full bg-emerald-400"
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                {/* Ping effect */}
                <motion.span
                  className="absolute inset-0 rounded-full bg-emerald-400"
                  animate={{ scale: [1, 2, 2], opacity: [0.5, 0, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </motion.span>
              Online
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="mb-4 grid grid-cols-3 gap-3">
        {[
          { label: 'Level', value: '42' },
          { label: 'Posts', value: '1.2K' },
          { label: 'Karma', value: '8.5K' },
        ].map((stat) => (
          <motion.div
            key={stat.label}
            className="rounded-lg bg-white/5 p-2 text-center"
            whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.1)' }}
          >
            <div className="text-lg font-bold" style={{ color: colors.primary }}>
              {stat.value}
            </div>
            <div className="text-xs text-gray-400">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Badges */}
      {state.showBadges && (
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-400">
            <motion.span
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              🏆
            </motion.span>{' '}
            Featured Badges
          </div>
          <div className="flex flex-wrap gap-2">
            {MOCK_BADGES.map((badge, i) => (
              <motion.div
                key={badge.id}
                className="group relative"
                initial={{ opacity: 0, scale: 0, rotate: -180 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                transition={{ delay: i * 0.1, type: 'spring', stiffness: 250 }}
                whileHover={{ scale: 1.15, rotate: 5, zIndex: 10 }}
              >
                {/* Glow ring */}
                <motion.div
                  className="absolute inset-[-4px] rounded-full opacity-0 group-hover:opacity-100"
                  style={{
                    background: `conic-gradient(from 0deg, ${getBadgeGlow(badge.rarity)}, transparent, ${getBadgeGlow(badge.rarity)})`,
                  }}
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                />

                <motion.div
                  className="relative flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-gray-700 to-gray-800 text-xl"
                  animate={{
                    boxShadow: [
                      `0 0 8px ${getBadgeGlow(badge.rarity)}40, 0 0 16px ${getBadgeGlow(badge.rarity)}20`,
                      `0 0 16px ${getBadgeGlow(badge.rarity)}80, 0 0 32px ${getBadgeGlow(badge.rarity)}40`,
                      `0 0 8px ${getBadgeGlow(badge.rarity)}40, 0 0 16px ${getBadgeGlow(badge.rarity)}20`,
                    ],
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  {badge.emoji}

                  {/* Particle effects on hover */}
                  <AnimatePresence>
                    {[0, 1, 2].map((particleIdx) => (
                      <motion.div
                        key={particleIdx}
                        className="pointer-events-none absolute h-1 w-1 rounded-full"
                        style={{ background: getBadgeGlow(badge.rarity) }}
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{
                          opacity: [0, 1, 0],
                          scale: [0, 1.5, 0],
                          x: [0, Math.cos((particleIdx * 2 * Math.PI) / 3) * 20, 0],
                          y: [0, Math.sin((particleIdx * 2 * Math.PI) / 3) * 20, 0],
                        }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          delay: particleIdx * 0.2,
                        }}
                      />
                    ))}
                  </AnimatePresence>
                </motion.div>

                {/* Enhanced tooltip */}
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-black/95 px-3 py-1.5 opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100">
                  <div className="text-xs font-bold text-white">{badge.name}</div>
                  <div
                    className="text-[9px] capitalize"
                    style={{ color: getBadgeGlow(badge.rarity) }}
                  >
                    {badge.rarity}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});
