/**
 * SocialLayout Component
 * Social-focused layout with mutual friends
 */

import { memo } from 'react';
import { cn } from '@/lib/utils';
import { AvatarBorderRenderer } from '@/modules/social/components/avatar/avatar-border-renderer';
import { getBorderById } from '@/data/avatar-borders';
import { ThemedAvatar } from '@/components/theme/themed-avatar';
import { TitleBadge } from '@/modules/gamification/components/title-badge';
import type { LayoutProps } from './types';

export const SocialLayout = memo(function SocialLayout({
  user,
  config,
  sizeConfig,
  theme,
}: LayoutProps) {
  const userBorder = user.avatarBorderId ? getBorderById(user.avatarBorderId) : undefined;

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center gap-3">
        <AvatarBorderRenderer
          src={user.avatarUrl}
          alt={user.displayName}
          size={sizeConfig.avatar}
          border={userBorder}
          interactive={false}
        />
        <div className="flex-1">
          <div className={cn('font-semibold', sizeConfig.titleSize)}>{user.displayName}</div>
          {config.showTitle && user.equippedTitle && (
            <TitleBadge title={user.equippedTitle.id} size="sm" animated />
          )}
        </div>
      </div>

      {/* Bio */}
      {config.showBio && user.bio && (
        <p className={cn('opacity-80', sizeConfig.textSize)}>{user.bio}</p>
      )}

      {/* Mutual Friends */}
      {config.showMutualFriends && user.mutualFriends && user.mutualFriends.length > 0 && (
        <div>
          <div className="mb-1 text-xs opacity-60">{user.mutualFriends.length} mutual friends</div>
          <div className="flex -space-x-2">
            {user.mutualFriends.slice(0, 5).map((friend) => (
              <ThemedAvatar
                key={friend.id}
                src={friend.avatarUrl}
                alt={friend.username}
                size="xs"
                className="h-6 w-6 border-2"
                style={{ borderColor: theme?.colors.surface }}
              />
            ))}
            {user.mutualFriends.length > 5 && (
              <div
                className="flex h-6 w-6 items-center justify-center rounded-full text-xs"
                style={{ backgroundColor: theme?.colors.accent, color: '#000' }}
              >
                +{user.mutualFriends.length - 5}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Forums in Common */}
      {config.showForumsInCommon && user.forumsInCommon && user.forumsInCommon.length > 0 && (
        <div>
          <div className="mb-1 text-xs opacity-60">
            {user.forumsInCommon.length} forums in common
          </div>
          <div className="flex flex-wrap gap-1">
            {user.forumsInCommon.slice(0, 3).map((forum) => (
              <span
                key={forum.id}
                className="rounded px-2 py-0.5 text-xs"
                style={{
                  backgroundColor: theme?.colors.accent + '22',
                  color: theme?.colors.accent,
                }}
              >
                {forum.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      {config.showRecentActivity && user.recentActivity && user.recentActivity.length > 0 && (
        <div className="text-xs opacity-60">Last active: {user.recentActivity[0]?.description}</div>
      )}
    </div>
  );
});
