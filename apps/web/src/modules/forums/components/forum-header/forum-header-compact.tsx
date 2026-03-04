/**
 * Forum Header Compact Variant
 *
 * Compact card for sidebar/list views
 */

import { memo } from 'react';
import { motion } from 'motion/react';

import { GlassCard } from '@/shared/components/ui';
import { formatNumber } from './utils';
import type { Forum } from './types';

interface ForumHeaderCompactProps {
  forum: Forum;
  primaryColor: string;
  isMember: boolean;
  isJoining: boolean;
  onJoin: () => void;
  className?: string;
}

export const ForumHeaderCompact = memo(function ForumHeaderCompact({
  forum,
  primaryColor,
  isMember,
  isJoining,
  onJoin,
  className = '',
}: ForumHeaderCompactProps) {
  return (
    <GlassCard variant="frosted" className={`p-4 ${className}`}>
      <div className="flex items-center gap-4">
        <div className="group relative">
          {forum.iconUrl ? (
            <img
              src={forum.iconUrl}
              alt={forum.name}
              className="h-12 w-12 rounded-xl object-cover"
            />
          ) : (
            <div
              className="flex h-12 w-12 items-center justify-center rounded-xl text-lg font-bold"
              style={{ backgroundColor: `${primaryColor}30`, color: primaryColor }}
            >
              {forum.name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h2 className="truncate font-semibold">{forum.name}</h2>
          <p className="text-sm text-gray-400">{formatNumber(forum.memberCount)} members</p>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onJoin}
          disabled={isJoining}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
            isMember ? 'bg-white/[0.08] text-gray-300' : ''
          }`}
          style={!isMember ? { backgroundColor: primaryColor } : {}}
        >
          {isMember ? 'Joined' : 'Join'}
        </motion.button>
      </div>
    </GlassCard>
  );
});
