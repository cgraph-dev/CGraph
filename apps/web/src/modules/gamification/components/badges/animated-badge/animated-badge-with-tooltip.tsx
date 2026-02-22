/**
 * AnimatedBadgeWithTooltip - badge with hover tooltip
 */

import { useState } from 'react';
import { AnimatedBadge } from './animated-badge';
import { BadgeTooltip } from './badge-tooltip';
import { RARITY_COLORS } from './constants';
import type { AnimatedBadgeWithTooltipProps } from './types';

export function AnimatedBadgeWithTooltip({
  showTooltip = true,
  ...props
}: AnimatedBadgeWithTooltipProps) {
  const [isHovered, setIsHovered] = useState(false);
  const colors = RARITY_COLORS[props.achievement.rarity];

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <AnimatedBadge {...props} />

      {showTooltip && (
        <BadgeTooltip achievement={props.achievement} colors={colors} isVisible={isHovered} />
      )}
    </div>
  );
}
