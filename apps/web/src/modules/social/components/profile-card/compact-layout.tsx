/**
 * CompactLayout Component
 * Compact layout with badges
 */

import { memo } from 'react';
import { cn } from '@/lib/utils';
import { AvatarBorderRenderer } from '@/modules/social/components/avatar/avatar-border-renderer';
import { getBorderById } from '@/data/avatar-borders';
import { TitleBadge } from '@/modules/gamification/components/title-badge';
import { AnimatedBadgeWithTooltip } from '@/modules/gamification/components/badges/animated-badge';
import type { LayoutProps } from './types';

export const CompactLayout = memo(function CompactLayout({
  user,
  config,
  sizeConfig,
  theme,
}: LayoutProps) {
  const userBorder = user.avatarBorderId ? getBorderById(user.avatarBorderId) : undefined;

  return (
    <div className="flex items-center gap-3">
      <div className="relative">
        <AvatarBorderRenderer
          src={user.avatarUrl}
          alt={user.displayName}
          size={sizeConfig.avatar}
          border={userBorder}
          interactive={false}
        />
        {config.showLevel && (
          <div
            className="absolute -bottom-1 -right-1 rounded px-1.5 py-0.5 text-xs font-bold"
            style={{
              backgroundColor: theme?.colors.accent || '#22c55e',
              color: '#000',
            }}
          >
            {user.level}
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className={cn('truncate font-semibold', sizeConfig.titleSize)}>
            {user.displayName}
          </span>
        </div>
        {config.showTitle && user.equippedTitle && (
          <TitleBadge title={user.equippedTitle.id} size="sm" animated />
        )}
        {config.showBadges && user.equippedBadges && user.equippedBadges.length > 0 && (
          <div className="mt-1 flex gap-1">
            {user.equippedBadges.slice(0, config.maxBadges).map((badge) => (
              <AnimatedBadgeWithTooltip
                key={badge.id}
                achievement={badge}
                size="sm"
                showProgress={false}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
});
