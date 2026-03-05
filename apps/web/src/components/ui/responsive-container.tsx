/**
 * Responsive Container — Breakpoint system with container queries
 *
 * Breakpoints: compact (<768px), normal (768-1200px), wide (>1200px)
 * Provides useBreakpoint() hook and ResponsiveContainer wrapper.
 *
 * @module components/ui/responsive-container
 */

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { cn } from '@/lib/utils';

// ── Types ──────────────────────────────────────────────────────────────

export type Breakpoint = 'compact' | 'normal' | 'wide';

interface ResponsiveContextValue {
  breakpoint: Breakpoint;
  isCompact: boolean;
  isNormal: boolean;
  isWide: boolean;
}

// ── Context ────────────────────────────────────────────────────────────

const ResponsiveContext = createContext<ResponsiveContextValue>({
  breakpoint: 'normal',
  isCompact: false,
  isNormal: true,
  isWide: false,
});

export function useBreakpoint(): ResponsiveContextValue {
  return useContext(ResponsiveContext);
}

// ── Breakpoint Detection ───────────────────────────────────────────────

function getBreakpoint(width: number): Breakpoint {
  if (width < 768) return 'compact';
  if (width > 1200) return 'wide';
  return 'normal';
}

// ── Provider Component ─────────────────────────────────────────────────

export function ResponsiveProvider({ children }: { children: React.ReactNode }) {
  const [bp, setBp] = useState<Breakpoint>(() =>
    typeof window !== 'undefined' ? getBreakpoint(window.innerWidth) : 'normal',
  );

  useEffect(() => {
    function onResize() {
      setBp(getBreakpoint(window.innerWidth));
    }
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const value = useMemo<ResponsiveContextValue>(
    () => ({
      breakpoint: bp,
      isCompact: bp === 'compact',
      isNormal: bp === 'normal',
      isWide: bp === 'wide',
    }),
    [bp],
  );

  return (
    <ResponsiveContext.Provider value={value}>
      {children}
    </ResponsiveContext.Provider>
  );
}

// ── Responsive Container ───────────────────────────────────────────────

export function ResponsiveContainer({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { breakpoint } = useBreakpoint();

  return (
    <div
      className={cn('w-full', className)}
      data-breakpoint={breakpoint}
    >
      {children}
    </div>
  );
}

// ── Conditional Renderers ──────────────────────────────────────────────

export function ShowOnCompact({ children }: { children: React.ReactNode }) {
  const { isCompact } = useBreakpoint();
  return isCompact ? <>{children}</> : null;
}

export function ShowOnWide({ children }: { children: React.ReactNode }) {
  const { isWide } = useBreakpoint();
  return isWide ? <>{children}</> : null;
}

export function HideOnCompact({ children }: { children: React.ReactNode }) {
  const { isCompact } = useBreakpoint();
  return isCompact ? null : <>{children}</>;
}

export default ResponsiveContainer;
