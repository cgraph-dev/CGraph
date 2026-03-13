/**
 * CreatorLayout Component
 * Creator-focused centered layout
 */

import { memo } from 'react';
import { cn } from '@/lib/utils';
import { AvatarBorderRenderer } from '@/modules/social/components/avatar/avatar-border-renderer';
import { getBorderById } from '@/data/avatar-borders';
import { InlineTitle } from '@/shared/components/ui';
import type { LayoutProps } from './types';

export const CreatorLayout = memo(function CreatorLayout({
  user,
  config,
  sizeConfig,
  theme,
}: LayoutProps) {
  const userBorder = user.avatarBorderId ? getBorderById(user.avatarBorderId) : undefined;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="text-center">
        <AvatarBorderRenderer
          src={user.avatarUrl}
          alt={user.displayName}
          size={sizeConfig.avatar + 24}
          border={userBorder}
          interactive={false}
          className="mx-auto"
        />
        <div className={cn('mt-2 font-bold', sizeConfig.titleSize)}>{user.displayName}</div>
        {user.equippedTitle && (
          <div className="mt-1 flex justify-center">
            <InlineTitle titleId={user.equippedTitle.id} size="sm" />
          </div>
        )}
      </div>

      {/* Bio */}
      {config.showBio && user.bio && (
        <p className={cn('text-center opacity-80', sizeConfig.textSize)}>{user.bio}</p>
      )}

      {/* Creator Stats */}
      {config.showStats && (
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-xl font-bold" style={{ color: theme?.colors.accent }}>
              {user.postCount?.toLocaleString() || 0}
            </div>
            <div className="text-xs opacity-60">Posts</div>
          </div>
          <div>
            <div className="text-xl font-bold" style={{ color: theme?.colors.accent }}>
              {user.karma.toLocaleString()}
            </div>
            <div className="text-xs opacity-60">Karma</div>
          </div>
          <div>
            <div className="text-xl font-bold" style={{ color: theme?.colors.accent }}>
              {user.friendCount?.toLocaleString() || 0}
            </div>
            <div className="text-xs opacity-60">Followers</div>
          </div>
        </div>
      )}

      {/* Badges */}
      {config.showBadges && user.equippedBadges && user.equippedBadges.length > 0 && (
        <div className="flex flex-wrap justify-center gap-2">
          {user.equippedBadges.slice(0, config.maxBadges).map((badge) => (
            <span
              key={badge.id}
              className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/70"
            >
              <span>{badge.icon}</span>
              <span>{badge.title}</span>
            </span>
          ))}
        </div>
      )}

      {/* Social Links */}
      {config.showSocialLinks && user.socialLinks && user.socialLinks.length > 0 && (
        <div className="flex justify-center gap-3">
          {user.socialLinks.map((link) => (
            <a
              key={link.platform}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full p-2 transition-colors"
              style={{
                backgroundColor: theme?.colors.accent + '22',
                color: theme?.colors.accent,
              }}
            >
              {link.platform}
            </a>
          ))}
        </div>
      )}
    </div>
  );
});
