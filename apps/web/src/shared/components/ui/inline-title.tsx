/**
 * InlineTitle — renders a user's equipped title with rarity-based styling.
 *
 * Resolves a title ID to its display name and gradient via the mappings layer.
 * Supports inline (next to username) and standalone rendering.
 */

import { memo } from 'react';
import { getTitleDisplay, isRareTitle } from '@/modules/settings/store/customization/mappings';
import { cn } from '@/lib/utils';

interface InlineTitleProps {
  titleId: string | null | undefined;
  size?: 'xs' | 'sm' | 'md';
  className?: string;
}

const SIZE_CLASSES = {
  xs: 'text-[10px] px-1 py-0.5',
  sm: 'text-xs px-1.5 py-0.5',
  md: 'text-sm px-2 py-1',
} as const;

export const InlineTitle = memo(function InlineTitle({
  titleId,
  size = 'sm',
  className,
}: InlineTitleProps) {
  if (!titleId) return null;

  const display = getTitleDisplay(titleId);
  if (!display) return null;

  const isSpecial = isRareTitle(titleId);

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md font-semibold uppercase tracking-wide',
        SIZE_CLASSES[size],
        isSpecial
          ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300'
          : 'bg-purple-500/15 text-purple-300',
        display.gradient,
        className
      )}
    >
      {isSpecial && <span className="mr-0.5 text-[10px]">✦</span>}
      {display.name}
    </span>
  );
});
