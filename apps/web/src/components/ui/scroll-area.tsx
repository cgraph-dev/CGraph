/**
 * ScrollArea — Radix-based custom scrollbar with Discord-style thin bar.
 * @module
 */
import React, { type ReactNode } from 'react';
import * as ScrollAreaPrimitive from '@radix-ui/react-scroll-area';
import { cn } from '@/lib/utils';

interface ScrollAreaProps {
  children: ReactNode;
  className?: string;
  /** Scroll direction */
  orientation?: 'vertical' | 'horizontal' | 'both';
  /** Root element type for Radix */
  type?: 'auto' | 'always' | 'scroll' | 'hover';
}

/** Scroll Area component. */
function ScrollArea({
  children,
  className,
  orientation = 'vertical',
  type = 'hover',
  ref,
}: ScrollAreaProps & { ref?: React.Ref<HTMLDivElement> }): React.ReactElement {
  return (
    <ScrollAreaPrimitive.Root type={type} className={cn('relative overflow-hidden', className)}>
      <ScrollAreaPrimitive.Viewport ref={ref} className="h-full w-full rounded-[inherit]">
        {children}
      </ScrollAreaPrimitive.Viewport>

      {(orientation === 'vertical' || orientation === 'both') && (
        <ScrollBar orientation="vertical" />
      )}
      {(orientation === 'horizontal' || orientation === 'both') && (
        <ScrollBar orientation="horizontal" />
      )}

      <ScrollAreaPrimitive.Corner />
    </ScrollAreaPrimitive.Root>
  );
}

/* ─── Scrollbar ────────────────────────────────────────────────────────────── */

/** Scroll Bar component. */
function ScrollBar({ orientation = 'vertical' }: { orientation?: 'vertical' | 'horizontal' }) {
  return (
    <ScrollAreaPrimitive.Scrollbar
      orientation={orientation}
      className={cn(
        'flex touch-none select-none transition-all duration-200 ease-out',
        // Auto-hide: transparent by default, visible on hover/scroll
        'data-[state=hidden]:opacity-0 data-[state=visible]:opacity-100',
        orientation === 'vertical' && 'h-full w-1 border-l border-l-transparent p-px hover:w-2',
        orientation === 'horizontal' && 'h-1 flex-col border-t border-t-transparent p-px hover:h-2'
      )}
    >
      <ScrollAreaPrimitive.Thumb
        className={cn(
          'relative flex-1 rounded-full bg-white/[0.12] transition-colors',
          'hover:bg-white/[0.2] active:bg-white/[0.25]'
        )}
      />
    </ScrollAreaPrimitive.Scrollbar>
  );
}

export { ScrollArea, ScrollBar };
export default ScrollArea;
