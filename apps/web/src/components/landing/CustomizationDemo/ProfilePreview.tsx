/**
 * ProfilePreview Component
 *
 * Displays a preview of the user profile with various card styles.
 *
 * @module components/landing/CustomizationDemo/ProfilePreview
 */

import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { DemoState } from './types';
import { themeColors } from './constants';
import { getProfileThemeConfig } from './profileThemes';
import { AnimatedAvatar } from './AnimatedAvatar';

interface ProfilePreviewProps {
  state: DemoState;
  onChange: (updates: Partial<DemoState>) => void;
}

// Meaningful themed badges with cool visuals
const mockBadges = [
  {
    id: '1',
    emoji: '🛡️',
    name: 'Guardian Shield',
    rarity: 'legendary',
    description: 'Protected 1000+ users',
    theme: 'defensive',
  },
  {
    id: '2',
    emoji: '⚔️',
    name: 'Blade Master',
    rarity: 'epic',
    description: 'Top 100 Contributors',
    theme: 'combat',
  },
  {
    id: '3',
    emoji: '🎩',
    name: 'Arcane Sage',
    rarity: 'mythic',
    description: 'Answered 500+ questions',
    theme: 'magic',
  },
  {
    id: '4',
    emoji: '👑',
    name: 'Royal Crown',
    rarity: 'legendary',
    description: 'Community Leader',
    theme: 'prestige',
  },
];

const getBadgeGlow = (rarity: string) => {
  switch (rarity) {
    case 'mythic':
      return '#ec4899'; // Pink for mythic
    case 'legendary':
      return '#f59e0b'; // Gold for legendary
    case 'epic':
      return '#8b5cf6'; // Purple for epic
    case 'rare':
      return '#3b82f6'; // Blue for rare
    case 'uncommon':
      return '#10b981'; // Green for uncommon
    default:
      return '#6b7280'; // Gray for common
  }
};

