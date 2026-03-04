/**
 * CGraph Liquid Glass — Tabs
 *
 * Frosted-glass tab bar with spring-physics sliding indicator,
 * iridescent highlight, and accessible keyboard navigation.
 *
 * @module @cgraph/ui/tabs
 */
import {
  useState,
  useRef,
  useEffect,
  useCallback,
  useId,
  type ReactNode,
  type KeyboardEvent,
} from 'react';
import { motion } from 'framer-motion';
import { cn, springPreset } from '../shared';

/* ── Types ─────────────────────────────────────────────────────────────────── */

export interface LiquidTab {
  value: string;
  label: string;
  icon?: ReactNode;
  disabled?: boolean;
}

export interface LiquidTabsProps {
  tabs: LiquidTab[];
  value?: string;
  onChange?: (value: string) => void;
  /** Render tab panels. Receives the active tab value. */
  children?: (activeValue: string) => ReactNode;
  className?: string;
  /** sm | md */
  size?: 'sm' | 'md';
}

const sizeClasses = {
  sm: 'h-8 text-xs px-3',
  md: 'h-10 text-sm px-4',
} as const;

/* ── Component ─────────────────────────────────────────────────────────────── */

/** Frosted-glass tab bar with spring-physics sliding indicator and keyboard navigation. */
export function LiquidTabs({
  tabs,
  value,
  onChange,
  children,
  className,
  size = 'md',
}: LiquidTabsProps) {
  const [activeTab, setActiveTab] = useState(value ?? tabs[0]?.value ?? '');
  const autoId = useId();
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Sync controlled value
  useEffect(() => {
    if (value !== undefined) setActiveTab(value);
  }, [value]);

  // Indicator position
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const updateIndicator = useCallback(() => {
    const idx = tabs.findIndex((t) => t.value === activeTab);
    const el = tabRefs.current[idx];
    const container = containerRef.current;
    if (el && container) {
      const containerRect = container.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();
      setIndicator({
        left: elRect.left - containerRect.left,
        width: elRect.width,
      });
    }
  }, [activeTab, tabs]);

  useEffect(updateIndicator, [updateIndicator]);
  useEffect(() => {
    window.addEventListener('resize', updateIndicator);
    return () => window.removeEventListener('resize', updateIndicator);
  }, [updateIndicator]);

  const selectTab = (t: LiquidTab) => {
    if (t.disabled) return;
    setActiveTab(t.value);
    onChange?.(t.value);
  };

  /* Keyboard navigation */
  const handleKeyDown = useCallback(
    (e: KeyboardEvent, idx: number) => {
      let next = idx;
      if (e.key === 'ArrowRight') next = Math.min(idx + 1, tabs.length - 1);
      else if (e.key === 'ArrowLeft') next = Math.max(idx - 1, 0);
      else if (e.key === 'Home') next = 0;
      else if (e.key === 'End') next = tabs.length - 1;
      else return;

      e.preventDefault();
      // Skip disabled tabs
      while (tabs[next]?.disabled && next !== idx) {
        next += e.key === 'ArrowLeft' || e.key === 'Home' ? 1 : -1;
      }
      tabRefs.current[next]?.focus();
      const tab = tabs[next];
      if (tab) selectTab(tab);
    },
    [tabs]
  );

  return (
    <div className={cn('w-full', className)}>
      {/* Tab list */}
      <div
        ref={containerRef}
        role="tablist"
        className={cn(
          'relative inline-flex items-center gap-0.5 p-1',
          'bg-white/50 backdrop-blur-[14px] backdrop-saturate-[1.4]',
          'rounded-[var(--lg-radius-sm)] border border-slate-200/50'
        )}
      >
        {/* Sliding indicator */}
        <motion.div
          className={cn(
            'absolute top-1 bottom-1 rounded-[10px]',
            'bg-white/80 shadow-sm',
            'border border-slate-200/40'
          )}
          animate={{ left: indicator.left, width: indicator.width }}
          transition={springPreset}
          aria-hidden="true"
        />

        {tabs.map((tab, idx) => (
          <button
            key={tab.value}
            ref={(el) => {
              tabRefs.current[idx] = el;
            }}
            role="tab"
            id={`${autoId}-tab-${tab.value}`}
            aria-selected={activeTab === tab.value}
            aria-controls={`${autoId}-panel-${tab.value}`}
            tabIndex={activeTab === tab.value ? 0 : -1}
            disabled={tab.disabled}
            onClick={() => selectTab(tab)}
            onKeyDown={(e) => handleKeyDown(e, idx)}
            className={cn(
              'relative z-10 inline-flex items-center justify-center gap-1.5',
              'cursor-pointer rounded-[10px] font-medium select-none',
              'transition-colors duration-150',
              'focus-visible:ring-2 focus-visible:ring-blue-300/60 focus-visible:outline-none',
              'disabled:pointer-events-none disabled:opacity-40',
              activeTab === tab.value ? 'text-slate-900' : 'text-slate-500 hover:text-slate-700',
              sizeClasses[size]
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Panel */}
      {children && (
        <div
          role="tabpanel"
          id={`${autoId}-panel-${activeTab}`}
          aria-labelledby={`${autoId}-tab-${activeTab}`}
          className="mt-3"
        >
          {children(activeTab)}
        </div>
      )}
    </div>
  );
}

LiquidTabs.displayName = 'LiquidTabs';
