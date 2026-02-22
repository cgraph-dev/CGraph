/**
 * StarTooltip Component
 *
 * Tooltip showing tier details, progress, and posts to next tier.
 */

import { motion } from 'framer-motion';
import type { UserStarsTier } from './types';

interface StarTooltipProps {
  tier: UserStarsTier;
  postCount: number;
  progress: number;
  postsToNext: number | null;
}

export function StarTooltip({ tier, postCount, progress, postsToNext }: StarTooltipProps) {
  return (
    <div className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 transform opacity-0 transition-opacity duration-200 group-hover:opacity-100">
      <div className="rounded-lg border border-dark-600 bg-dark-800 px-3 py-2 shadow-xl">
        <div className="flex items-center gap-2">
          <span className="font-semibold" style={{ color: tier.color }}>
            {tier.name}
          </span>
          {tier.isGold && (
            <span className="rounded bg-yellow-500/20 px-1.5 py-0.5 text-xs text-yellow-400">
              GOLD
            </span>
          )}
        </div>
        <p className="mt-1 text-sm text-gray-400">{tier.description}</p>
        <div className="mt-2 text-xs text-gray-500">
          <span className="font-medium text-gray-300">{postCount.toLocaleString()}</span> posts
        </div>
        {postsToNext !== null && (
          <div className="mt-2">
            <div className="mb-1 flex justify-between text-xs">
              <span className="text-gray-500">Next tier</span>
              <span className="text-gray-400">{progress}%</span>
            </div>
            <div className="h-1.5 w-32 overflow-hidden rounded-full bg-dark-600">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: tier.color }}
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">
              {postsToNext.toLocaleString()} posts to next tier
            </p>
          </div>
        )}
      </div>
      {/* Tooltip Arrow */}
      <div className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-dark-800" />
    </div>
  );
}
