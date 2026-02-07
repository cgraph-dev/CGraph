/**
 * CompactBadgeShowcase
 *
 * Inline badge display for user cards, mentions, and compact views.
 * Shows a configurable number of equipped badges with overflow count.
 *
 * @module gamification/components/badges/CompactBadgeShowcase
 */

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { AnimatedBadgeWithTooltip } from './AnimatedBadge';
import type { Achievement } from '@/modules/gamification/store';

export interface CompactBadgeShowcaseProps {
  /** Array of equipped achievements */
  badges: Achievement[];
  /** Maximum badges to show before "+N" overflow */
  maxVisible?: number;
  /** Badge size */
  size?: 'xs' | 'sm';
  /** Additional CSS classes */
  className?: string;
}

export function CompactBadgeShowcase({
  badges,
  maxVisible = 3,
  size = 'xs',
  className,
}: CompactBadgeShowcaseProps) {
  const visibleBadges = badges.slice(0, maxVisible);
  const hiddenCount = badges.length - maxVisible;

  if (badges.length === 0) return null;

  return (
    <div className={cn('flex items-center gap-1', className)}>
      {visibleBadges.map((badge, index) => (
        <motion.div
          key={badge.id}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.05 }}
          style={{ marginLeft: index > 0 ? -8 : 0 }}
        >
          <AnimatedBadgeWithTooltip achievement={badge} size={size} animated showProgress={false} />
        </motion.div>
      ))}

      {hiddenCount > 0 && (
        <motion.span
          className="ml-1 text-xs text-gray-400"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          +{hiddenCount}
        </motion.span>
      )}
    </div>
  );
}
