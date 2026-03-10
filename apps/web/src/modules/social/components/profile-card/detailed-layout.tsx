/**
 * DetailedLayout Component
 * Full-featured layout with stats and XP bar
 */

import { memo } from 'react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { AvatarBorderRenderer } from '@/modules/social/components/avatar/avatar-border-renderer';
import { getBorderById } from '@/data/avatar-borders';
import { PulseDots } from '@/modules/pulse/components/pulse-dots';
import { StatItem } from './stat-item';
import type { LayoutProps } from './types';
import { tweens } from '@/lib/animation-presets';

export const DetailedLayout = memo(function DetailedLayout({
  user,
  config,
  sizeConfig,
  theme,
}: LayoutProps) {
  const xpPercentage = (user.xp / user.xpToNextLevel) * 100;
  const userBorder = user.avatarBorderId ? getBorderById(user.avatarBorderId) : undefined;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start gap-4">
        <AvatarBorderRenderer
          src={user.avatarUrl}
          alt={user.displayName}
          size={sizeConfig.avatar}
          border={userBorder}
          interactive={false}
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={cn('font-bold', sizeConfig.titleSize)}>{user.displayName}</span>
            <span className="text-sm opacity-60">@{user.username}</span>
          </div>
          {/* TODO(phase-26): Rewire — gamification components deleted */}
          {config.showTitle && user.equippedTitle && (
            <span className="text-xs opacity-60">{user.equippedTitle.id}</span>
          )}
          {config.showBio && user.bio && (
            <p className={cn('mt-2 line-clamp-2 opacity-80', sizeConfig.textSize)}>{user.bio}</p>
          )}
        </div>
      </div>

      {/* Level & XP */}
      {(config.showLevel || config.showXp) && (
        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span>Level {user.level}</span>
            <span>
              {user.xp.toLocaleString()} / {user.xpToNextLevel.toLocaleString()} XP
            </span>
          </div>
          <div
            className="h-2 overflow-hidden rounded-full"
            style={{ backgroundColor: theme?.colors.accent + '33' || '#22c55e33' }}
          >
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: theme?.colors.accent || '#22c55e' }}
              initial={{ width: 0 }}
              animate={{ width: `${xpPercentage}%` }}
              transition={tweens.smooth}
            />
          </div>
        </div>
      )}

      {/* Stats row */}
      {config.showStats && (
        <div className="grid grid-cols-4 gap-2 text-center">
          {config.showKarma && (
            <StatItem label="Karma" value={user.karma} color={theme?.colors.accent} />
          )}
          {config.showStreak && (
            <StatItem label="Streak" value={user.streak} suffix="🔥" color={theme?.colors.accent} />
          )}
          <StatItem label="Posts" value={user.postCount || 0} color={theme?.colors.accent} />
          <StatItem label="Friends" value={user.friendCount || 0} color={theme?.colors.accent} />
        </div>
      )}

      {/* Top Communities by Pulse */}
      {user.topCommunities && user.topCommunities.length > 0 && (
        <div>
          <div className="mb-1 text-xs opacity-60">Top Communities</div>
          <div className="space-y-1">
            {user.topCommunities.slice(0, 3).map((community) => (
              <div key={community.forumId} className="flex items-center justify-between">
                <span className="truncate text-sm">{community.forumName}</span>
                <PulseDots
                  score={community.score}
                  tier={community.tier}
                  size="sm"
                  showLabel={false}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Badges */}
      {/* TODO(phase-26): Rewire — gamification components deleted */}
      {config.showBadges && user.equippedBadges && user.equippedBadges.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {user.equippedBadges.slice(0, config.maxBadges).map((badge) => (
            <span key={badge.id} className="rounded bg-white/10 px-2 py-0.5 text-xs">
              {badge.id}
            </span>
          ))}
        </div>
      )}

      {/* Social Links */}
      {config.showSocialLinks && user.socialLinks && user.socialLinks.length > 0 && (
        <div className="flex gap-2">
          {user.socialLinks.map((link) => (
            <a
              key={link.platform}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm opacity-60 transition-opacity hover:opacity-100"
            >
              {link.platform}
            </a>
          ))}
        </div>
      )}
    </div>
  );
});
