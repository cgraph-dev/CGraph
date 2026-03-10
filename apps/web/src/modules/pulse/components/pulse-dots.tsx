/**
 * PulseDots — Qualitative pulse display
 * Shows pulse as filled dots with tier label (●●●●○)
 */

import { memo, useMemo } from 'react';
import { cn } from '@/lib/utils';

export interface PulseDotsProps {
  score: number;
  tier: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  showTooltip?: boolean;
  className?: string;
}

const DEFAULT_TIER = { dots: 0, color: 'text-gray-400', label: 'Newcomer' } as const;

const TIER_CONFIG: Record<string, { dots: number; color: string; label: string }> = {
  newcomer: DEFAULT_TIER,
  active: { dots: 1, color: 'text-blue-400', label: 'Active' },
  trusted: { dots: 2, color: 'text-green-400', label: 'Trusted' },
  expert: { dots: 3, color: 'text-purple-400', label: 'Expert' },
  authority: { dots: 4, color: 'text-amber-400', label: 'Authority' },
  legend: { dots: 5, color: 'text-yellow-300', label: 'Legend' },
};

const TOTAL_DOTS = 5;

const SIZE_MAP = {
  sm: 'text-xs gap-0.5',
  md: 'text-sm gap-1',
  lg: 'text-base gap-1',
};

export const PulseDots = memo(function PulseDots({
  score,
  tier,
  size = 'md',
  showLabel = true,
  showTooltip = true,
  className,
}: PulseDotsProps) {
  const config = TIER_CONFIG[tier] ?? DEFAULT_TIER;

  const dots = useMemo(() => {
    return Array.from({ length: TOTAL_DOTS }, (_, i) => i < config.dots);
  }, [config.dots]);

  return (
    <div
      className={cn('inline-flex items-center', SIZE_MAP[size], className)}
      title={showTooltip ? `Pulse: ${score}` : undefined}
    >
      <div className="flex items-center gap-0.5">
        {dots.map((filled, i) => (
          <span
            key={i}
            className={cn('transition-colors', filled ? config.color : 'text-gray-600 opacity-40')}
          >
            ●
          </span>
        ))}
      </div>
      {showLabel && <span className={cn('ml-1 font-medium', config.color)}>{config.label}</span>}
    </div>
  );
});
