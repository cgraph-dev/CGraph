/**
 * InlineBadges — renders a compact row of equipped badge icons.
 *
 * Resolves badge IDs to their display data (icon, color, name) via mappings.
 */

import { memo } from 'react';
import { resolveEquippedBadges } from '@/modules/settings/store/customization/mappings';
import { cn } from '@/lib/utils';

interface InlineBadgesProps {
  badgeIds: string[] | null | undefined;
  max?: number;
  maxDisplay?: number;
  size?: 'xs' | 'sm' | 'md';
  className?: string;
}

const BADGE_SIZE_CLASSES = {
  xs: 'text-[10px] px-1 py-0.5',
  sm: 'text-xs px-1.5 py-0.5',
  md: 'text-sm px-2 py-1',
} as const;

export const InlineBadges = memo(function InlineBadges({
  badgeIds,
  max = 5,
  maxDisplay,
  size = 'sm',
  className,
}: InlineBadgesProps) {
  const limit = maxDisplay ?? max;
  if (!badgeIds || badgeIds.length === 0) return null;

  const resolved = resolveEquippedBadges(badgeIds.slice(0, limit));
  if (resolved.length === 0) return null;

  return (
    <span className={className}>
      {resolved.map((badge) => (
        <span
          key={badge.name}
          className={cn(
            'inline-flex items-center gap-0.5 rounded font-medium',
            BADGE_SIZE_CLASSES[size]
          )}
          style={{
            backgroundColor: `${badge.color}20`,
            color: badge.color,
          }}
          title={badge.name}
        >
          <span className="text-[11px]">{badge.icon}</span>
          {resolved.length <= 3 && <span>{badge.name}</span>}
        </span>
      ))}
    </span>
  );
});
