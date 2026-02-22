/**
 * Top3Spotlight Component
 *
 * Displays top 3 users in a podium-style layout.
 */

import { Link } from 'react-router-dom';
import { TrophyIcon as TrophyIconSolid } from '@heroicons/react/24/solid';
import { ThemedAvatar } from '@/components/theme/themed-avatar';
import { formatKarma, getUserInitial } from './utils';
import type { Top3SpotlightProps } from './types';

export function Top3Spotlight({ users }: Top3SpotlightProps) {
  if (users.length < 3) return null;

  const [first, second, third] = users;

  return (
    <div className="mb-6 grid grid-cols-3 gap-4">
      {/* Second Place */}
      <div className="order-1 flex flex-col items-center p-4 pt-8">
        <Link to={`/u/${second?.username}`} className="group">
          <div className="relative">
            {second?.avatarUrl ? (
              <ThemedAvatar
                src={second.avatarUrl}
                alt={second.displayName || second.username || 'User'}
                size="medium"
                className="h-16 w-16 ring-2 ring-gray-400 transition-all group-hover:ring-4"
                avatarBorderId={second.avatarBorderId}
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-500 text-2xl font-bold text-white ring-2 ring-gray-400">
                {getUserInitial(second?.displayName, second?.username)}
              </div>
            )}
            <div className="absolute -bottom-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-gray-400 text-sm font-bold text-white shadow-lg">
              2
            </div>
          </div>
          <p className="mt-3 max-w-20 truncate text-center text-sm font-medium text-gray-300 group-hover:text-white">
            {second?.displayName || second?.username || 'Unknown'}
          </p>
          <p className="text-center text-xs text-gray-500">{formatKarma(second?.karma || 0)}</p>
        </Link>
      </div>

      {/* First Place */}
      <div className="order-2 flex flex-col items-center p-4">
        <Link to={`/u/${first?.username}`} className="group">
          <div className="relative">
            {first?.avatarUrl ? (
              <ThemedAvatar
                src={first.avatarUrl}
                alt={first.displayName || first.username || 'User'}
                size="large"
                className="group-hover:ring-6 h-20 w-20 shadow-lg shadow-yellow-500/30 ring-4 ring-yellow-500 transition-all"
                avatarBorderId={first.avatarBorderId}
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 text-3xl font-bold text-white shadow-lg shadow-yellow-500/30 ring-4 ring-yellow-500">
                {getUserInitial(first?.displayName, first?.username)}
              </div>
            )}
            <div className="absolute -bottom-2 -right-2 flex h-10 w-10 items-center justify-center rounded-full bg-yellow-500 shadow-lg">
              <TrophyIconSolid className="h-5 w-5 text-white" />
            </div>
          </div>
          <p className="mt-3 max-w-24 truncate text-center font-semibold text-white group-hover:text-yellow-400">
            {first?.displayName || first?.username || 'Unknown'}
          </p>
          <p className="text-center text-sm font-medium text-yellow-400">
            {formatKarma(first?.karma || 0)}
          </p>
        </Link>
      </div>

      {/* Third Place */}
      <div className="order-3 flex flex-col items-center p-4 pt-10">
        <Link to={`/u/${third?.username}`} className="group">
          <div className="relative">
            {third?.avatarUrl ? (
              <ThemedAvatar
                src={third.avatarUrl}
                alt={third.displayName || third.username || 'User'}
                size="small"
                className="h-14 w-14 ring-2 ring-orange-500 transition-all group-hover:ring-4"
                avatarBorderId={third.avatarBorderId}
              />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-orange-500 text-xl font-bold text-white ring-2 ring-orange-500">
                {getUserInitial(third?.displayName, third?.username)}
              </div>
            )}
            <div className="absolute -bottom-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full bg-orange-500 text-xs font-bold text-white shadow-lg">
              3
            </div>
          </div>
          <p className="mt-3 max-w-16 truncate text-center text-sm font-medium text-gray-300 group-hover:text-white">
            {third?.displayName || third?.username || 'Unknown'}
          </p>
          <p className="text-center text-xs text-gray-500">{formatKarma(third?.karma || 0)}</p>
        </Link>
      </div>
    </div>
  );
}
