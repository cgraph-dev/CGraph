/**
 * User star rating display component.
 * @module modules/social/components/common/user-stars
 */
import React from 'react';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { StarIcon as StarIconOutline } from '@heroicons/react/24/outline';

/**
 * UserStars Component
 *
 * MyBB-style reputation/rank stars display.
 * Shows stars based on user's reputation or rank level.
 *
 * Features:
 * - Configurable max stars
 * - Different star colors for different ranks
 * - Half-star support
 * - Custom icons for special ranks
 */

export type StarColor = 'gold' | 'silver' | 'bronze' | 'blue' | 'green' | 'red' | 'purple';

interface UserStarsProps {
  count: number;
  maxStars?: number;
  color?: StarColor;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showEmpty?: boolean;
  allowHalf?: boolean;
  className?: string;
}

const colorConfig: Record<StarColor, { filled: string; empty: string }> = {
  gold: { filled: 'text-yellow-500', empty: 'text-yellow-200 dark:text-yellow-900' },
  silver: { filled: 'text-gray-400', empty: 'text-gray-200 dark:text-gray-700' },
  bronze: { filled: 'text-orange-600', empty: 'text-orange-200 dark:text-orange-900' },
  blue: { filled: 'text-blue-500', empty: 'text-blue-200 dark:text-blue-900' },
  green: { filled: 'text-green-500', empty: 'text-green-200 dark:text-green-900' },
  red: { filled: 'text-red-500', empty: 'text-red-200 dark:text-red-900' },
  purple: { filled: 'text-purple-500', empty: 'text-purple-200 dark:text-purple-900' },
};

const sizeConfig: Record<string, string> = {
  xs: 'w-3 h-3',
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
};

/**
 * unknown for the social module.
 */
/**
 * User Stars component.
 */
export function UserStars({
  count,
  maxStars = 5,
  color = 'gold',
  size = 'sm',
  showEmpty = false,
  allowHalf = false,
  className = '',
}: UserStarsProps) {
  const colors = colorConfig[color];
  const sizeClass = sizeConfig[size];

  // Calculate stars to display
  const fullStars = Math.floor(Math.min(count, maxStars));
  const hasHalf = allowHalf && count % 1 >= 0.5 && fullStars < maxStars;
  const emptyStars = showEmpty ? maxStars - fullStars - (hasHalf ? 1 : 0) : 0;

  const stars: React.ReactNode[] = [];

  // Full stars
  for (let i = 0; i < fullStars; i++) {
    stars.push(<StarIconSolid key={`full-${i}`} className={`${sizeClass} ${colors.filled}`} />);
  }

  // Half star
  if (hasHalf) {
    stars.push(
      <div key="half" className="relative">
        <StarIconOutline className={`${sizeClass} ${colors.empty}`} />
        <div className="absolute inset-0 w-1/2 overflow-hidden">
          <StarIconSolid className={`${sizeClass} ${colors.filled}`} />
        </div>
      </div>
    );
  }

  // Empty stars
  for (let i = 0; i < emptyStars; i++) {
    stars.push(<StarIconOutline key={`empty-${i}`} className={`${sizeClass} ${colors.empty}`} />);
  }

  if (stars.length === 0 && !showEmpty) {
    return null;
  }

  return <div className={`inline-flex items-center gap-0.5 ${className}`}>{stars}</div>;
}

/**
 * ReputationStars Component
 *
 * Extended version that converts reputation points to stars with color tiers.
 */
interface ReputationStarsProps {
  reputation: number;
  maxReputation?: number;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showValue?: boolean;
  className?: string;
}

interface ReputationTier {
  minRep: number;
  maxStars: number;
  color: StarColor;
  label: string;
}

const reputationTiers: ReputationTier[] = [
  { minRep: 1000, maxStars: 5, color: 'gold', label: 'Legendary' },
  { minRep: 500, maxStars: 4, color: 'gold', label: 'Elite' },
  { minRep: 250, maxStars: 3, color: 'blue', label: 'Veteran' },
  { minRep: 100, maxStars: 2, color: 'green', label: 'Member' },
  { minRep: 50, maxStars: 1, color: 'bronze', label: 'Newcomer' },
  { minRep: 0, maxStars: 0, color: 'silver', label: 'New' },
];

