/**
 * Top Forum Card Component
 *
 * Compact card for the Hall of Fame sidebar.
 */

import { Link } from 'react-router-dom';
import type { TopForumCardProps } from './types';
import { getRankColor } from './constants';

/**
 * unknown for the forums module.
 */
/**
 * Top Forum Card display component.
 */
export function TopForumCard({ forum, rank }: TopForumCardProps) {
  return (
    <Link
      to={`/forums/${forum.slug}`}
      className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-white/[0.10]/50"
    >
      <span className={`w-6 text-lg font-bold ${getRankColor(rank)}`}>#{rank}</span>

      <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-primary-600">
        {forum.iconUrl ? (
          <img src={forum.iconUrl} alt={forum.name} className="h-full w-full object-cover" />
        ) : (
          <span className="text-sm font-bold text-white">
            {forum.name?.[0]?.toUpperCase() ?? 'F'}
          </span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-white">f/{forum.name}</p>
        <p className="text-xs text-gray-400">{(forum.score ?? 0).toLocaleString()} points</p>
      </div>
    </Link>
  );
}