export const ProfilePreview = memo(function ProfilePreview({
  state,
  onChange: _onChange,
}: ProfilePreviewProps) {
  const colors = themeColors[state.theme];
  const speedMultiplier =
    state.animationSpeed === 'slow' ? 2 : state.animationSpeed === 'fast' ? 0.5 : 1;

  // Get selected profile theme configuration
  const selectedTheme = getProfileThemeConfig(state.selectedProfileThemeId);

  // Use selected theme's background and glow, otherwise fall back to state
  const backgroundStyle = selectedTheme
    ? `linear-gradient(135deg, ${selectedTheme.background.colors.join(', ')})`
    : state.effect === 'glassmorphism'
      ? 'rgba(17, 24, 39, 0.7)'
      : state.effect === 'neon'
        ? 'rgba(0, 0, 0, 0.9)'
        : state.effect === 'holographic'
          ? 'linear-gradient(135deg, rgba(17, 24, 39, 0.8), rgba(30, 41, 59, 0.8))'
          : 'rgba(17, 24, 39, 0.95)';

  const glowColor = selectedTheme?.effects.glow || colors.glow;
  const particleCount = selectedTheme?.effects.particles?.count || 15;

  return (
    <motion.div
      className="relative overflow-hidden rounded-2xl border border-white/10"
      style={{
        background: backgroundStyle,
        backdropFilter: state.blurEnabled ? 'blur(20px)' : 'none',
        boxShadow: state.glowEnabled || selectedTheme ? `0 0 40px ${glowColor}` : 'none',
      }}
      animate={
        state.glowEnabled || selectedTheme
          ? {
              boxShadow: [
                `0 0 30px ${glowColor}`,
                `0 0 50px ${glowColor}`,
                `0 0 30px ${glowColor}`,
              ],
            }
          : {}
      }
      transition={{ duration: 2 * speedMultiplier, repeat: Infinity }}
    >
      {/* Particles overlay */}
      {(state.particlesEnabled || selectedTheme) && (
        <div className="pointer-events-none absolute inset-0">
          {Array.from({ length: particleCount }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute h-1 w-1 rounded-full"
              style={{
                background: selectedTheme?.effects.glow || colors.primary,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [0, -15, 0],
                opacity: [0.3, 0.8, 0.3],
              }}
              transition={{
                duration: (2 + Math.random()) * speedMultiplier,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>
      )}

      {/* Animated background */}
      {(state.animatedBackground || selectedTheme?.background.type === 'animated') && (
        <motion.div
          className="pointer-events-none absolute inset-0"
          style={{
            background: selectedTheme
              ? `linear-gradient(45deg, ${selectedTheme.background.colors[0]}10, ${selectedTheme.background.colors[1]}10, transparent)`
              : `linear-gradient(45deg, ${colors.primary}10, ${colors.secondary}10, transparent)`,
            backgroundSize: '200% 200%',
          }}
          animate={{ backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'] }}
          transition={{ duration: 8 * speedMultiplier, repeat: Infinity }}
        />
      )}

      <div className="relative p-6">
        {/* Minimal Profile Card */}
        {state.profileCardStyle === 'minimal' && (
          <MinimalProfileCard state={state} colors={colors} speedMultiplier={speedMultiplier} />
        )}

        {/* Detailed Profile Card */}
        {state.profileCardStyle === 'detailed' && (
          <DetailedProfileCard state={state} colors={colors} speedMultiplier={speedMultiplier} />
        )}

        {/* Compact Profile Card */}
        {state.profileCardStyle === 'compact' && (
          <CompactProfileCard state={state} colors={colors} speedMultiplier={speedMultiplier} />
        )}

        {/* Expanded Profile Card */}
        {state.profileCardStyle === 'expanded' && (
          <ExpandedProfileCard state={state} colors={colors} speedMultiplier={speedMultiplier} />
        )}

        {/* Gaming Profile Card */}
        {state.profileCardStyle === 'gaming' && (
          <GamingProfileCard state={state} colors={colors} speedMultiplier={speedMultiplier} />
        )}
      </div>
    </motion.div>
  );
});

// =============================================================================
// PROFILE CARD VARIANTS
// =============================================================================

interface CardProps {
  state: DemoState;
  colors: { primary: string; secondary: string; glow: string; name: string };
  speedMultiplier: number;
}

const MinimalProfileCard = memo(function MinimalProfileCard({
  state,
  colors,
  speedMultiplier,
}: CardProps) {
  return (
    <div className="flex items-center gap-4">
      <AnimatedAvatar
        borderType={state.avatarBorder}
        borderColor={state.avatarBorderColor}
        size="medium"
        speedMultiplier={speedMultiplier}
      />
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-bold text-white">CGraph User</h3>
          {/* Electric Title Badge with Animation */}
          <motion.div
            className="relative overflow-hidden rounded-full px-2 py-0.5 text-[10px] font-bold"
            style={{
              background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
            }}
            whileHover={{ scale: 1.05 }}
          >
            {/* Electric spark effect */}
            <motion.div
              className="pointer-events-none absolute inset-0"
              animate={{
                boxShadow: [
                  `0 0 10px ${colors.glow}, inset 0 0 5px ${colors.glow}`,
                  `0 0 20px ${colors.glow}, inset 0 0 10px ${colors.glow}`,
                  `0 0 10px ${colors.glow}, inset 0 0 5px ${colors.glow}`,
                ],
              }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
            <span className="relative z-10 flex items-center gap-0.5">
              <motion.span
                animate={{ rotate: [0, 15, -15, 0] }}
                transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
              >
                ⚡
              </motion.span>
              Speed Demon
            </span>
          </motion.div>
        </div>
        {state.showStatus && (
          <div className="mt-1 flex items-center gap-1.5 text-sm text-emerald-400">
            <motion.span
              className="h-2 w-2 rounded-full bg-emerald-400"
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            ></motion.span>
            Online
          </div>
        )}
      </div>
    </div>
  );
});

const DetailedProfileCard = memo(function DetailedProfileCard({
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
                  style={{
                    left: `${25 + i * 25}%`,
                  }}
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
            {mockBadges.map((badge, i) => (
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

const CompactProfileCard = memo(function CompactProfileCard({ state, speedMultiplier }: CardProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <AnimatedAvatar
          borderType={state.avatarBorder}
          borderColor={state.avatarBorderColor}
          size="small"
          speedMultiplier={speedMultiplier}
        />
        <div>
          <h3 className="text-sm font-bold text-white">CGraph User</h3>
          <p className="text-xs text-gray-400">Level 42</p>
        </div>
      </div>
      {state.showBadges && (
        <div className="flex gap-1">
          {mockBadges.slice(0, 3).map((badge) => (
            <div
              key={badge.id}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-gray-700 to-gray-800 text-sm"
            >
              {badge.emoji}
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

const ExpandedProfileCard = memo(function ExpandedProfileCard({
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
            {mockBadges.map((badge, i) => (
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

const GamingProfileCard = memo(function GamingProfileCard({
  state,
  colors,
  speedMultiplier,
}: CardProps) {
  return (
    <div>
      {/* Gaming-style header with XP bar */}
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
                Level 42
              </span>
              <span className="text-xs text-gray-500">•</span>
              <span className="text-xs text-gray-400">Legendary Tier</span>
            </div>
          </div>
        </div>

        {/* XP Progress Bar */}
        <div>
          <div className="mb-1 flex justify-between text-xs text-gray-400">
            <span>XP Progress</span>
            <span>8,420 / 10,000</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-gray-700">
            <motion.div
              className="h-full rounded-full"
              style={{
                background: `linear-gradient(90deg, ${colors.primary}, ${colors.secondary})`,
              }}
              initial={{ width: 0 }}
              animate={{ width: '84%' }}
              transition={{ duration: 1, delay: 0.3 }}
            />
          </div>
        </div>
      </div>

      {/* Gaming Stats Grid */}
      <div className="mb-4 grid grid-cols-2 gap-2">
        {[
          { icon: '⚔️', label: 'Victories', value: '234' },
          { icon: '🎯', label: 'Accuracy', value: '92%' },
          { icon: '🔥', label: 'Streak', value: '30 days' },
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
            {mockBadges.map((badge, i) => (
              <motion.div
                key={badge.id}
                className="group relative aspect-square"
                initial={{ opacity: 0, rotate: -180, scale: 0 }}
                animate={{ opacity: 1, rotate: 0, scale: 1 }}
                transition={{ delay: i * 0.1, type: 'spring', stiffness: 200 }}
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
