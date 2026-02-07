/**
 * Mini Profile Card Component
 *
 * Compact profile card shown on hover (300px width)
 */

import { memo } from 'react';
import { useAuthStore } from '@/modules/auth/store';
import { useAvatarBorderStore } from '@/modules/gamification/store';
import { getBorderById } from '@/data/avatar-borders';
import { AvatarBorderRenderer } from '@/modules/social/components/avatar/AvatarBorderRenderer';
import type { MiniProfileCardProps } from './types';

export const MiniProfileCard = memo(function MiniProfileCard({
  user,
  onViewProfile,
  onMessage,
}: MiniProfileCardProps) {
  const { user: currentUser } = useAuthStore();
  const { getEquippedBorder } = useAvatarBorderStore();
  const isOwnProfile = user.id === currentUser?.id;

  // Get the user's equipped border
  const userBorder = isOwnProfile
    ? getEquippedBorder()
    : user.avatarBorderId
      ? getBorderById(user.avatarBorderId)
      : undefined;

  return (
    <div className="w-[300px] p-4">
      {/* Avatar with animated border */}
      <div className="mb-3 flex flex-col items-center">
        <div className="relative">
          <AvatarBorderRenderer
            src={user.avatarUrl}
            alt={user.displayName}
            size={80}
            border={userBorder}
            showParticles={true}
            interactive={true}
          />
          {/* Online indicator */}
          {user.isOnline && (
            <div className="absolute bottom-0 right-0 h-5 w-5 rounded-full border-2 border-dark-800 bg-green-500" />
          )}
        </div>
      </div>

      {/* Username + Title */}
      <div className="mb-3 text-center">
        <h3 className="truncate text-base font-bold text-white">{user.displayName}</h3>
        <p className="text-xs text-white/60">@{user.username}</p>
      </div>

      {/* Quick Stats */}
      <div className="mb-3 flex items-center justify-center gap-4 text-xs">
        <div className="text-center">
          <div className="font-semibold text-white">Level {user.level}</div>
          <div className="text-white/60">XP</div>
        </div>
        <div className="h-8 w-px bg-white/10" />
        <div className="text-center">
          <div className="font-semibold text-white">{user.isOnline ? 'Online' : 'Offline'}</div>
          <div className="text-white/60">Status</div>
        </div>
      </div>

      {/* Mutual Friends */}
      {user.mutualFriends && user.mutualFriends.length > 0 && (
        <div className="mb-3 text-center text-xs">
          <span className="text-white/60">
            {user.mutualFriends.length} mutual friend{user.mutualFriends.length !== 1 ? 's' : ''}
          </span>
        </div>
      )}

      {/* Action Buttons */}
      {!isOwnProfile && (
        <div className="flex gap-2">
          <button
            onClick={onMessage}
            className="flex-1 rounded-lg bg-primary-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700"
          >
            Message
          </button>
          <button
            onClick={onViewProfile}
            className="flex-1 rounded-lg bg-white/10 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-white/20"
          >
            View Profile
          </button>
        </div>
      )}

      {isOwnProfile && (
        <button
          onClick={onViewProfile}
          className="w-full rounded-lg bg-primary-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700"
        >
          View Profile
        </button>
      )}
    </div>
  );
});
