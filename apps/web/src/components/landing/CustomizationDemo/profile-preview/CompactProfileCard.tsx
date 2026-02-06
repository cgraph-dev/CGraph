/**
 * CompactProfileCard - Minimal inline profile
 */

import { memo } from 'react';
import type { CardProps } from './types';
import { MOCK_BADGES } from './constants';
import { AnimatedAvatar } from '../AnimatedAvatar';

export const CompactProfileCard = memo(function CompactProfileCard({
  state,
  speedMultiplier,
}: CardProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <AnimatedAvatar
          borderType={state.avatarBorder}
          borderColor={state.avatarBorderColor}
          size="small"
          speedMultiplier={speedMultiplier}
        />
        <div>
          <h3 className="text-sm font-bold text-white">CGraph User</h3>
          <p className="text-xs text-gray-400">Level 42</p>
        </div>
      </div>
      {state.showBadges && (
        <div className="flex gap-1">
          {MOCK_BADGES.slice(0, 3).map((badge) => (
            <div
              key={badge.id}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-gray-700 to-gray-800 text-sm"
            >
              {badge.emoji}
            </div>
          ))}
        </div>
      )}
    </div>
  );
});
