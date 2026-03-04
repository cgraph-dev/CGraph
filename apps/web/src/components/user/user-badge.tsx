/**
 * User role and status badge component.
 * @module
 */
import { CheckBadgeIcon, SparklesIcon, ShieldCheckIcon } from '@heroicons/react/24/solid';
import { ThemedAvatar } from '@/components/theme/themed-avatar';
import { transitions, hoverEffects } from '@/lib/animations';

interface UserBadgeProps {
  userId: number;
  userIdDisplay: string;
  username?: string | null;
  displayName?: string | null;
  avatarUrl?: string | null;
  avatarBorderId?: string | null;
  isVerified?: boolean;
  isPremium?: boolean;
  karma?: number;
  size?: 'sm' | 'md' | 'lg';
  showId?: boolean;
  interactive?: boolean;
  className?: string;
}

/**
 * UserBadge - Displays user identity with unique ID, username, and status badges
 *
 * Features:
 * - Unique user ID display (#0001)
 * - Optional username (can be null for new users)
 * - Verification and premium badges
 * - Karma display
 * - Smooth hover animations
 */
export default function UserBadge({
  // userId is received but display uses userIdDisplay
  userIdDisplay,
  username,
  displayName,
  avatarUrl,
  avatarBorderId,
  isVerified = false,
  isPremium = false,
  karma = 0,
  size = 'md',
  showId = true,
  interactive = true,
  className = '',
}: UserBadgeProps) {
  const sizeClasses = {
    sm: {
      container: 'gap-2',
      avatar: 'h-8 w-8 text-xs',
      name: 'text-sm',
      id: 'text-xs',
      badge: 'h-3.5 w-3.5',
    },
    md: {
      container: 'gap-3',
      avatar: 'h-10 w-10 text-sm',
      name: 'text-base',
      id: 'text-sm',
      badge: 'h-4 w-4',
    },
    lg: {
      container: 'gap-4',
      avatar: 'h-14 w-14 text-lg',
      name: 'text-lg',
      id: 'text-base',
      badge: 'h-5 w-5',
    },
  };

  const s = sizeClasses[size];
  const displayNameOrFallback = displayName || username || `User ${userIdDisplay}`;
  const initials = displayNameOrFallback.charAt(0).toUpperCase();
  const themedAvatarSize = size === 'sm' ? 'small' : size === 'lg' ? 'large' : 'medium';

  return (
    <div
      className={`inline-flex items-center ${s.container} ${interactive ? `${transitions.default} ${hoverEffects.scale} cursor-pointer` : ''} ${className} `}
    >
      {/* Avatar */}
      <div
        className={`relative ${s.avatar} flex items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-primary-700 font-bold text-white ring-2 ring-dark-700 ring-offset-2 ring-offset-dark-900 ${transitions.default} ${interactive ? 'group-hover:ring-primary-500' : ''} `}
      >
        {avatarUrl ? (
          <ThemedAvatar
            src={avatarUrl}
            alt={displayNameOrFallback}
            size={themedAvatarSize}
            className="h-full w-full"
            avatarBorderId={avatarBorderId}
          />
        ) : (
          <span>{initials}</span>
        )}

        {/* Online indicator */}
        <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-dark-900 bg-green-500" />
      </div>

      {/* User Info */}
      <div className="flex min-w-0 flex-col">
        <div className="flex items-center gap-1.5">
          {/* Display Name */}
          <span className={`${s.name} truncate font-semibold text-white`}>
            {displayNameOrFallback}
          </span>

          {/* Badges */}
          {isVerified && (
            <CheckBadgeIcon className={`${s.badge} flex-shrink-0 text-blue-400`} title="Verified" />
          )}
          {isPremium && (
            <SparklesIcon className={`${s.badge} flex-shrink-0 text-amber-400`} title="Premium" />
          )}
        </div>

        {/* Username and ID row */}
        <div className="flex items-center gap-2 text-gray-400">
          {username && <span className={`${s.id} truncate`}>@{username}</span>}
          {showId && (
            <span
              className={` ${s.id} rounded bg-white/[0.06] px-1.5 py-0.5 font-mono text-gray-500 ${transitions.default} `}
            >
              {userIdDisplay}
            </span>
          )}
          {karma > 0 && (
            <span className={`${s.id} flex items-center gap-0.5 text-amber-400`}>
              <ShieldCheckIcon className="h-3 w-3" />
              {karma.toLocaleString()}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Mini user badge for inline display
 */
export function UserBadgeMini({
  userIdDisplay,
  username,
  displayName,
  className = '',
}: Pick<UserBadgeProps, 'userIdDisplay' | 'username' | 'displayName' | 'className'>) {
  const name = displayName || username || userIdDisplay;

  return (
    <span className={`inline-flex items-center gap-1 ${className}`}>
      <span className="font-medium text-white">{name}</span>
      <span className="rounded bg-white/[0.06] px-1 font-mono text-xs text-gray-500">
        {userIdDisplay}
      </span>
    </span>
  );
}