/**
 * unknown for the social module.
 */
/**
 * Reputation Stars component.
 */
export function ReputationStars({
  reputation,
  maxReputation: _maxReputation = 1500,
  size = 'sm',
  showValue = false,
  className = '',
}: ReputationStarsProps) {
  void _maxReputation; // Reserved for future use

  // Find the appropriate tier
  const tier =
    reputationTiers.find((t) => reputation >= t.minRep) ??
    reputationTiers[reputationTiers.length - 1];
  const currentTier = tier!; // Safe since we have fallback

  // Calculate progress within tier for partial stars
  const nextTier = reputationTiers.find((t) => t.minRep > currentTier.minRep);
  let starProgress = currentTier.maxStars;

  if (nextTier && currentTier.maxStars > 0) {
    const tierRange = nextTier.minRep - currentTier.minRep;
    const progressInTier = reputation - currentTier.minRep;
    const percentComplete = Math.min(progressInTier / tierRange, 1);
    starProgress = currentTier.maxStars - 1 + percentComplete;
  }

  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      <UserStars
        count={starProgress}
        maxStars={currentTier.maxStars}
        color={currentTier.color}
        size={size}
        showEmpty={true}
        allowHalf={true}
      />
      {showValue && <span className="text-xs text-gray-500">({reputation})</span>}
    </div>
  );
}

/**
 * PostCountStars Component
 *
 * Shows stars based on user's post count (classic MyBB style).
 */
interface PostCountStarsProps {
  postCount: number;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

interface PostTier {
  minPosts: number;
  stars: number;
  color: StarColor;
}

const postTiers: PostTier[] = [
  { minPosts: 10000, stars: 5, color: 'gold' },
  { minPosts: 5000, stars: 5, color: 'silver' },
  { minPosts: 2500, stars: 4, color: 'silver' },
  { minPosts: 1000, stars: 3, color: 'blue' },
  { minPosts: 500, stars: 2, color: 'blue' },
  { minPosts: 100, stars: 1, color: 'green' },
  { minPosts: 50, stars: 1, color: 'bronze' },
  { minPosts: 0, stars: 0, color: 'silver' },
];

/**
 * unknown for the social module.
 */
/**
 * Post Count Stars component.
 */
export function PostCountStars({ postCount, size = 'sm', className = '' }: PostCountStarsProps) {
  const tier = postTiers.find((t) => postCount >= t.minPosts) ?? postTiers[postTiers.length - 1];
  const currentTier = tier!; // Safe since we have fallback

  if (currentTier.stars === 0) {
    return null;
  }

  return (
    <UserStars
      count={currentTier.stars}
      maxStars={5}
      color={currentTier.color}
      size={size}
      showEmpty={false}
      className={className}
    />
  );
}

/**
 * RankBadge Component
 *
 * Shows a text-based rank badge with optional stars.
 */
interface RankBadgeProps {
  rank: string;
  stars?: number;
  starColor?: StarColor;
  badgeColor?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const badgeColors: Record<string, string> = {
  default: 'bg-gray-100 text-gray-700 dark:bg-white/[0.06] dark:text-gray-300',
  primary: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  success: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  warning: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
  danger: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  info: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
};

const badgeSizes: Record<string, string> = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
  lg: 'px-3 py-1.5 text-base',
};

/**
 * unknown for the social module.
 */
/**
 * Rank Badge component.
 */
export function RankBadge({
  rank,
  stars = 0,
  starColor = 'gold',
  badgeColor = 'default',
  size = 'sm',
  className = '',
}: RankBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium ${badgeColors[badgeColor]} ${badgeSizes[size]} ${className}`}
    >
      {stars > 0 && <UserStars count={stars} maxStars={stars} color={starColor} size="xs" />}
      {rank}
    </span>
  );
}

export default UserStars;
