/**
 * UserRow - Shared row component for leaderboard entries
 */
import { Link } from 'react-router-dom';
import { ThemedAvatar } from '@/components/theme/themed-avatar';
import { SparklesIcon } from '@heroicons/react/24/outline';
import { CheckBadgeIcon } from '@heroicons/react/24/solid';

import type { UserRowProps } from './types';
import { formatKarma, getRankIcon, deriveUserDisplayInfo } from './utils';

/**
 * unknown for the forums module.
 */
/**
 * User Row component.
 */
export function UserRow({
  rank,
  userId,
  username,
  displayName,
  avatarUrl,
  avatarBorderId,
  karma,
  isVerified,
}: UserRowProps) {
  const { name, handle, initial } = deriveUserDisplayInfo(displayName, username, userId);
  const profilePath = username ? `/u/${username}` : `/users/${userId}`;

  return (
    <Link
      to={profilePath}
      className="hover:bg-white/[0.10]/50 group -mx-2 flex items-center gap-3 rounded-lg p-2 transition-all duration-200"
    >
      {getRankIcon(rank)}

      {avatarUrl ? (
        <ThemedAvatar
          src={avatarUrl}
          alt={name}
          size="small"
          className="h-8 w-8 ring-1 ring-dark-600 transition-all group-hover:ring-primary-500/50"
          avatarBorderId={avatarBorderId}
        />
      ) : (
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-primary-700 text-sm font-semibold text-white">
          {initial}
        </div>
      )}

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1">
          <span className="truncate text-sm font-medium text-gray-200 transition-colors group-hover:text-white">
            {name}
          </span>
          {isVerified && <CheckBadgeIcon className="h-4 w-4 flex-shrink-0 text-primary-400" />}
        </div>
        <span className="text-xs text-gray-500">@{handle}</span>
      </div>

      <div className="flex items-center gap-1 text-right">
        <SparklesIcon
          className={`h-3.5 w-3.5 ${rank <= 3 ? 'text-yellow-400' : 'text-gray-500'}`}
        />
        <span
          className={`text-sm font-semibold ${rank <= 3 ? 'text-yellow-400' : 'text-gray-300'}`}
        >
          {formatKarma(karma)}
        </span>
      </div>
    </Link>
  );
}
