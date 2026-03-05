/**
 * Divider — horizontal/vertical separator with optional centered label.
 * @module
 */
import { cn } from '@/lib/utils';

interface DividerProps {
  /** Orientation */
  orientation?: 'horizontal' | 'vertical';
  /** Optional centered label (e.g. date divider in chat) */
  label?: string;
  /** Add gradient fade at edges */
  gradient?: boolean;
  className?: string;
}

/**
 * Divider — subtle separator line with optional label, like Discord date dividers.
 */
export function Divider({
  orientation = 'horizontal',
  label,
  gradient = false,
  className,
}: DividerProps) {
  if (orientation === 'vertical') {
    return (
      <div
        className={cn(
          'w-px self-stretch',
          gradient
            ? 'bg-gradient-to-b from-transparent via-white/[0.08] to-transparent'
            : 'bg-white/[0.06]',
          className,
        )}
      />
    );
  }

  if (label) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <div
          className={cn(
            'h-px flex-1',
            gradient
              ? 'bg-gradient-to-r from-transparent to-white/[0.08]'
              : 'bg-white/[0.06]',
          )}
        />
        <span className="shrink-0 text-[11px] font-semibold uppercase tracking-wide text-white/30">
          {label}
        </span>
        <div
          className={cn(
            'h-px flex-1',
            gradient
              ? 'bg-gradient-to-r from-white/[0.08] to-transparent'
              : 'bg-white/[0.06]',
          )}
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        'h-px w-full',
        gradient
          ? 'bg-gradient-to-r from-transparent via-white/[0.08] to-transparent'
          : 'bg-white/[0.06]',
        className,
      )}
    />
  );
}

export default Divider;
