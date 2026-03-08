/**
 * CGraph Liquid Glass — Toast / Notification
 *
 * Frosted-glass notification toast with spring-physics slide-in,
 * auto-dismiss timer, and colored accent variants.
 *
 * Includes a lightweight store (`useToast`) and a `<LGToastContainer />`
 * that should be rendered once at the app root.
 *
 * @module components/liquid-glass/lg-toast
 */
import { useMemo, useSyncExternalStore, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { springPreset } from './shared';

/* ── Types ─────────────────────────────────────────────────────────────────── */

export type ToastVariant = 'info' | 'success' | 'warning' | 'error';

export interface Toast {
  id: string;
  title: string;
  description?: string;
  variant?: ToastVariant;
  icon?: ReactNode;
  /** Auto dismiss in ms. 0 = manual. Default 5000. */
  duration?: number;
}

type Listener = () => void;

/* ── Store ─────────────────────────────────────────────────────────────────── */

let toasts: Toast[] = [];
const listeners = new Set<Listener>();

function emit() {
  listeners.forEach((l) => l());
}

let counter = 0;

/** Show a toast notification. */
export function toast(t: Omit<Toast, 'id'>) {
  const id = `lg-toast-${++counter}`;
  toasts = [...toasts, { ...t, id }];
  emit();

  const dur = t.duration ?? 5000;
  if (dur > 0) {
    setTimeout(() => dismissToast(id), dur);
  }
  return id;
}

/** Dismiss a toast by ID. */
export function dismissToast(id: string) {
  toasts = toasts.filter((t) => t.id !== id);
  emit();
}

/** Clear all active toasts. */
export function clearAllToasts() {
  toasts = [];
  emit();
}

/* ── Hook ──────────────────────────────────────────────────────────────────── */

/** Hook to access the toast store. */
export function useToast() {
  const snapshot = useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => toasts,
    () => toasts
  );
  return useMemo(
    () => ({ toasts: snapshot, toast, dismiss: dismissToast, clearAll: clearAllToasts }),
    [snapshot]
  );
}

/* ── Variant styling ───────────────────────────────────────────────────────── */

const variantStyles: Record<
  ToastVariant,
  { bar: string; icon: string; glow: string; tint: string }
> = {
  info: {
    bar: 'bg-blue-400',
    icon: 'text-blue-500 dark:text-blue-400',
    glow: 'shadow-[0_8px_30px_rgba(0,0,0,0.08),0_0_16px_rgba(96,165,250,0.12)]',
    tint: 'dark:bg-blue-500/[0.03]',
  },
  success: {
    bar: 'bg-green-400',
    icon: 'text-green-500 dark:text-green-400',
    glow: 'shadow-[0_8px_30px_rgba(0,0,0,0.08),0_0_16px_rgba(134,239,172,0.2)]',
    tint: 'dark:bg-green-500/[0.04]',
  },
  warning: {
    bar: 'bg-amber-400',
    icon: 'text-amber-500 dark:text-amber-400',
    glow: 'shadow-[0_8px_30px_rgba(0,0,0,0.08),0_0_16px_rgba(251,191,36,0.12)]',
    tint: 'dark:bg-amber-500/[0.03]',
  },
  error: {
    bar: 'bg-red-400',
    icon: 'text-red-500 dark:text-red-400',
    glow: 'shadow-[0_8px_30px_rgba(0,0,0,0.08),0_0_16px_rgba(248,113,113,0.15)]',
    tint: 'dark:bg-red-500/[0.04]',
  },
};

const defaultIcons: Record<ToastVariant, ReactNode> = {
  info: (
    <svg
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4M12 8h.01" />
    </svg>
  ),
  success: (
    <svg
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M20 6L9 17l-5-5" />
    </svg>
  ),
  warning: (
    <svg
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01" />
    </svg>
  ),
  error: (
    <svg
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M15 9l-6 6M9 9l6 6" />
    </svg>
  ),
};

/* ── Toast Item ────────────────────────────────────────────────────────────── */

function ToastItem({ item }: { item: Toast }) {
  const v = item.variant ?? 'info';
  const style = variantStyles[v];
  const icon = item.icon ?? defaultIcons[v];

  return (
    <motion.div
      layout
      role="alert"
      className={cn(
        'pointer-events-auto relative flex w-80 items-start gap-3 overflow-hidden',
        'bg-white/[0.82] backdrop-blur-[20px] backdrop-saturate-[1.6]',
        'dark:bg-[rgb(30,32,40)]/[0.82]',
        style.tint,
        'border border-slate-200/60 dark:border-white/[0.08]',
        'rounded-[var(--lg-radius-sm)]',
        style.glow,
        'px-4 py-3.5'
      )}
      initial={{ opacity: 0, x: 60, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 60, scale: 0.95 }}
      transition={springPreset}
    >
      {/* Left accent bar */}
      <div
        className={cn(
          'absolute bottom-0 left-0 top-0 w-1 rounded-l-[var(--lg-radius-sm)]',
          style.bar
        )}
      />

      {/* Icon */}
      <span className={cn('mt-0.5 flex-shrink-0', style.icon)}>{icon}</span>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-slate-800 dark:text-gray-100">{item.title}</p>
        {item.description && (
          <p className="mt-0.5 line-clamp-2 text-xs text-slate-500 dark:text-gray-400">
            {item.description}
          </p>
        )}
      </div>

      {/* Dismiss */}
      <button
        type="button"
        onClick={() => dismissToast(item.id)}
        className={cn(
          'mt-0.5 flex-shrink-0',
          'flex h-5 w-5 items-center justify-center rounded-full',
          'text-slate-400 hover:bg-slate-100/60 hover:text-slate-600',
          'dark:text-gray-500 dark:hover:bg-white/[0.08] dark:hover:text-gray-300',
          'cursor-pointer transition-colors duration-150'
        )}
        aria-label="Dismiss notification"
      >
        <svg
          className="h-3.5 w-3.5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          strokeLinecap="round"
          aria-hidden="true"
        >
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>
    </motion.div>
  );
}

/* ── Container ─────────────────────────────────────────────────────────────── */

export interface LGToastContainerProps {
  /** Position on screen. Default: bottom-right. */
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

const positionClasses: Record<NonNullable<LGToastContainerProps['position']>, string> = {
  'top-right': 'top-4 right-4',
  'top-left': 'top-4 left-4',
  'bottom-right': 'bottom-4 right-4',
  'bottom-left': 'bottom-4 left-4',
};

/** Container for rendering toast notifications. */
export function LGToastContainer({ position = 'bottom-right' }: LGToastContainerProps) {
  const { toasts: items } = useToast();

  return (
    <div
      className={cn(
        'pointer-events-none fixed z-[9999] flex flex-col gap-2',
        positionClasses[position]
      )}
      aria-live="polite"
      aria-relevant="additions removals"
    >
      <AnimatePresence mode="popLayout">
        {items.map((item) => (
          <ToastItem key={item.id} item={item} />
        ))}
      </AnimatePresence>
    </div>
  );
}

LGToastContainer.displayName = 'LGToastContainer';
