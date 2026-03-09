/**
 * Full Profile Card Component
 *
 * Detailed modal-style profile card (600px width)
 */

import { memo } from 'react';
import { Link } from 'react-router-dom';
import {
  XMarkIcon,
  ChatBubbleLeftRightIcon,
  UserPlusIcon,
  EyeIcon,
  ShieldExclamationIcon,
} from '@heroicons/react/24/outline';
import { useAuthStore } from '@/modules/auth/store';
// TODO(phase-26): Rewire — gamification stores deleted
import { getBorderById } from '@/data/avatar-borders';
import { AvatarBorderRenderer } from '@/modules/social/components/avatar/avatar-border-renderer';
import { TitleBadge } from '@/modules/gamification/components/title-badge';
import { BADGE_DISPLAY_MAP } from '@/modules/settings/store/customization/mappings';
import {
  MAX_MUTUAL_FRIENDS_DISPLAY,
  MAX_BADGES_DISPLAY,
  MAX_SHARED_FORUMS_DISPLAY,
} from './constants';
import type { FullProfileCardProps } from './types';

export const FullProfileCard = memo(function FullProfileCard({
  user,
  mutualFriends,
  onClose,
}: FullProfileCardProps) {
  const { user: currentUser } = useAuthStore();
  // TODO(phase-26): Rewire — gamification stores deleted
  const getEquippedBorder = () => null;
  const isOwnProfile = user.id === currentUser?.id;

  // Get the user's equipped border
  const userBorder = isOwnProfile
    ? getEquippedBorder()
    : user.avatarBorderId
      ? getBorderById(user.avatarBorderId)
      : undefined;

  return (
    <div className="max-h-[80vh] w-[600px] overflow-y-auto">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute right-4 top-4 z-10 rounded-lg bg-black/20 p-2 text-white/70 transition-colors hover:bg-black/40 hover:text-white"
        aria-label="Close"
      >
        <XMarkIcon className="h-5 w-5" />
      </button>

      {/* Banner Background — uses profile theme CSS variables for own profile */}
      <div
        className="h-32 rounded-t-2xl"
        style={{
          background: isOwnProfile
            ? `linear-gradient(to bottom right, color-mix(in srgb, var(--profile-primary, #9333ea) 20%, transparent), color-mix(in srgb, var(--profile-secondary, #a855f7) 20%, transparent), color-mix(in srgb, var(--profile-accent, #c084fc) 20%, transparent))`
            : 'linear-gradient(to bottom right, rgba(147,51,234,0.2), rgba(168,85,247,0.2), rgba(192,132,252,0.2))',
        }}
      />

      {/* Profile Content */}
      <div className="px-6 pb-6">
        {/* Avatar with animated border */}
        <div className="-mt-12 mb-4 flex items-start gap-4">
          <div className="relative">
            <AvatarBorderRenderer
              src={user.avatarUrl}
              alt={user.displayName}
              size={96}
              border={userBorder}
              showParticles={true}
              interactive={true}
            />
            {user.isOnline && (
              <div className="absolute bottom-1 right-1 h-6 w-6 rounded-full border-2 border-dark-800 bg-green-500" />
            )}
          </div>

          <div className="mt-12 flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold text-white">{user.displayName}</h2>
              {user.equippedTitle && (
                <TitleBadge title={user.equippedTitle.id} size="sm" animated showTooltip />
              )}
            </div>
            <p className="text-sm text-white/60">@{user.username}</p>
            {user.pronouns && <p className="text-xs text-white/40">{user.pronouns}</p>}
          </div>
        </div>

        {/* Bio */}
        {user.bio && (
          <div className="mb-4 rounded-lg bg-white/5 p-3">
            <p className="text-sm text-white/80">{user.bio}</p>
          </div>
        )}

        {/* Top Badges */}
        {user.equippedBadges && user.equippedBadges.length > 0 && (
          <div className="mb-4">
            <h3 className="mb-2 text-sm font-semibold text-white/70">Equipped Badges</h3>
            <div className="flex gap-2">
              {user.equippedBadges.slice(0, MAX_BADGES_DISPLAY).map((badge) => {
                const staticBadge = BADGE_DISPLAY_MAP[badge.id];
                const color = staticBadge ? staticBadge.color : '#f59e0b';
                return (
                  <div
                    key={badge.id}
                    className="group relative flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium"
                    style={{
                      borderColor: `${color}40`,
                      background: `linear-gradient(135deg, ${color}15, ${color}25)`,
                      color: color,
                    }}
                    title={staticBadge?.name || badge.description}
                  >
                    {staticBadge && <span className="text-sm">{staticBadge.icon}</span>}
                    <span>{staticBadge?.name || badge.description || badge.id}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Quick Stats Grid */}
        <div className="mb-4 grid grid-cols-4 gap-3">
          <div className="rounded-lg bg-white/5 p-3 text-center">
            <div className="text-lg font-bold text-white">{user.karma.toLocaleString()}</div>
            <div className="text-xs text-white/60">Karma</div>
          </div>
          <div className="rounded-lg bg-white/5 p-3 text-center">
            <div className="text-lg font-bold text-white">{user.streak}</div>
            <div className="text-xs text-white/60">Streak</div>
          </div>
          <div className="rounded-lg bg-white/5 p-3 text-center">
            <div className="text-lg font-bold text-white">{user.postCount || 0}</div>
            <div className="text-xs text-white/60">Posts</div>
          </div>
          <div className="rounded-lg bg-white/5 p-3 text-center">
            <div className="text-lg font-bold text-white">{user.friendCount || 0}</div>
            <div className="text-xs text-white/60">Friends</div>
          </div>
        </div>

        {/* Mutual Friends */}
        {mutualFriends.length > 0 && (
          <div className="mb-4">
            <h3 className="mb-2 text-sm font-semibold text-white/70">Mutual Friends</h3>
            <div className="flex -space-x-2">
              {mutualFriends.slice(0, MAX_MUTUAL_FRIENDS_DISPLAY).map((friend) => (
                <img
                  key={friend.id}
                  src={friend.avatarUrl}
                  alt={friend.username}
                  className="h-8 w-8 rounded-full border-2 border-dark-800"
                  title={friend.username}
                />
              ))}
              {mutualFriends.length > MAX_MUTUAL_FRIENDS_DISPLAY && (
                <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-dark-800 bg-white/10 text-xs text-white">
                  +{mutualFriends.length - MAX_MUTUAL_FRIENDS_DISPLAY}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Shared Forums */}
        {user.forumsInCommon && user.forumsInCommon.length > 0 && (
          <div className="mb-4">
            <h3 className="mb-2 text-sm font-semibold text-white/70">Shared Forums</h3>
            <div className="flex flex-wrap gap-2">
              {user.forumsInCommon.slice(0, MAX_SHARED_FORUMS_DISPLAY).map((forum) => (
                <span key={forum.id} className="rounded bg-white/5 px-2 py-1 text-xs text-white/60">
                  {forum.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2">
          {!isOwnProfile && (
            <>
              <Link
                to={`/messages?userId=${user.id}`}
                className="flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-3 font-medium text-white transition-colors hover:bg-primary-700"
              >
                <ChatBubbleLeftRightIcon className="h-5 w-5" />
                <span>Send Message</span>
              </Link>
              <button className="flex items-center justify-center gap-2 rounded-lg bg-white/10 px-4 py-3 font-medium text-white transition-colors hover:bg-white/20">
                <UserPlusIcon className="h-5 w-5" />
                <span>Add Friend</span>
              </button>
            </>
          )}

          <Link
            to={`/user/${user.id}`}
            className="col-span-2 flex items-center justify-center gap-2 rounded-lg bg-white/10 px-4 py-3 font-medium text-white transition-colors hover:bg-white/20"
          >
            <EyeIcon className="h-5 w-5" />
            <span>View Full Profile</span>
          </Link>

          {!isOwnProfile && (
            <button className="col-span-2 flex items-center justify-center gap-2 rounded-lg bg-red-600/20 px-4 py-3 font-medium text-red-400 transition-colors hover:bg-red-600/30">
              <ShieldExclamationIcon className="h-5 w-5" />
              <span>Block User</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
});
