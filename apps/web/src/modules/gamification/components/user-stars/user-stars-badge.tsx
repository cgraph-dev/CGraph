/**
 * UserStarsBadge Component
 *
 * Compact badge variant showing tier name with stars.
 */

import { getTierForPostCount } from './utils';
import { UserStars } from './user-stars';
import type { UserStarsBadgeProps } from './types';

/**
 * unknown for the gamification module.
 */
/**
 * User Stars Badge component.
 */
export function UserStarsBadge({ postCount, size = 'sm' }: UserStarsBadgeProps) {
  const tier = getTierForPostCount(postCount);

  return (
    <div
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5"
      style={{
        backgroundColor: `${tier.color}20`,
        border: `1px solid ${tier.color}40`,
      }}
    >
      <UserStars postCount={postCount} size={size} compact animated={false} />
      <span className="text-xs font-medium" style={{ color: tier.color }}>
        {tier.name}
      </span>
    </div>
  );
}
