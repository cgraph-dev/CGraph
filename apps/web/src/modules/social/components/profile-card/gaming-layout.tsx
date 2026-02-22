/**
 * GamingLayout Component
 * Gaming-focused layout with level badge and XP bar
 */

import { memo } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { AvatarBorderRenderer } from '@/modules/social/components/avatar/avatar-border-renderer';
import { getBorderById } from '@/data/avatar-borders';
import { TitleBadge } from '@/modules/gamification/components/title-badge';
import { AnimatedBadgeWithTooltip } from '@/modules/gamification/components/badges/animated-badge';
import type { LayoutProps } from './types';

export const GamingLayout = memo(function GamingLayout({
  user,
  config,
  sizeConfig,
  theme,
}: LayoutProps) {
  const xpPercentage = (user.xp / user.xpToNextLevel) * 100;
  const userBorder = user.avatarBorderId ? getBorderById(user.avatarBorderId) : undefined;

  return (
    <div className="space-y-3">
      {/* Avatar with level badge */}
      <div className="flex items-center gap-4">
        <div className="relative">
          <AvatarBorderRenderer
            src={user.avatarUrl}
            alt={user.displayName}
            size={sizeConfig.avatar + 16}
            border={userBorder}
            interactive={false}
          />
          <div
            className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-sm font-bold"
            style={{
              background: `linear-gradient(135deg, ${theme?.colors.primary || '#22c55e'}, ${theme?.colors.accent || '#4ade80'})`,
              boxShadow: `0 0 12px ${theme?.colors.accent || '#22c55e'}`,
            }}
          >
            LVL {user.level}
          </div>
        </div>
        <div className="flex-1">
          <div className={cn('font-bold', sizeConfig.titleSize)}>{user.displayName}</div>
          {config.showTitle && user.equippedTitle && (
            <TitleBadge title={user.equippedTitle.id} size="sm" animated />
          )}
        </div>
      </div>

      {/* XP Bar */}
      <div
        className="relative h-4 overflow-hidden rounded-full"
        style={{ backgroundColor: '#1a1a2e' }}
      >
        <motion.div
          className="absolute inset-y-0 left-0"
          style={{
            background: `linear-gradient(90deg, ${theme?.colors.primary || '#22c55e'}, ${theme?.colors.accent || '#4ade80'})`,
          }}
          initial={{ width: 0 }}
          animate={{ width: `${xpPercentage}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
        <div className="absolute inset-0 flex items-center justify-center text-xs font-bold">
          {user.xp.toLocaleString()} / {user.xpToNextLevel.toLocaleString()}
        </div>
      </div>

      {/* Stats */}
      {config.showStats && (
        <div className="grid grid-cols-3 gap-2">
          <div
            className="rounded p-2 text-center"
            style={{ backgroundColor: theme?.colors.surface + '80' }}
          >
            <div className="text-lg font-bold" style={{ color: theme?.colors.accent }}>
              {user.karma}
            </div>
            <div className="text-xs opacity-60">KARMA</div>
          </div>
          <div
            className="rounded p-2 text-center"
            style={{ backgroundColor: theme?.colors.surface + '80' }}
          >
            <div className="text-lg font-bold" style={{ color: theme?.colors.accent }}>
              {user.streak}🔥
            </div>
            <div className="text-xs opacity-60">STREAK</div>
          </div>
          <div
            className="rounded p-2 text-center"
            style={{ backgroundColor: theme?.colors.surface + '80' }}
          >
            <div className="text-lg font-bold" style={{ color: theme?.colors.accent }}>
              {user.postCount || 0}
            </div>
            <div className="text-xs opacity-60">POSTS</div>
          </div>
        </div>
      )}

      {/* Achievements */}
      {config.showAchievements && user.equippedBadges && user.equippedBadges.length > 0 && (
        <div className="flex justify-center gap-2">
          {user.equippedBadges.slice(0, 5).map((badge) => (
            <AnimatedBadgeWithTooltip
              key={badge.id}
              achievement={badge}
              size="md"
              showProgress={false}
            />
          ))}
        </div>
      )}
    </div>
  );
});
