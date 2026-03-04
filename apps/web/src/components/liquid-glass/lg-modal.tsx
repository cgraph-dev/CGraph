/**
 * CGraph Liquid Glass — Modal
 *
 * Full-screen backdrop with a frosted-glass modal panel.
 * Spring-physics entrance/exit, focus trap, and Escape to close.
 *
 * @module components/liquid-glass/lg-modal
 */
import {
  useEffect,
  useRef,
  useCallback,
  type ReactNode,
  type KeyboardEvent,
  type Ref,
} from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { durationsSec } from '@/lib/animation-presets';
import { springGentle, glassSurfaceElevated } from './shared';

/* ── Types ─────────────────────────────────────────────────────────────────── */

export interface LGModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children?: ReactNode;
  footer?: ReactNode;
  /** sm | md | lg | xl */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeMap = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
} as const;

/* ── Component ─────────────────────────────────────────────────────────────── */

/** Liquid Glass modal with frosted backdrop and spring entrance. */
export function LGModal({
  ref,
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  className,
}: LGModalProps & { ref?: Ref<HTMLDivElement> }) {
  const panelRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  /* Save & restore focus */
  useEffect(() => {
    if (open) {
      previousFocusRef.current =
        document.activeElement instanceof HTMLElement ? document.activeElement : null;
      // Small timeout to ensure the panel is mounted
      const timer = setTimeout(() => panelRef.current?.focus(), 50);
      return () => clearTimeout(timer);
    }
    previousFocusRef.current?.focus();
    return undefined;
  }, [open]);

  /* Lock body scroll */
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  /* Escape key */
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose]
  );

  return (
    <AnimatePresence>
      {open && (
        <div
          ref={ref}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onKeyDown={handleKeyDown}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-slate-900/20 backdrop-blur-[6px] dark:bg-black/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: durationsSec.normal }}
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Panel */}
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? 'lg-modal-title' : undefined}
            aria-describedby={description ? 'lg-modal-desc' : undefined}
            tabIndex={-1}
            className={cn(
              'relative z-10 w-full',
              'rounded-[var(--lg-radius)]',
              glassSurfaceElevated,
              'outline-none',
              sizeMap[size],
              className
            )}
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={springGentle}
          >
            {/* Header */}
            {(title || description) && (
              <div className="border-b border-slate-200/40 px-6 py-4 dark:border-white/[0.06]">
                {title && (
                  <h2
                    id="lg-modal-title"
                    className="text-lg font-semibold text-slate-900 dark:text-white"
                  >
                    {title}
                  </h2>
                )}
                {description && (
                  <p id="lg-modal-desc" className="mt-1 text-sm text-slate-500 dark:text-gray-400">
                    {description}
                  </p>
                )}
              </div>
            )}

            {/* Body */}
            <div className="px-6 py-5">{children}</div>

            {/* Footer */}
            {footer && (
              <div className="flex items-center justify-end gap-2 border-t border-slate-200/40 px-6 py-3.5 dark:border-white/[0.06]">
                {footer}
              </div>
            )}

            {/* Close button */}
            <button
              type="button"
              onClick={onClose}
              className={cn(
                'absolute right-3 top-3',
                'flex h-7 w-7 items-center justify-center rounded-full',
                'text-slate-400 hover:bg-slate-100/60 hover:text-slate-600',
                'dark:text-gray-500 dark:hover:bg-white/[0.08] dark:hover:text-gray-300',
                'cursor-pointer transition-colors duration-150',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300/60'
              )}
              aria-label="Close dialog"
            >
              <svg
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                aria-hidden="true"
              >
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
