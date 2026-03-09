/**
 * MinimalLayout Component
 * Simple avatar + name layout
 */

import { memo } from 'react';
import { cn } from '@/lib/utils';
import { AvatarBorderRenderer } from '@/modules/social/components/avatar/avatar-border-renderer';
import { getBorderById } from '@/data/avatar-borders';
import type { LayoutProps } from './types';

export const MinimalLayout = memo(function MinimalLayout({
  user,
  config,
  sizeConfig,
  theme: _theme,
}: LayoutProps) {
  const userBorder = user.avatarBorderId ? getBorderById(user.avatarBorderId) : undefined;

  return (
    <div className="flex items-center gap-3">
      <AvatarBorderRenderer
        src={user.avatarUrl}
        alt={user.displayName}
        size={sizeConfig.avatar}
        border={userBorder}
        interactive={false}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className={cn('truncate font-semibold', sizeConfig.titleSize)}>
            {user.displayName}
          </span>
        </div>
        {/* TODO(phase-26): Rewire — gamification components deleted */}
        {config.showTitle && user.equippedTitle && (
          <span className="text-xs opacity-60">{user.equippedTitle.id}</span>
        )}
      </div>
    </div>
  );
});
