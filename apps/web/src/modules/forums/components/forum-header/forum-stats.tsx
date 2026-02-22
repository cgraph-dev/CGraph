/**
 * Forum Stats Component
 *
 * Member count and featured badge display
 */

import { memo } from 'react';
import { UserGroupIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { formatNumber } from './utils';
import type { ForumStatsProps } from './types';

export const ForumStats = memo(function ForumStats({ memberCount, featured }: ForumStatsProps) {
  return (
    <div className="flex items-center gap-6 text-sm">
      <div className="flex items-center gap-2 text-gray-400">
        <UserGroupIcon className="h-5 w-5" />
        <span>
          <span className="font-medium text-white">{formatNumber(memberCount)}</span> members
        </span>
      </div>
      {featured && (
        <div className="flex items-center gap-1.5 text-amber-500">
          <StarIconSolid className="h-5 w-5" />
          <span className="font-medium">Featured</span>
        </div>
      )}
    </div>
  );
});
