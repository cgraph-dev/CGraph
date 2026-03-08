/**
 * Micro-interactions — Animation utility hooks and components
 *
 * Provides subtle motion primitives for buttons, counters, badges, toggles.
 * All respect prefers-reduced-motion.
 *
 * @module components/ui/micro-interactions
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';

// ── Reduced Motion ─────────────────────────────────────────────────────

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return reduced;
}

// ── useHoverScale ──────────────────────────────────────────────────────

/** Returns motion props for subtle scale on hover */
export function useHoverScale(scale = 1.02) {
  const reduced = usePrefersReducedMotion();
  if (reduced) return {};
  return {
    whileHover: { scale },
    transition: { type: 'spring' as const, stiffness: 400, damping: 25 },
  };
}

// ── useTapScale ────────────────────────────────────────────────────────

/** Returns motion props for scale-down on press */
export function useTapScale(scale = 0.97) {
  const reduced = usePrefersReducedMotion();
  if (reduced) return {};
  return {
    whileTap: { scale },
    transition: { type: 'spring' as const, stiffness: 400, damping: 25 },
  };
}

// ── AnimatedCounter ────────────────────────────────────────────────────

/** Number that rolls up/down when value changes (like Discord member count) */
export function AnimatedCounter({ value, className }: { value: number; className?: string }) {
  const reduced = usePrefersReducedMotion();
  const [prev, setPrev] = useState(value);
  const [current, setCurrent] = useState(value);
  const direction = current > prev ? 1 : -1;

  useEffect(() => {
    setPrev(current);
    setCurrent(value);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- prev tracks prior value; including current would defeat purpose
  }, [value]);

  if (reduced) {
    return <span className={className}>{value.toLocaleString()}</span>;
  }

  return (
    <span className={cn('relative inline-flex overflow-hidden', className)}>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={value}
          initial={{ y: direction * 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: direction * -16, opacity: 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="tabular-nums"
        >
          {value.toLocaleString()}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

// ── PulseBadge ─────────────────────────────────────────────────────────

/** Badge that pulses when count increments */
export function PulseBadge({ count, className }: { count: number; className?: string }) {
  const reduced = usePrefersReducedMotion();
  const prevRef = useRef(count);
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    if (count > prevRef.current) {
      setPulse(true);
      const t = setTimeout(() => setPulse(false), 400);
      prevRef.current = count;
      return () => clearTimeout(t);
    }
    prevRef.current = count;
    return undefined;
  }, [count]);

  if (count <= 0) return null;

  return (
    <motion.span
      animate={
        pulse && !reduced ? { scale: [1, 1.3, 1], transition: { duration: 0.4 } } : { scale: 1 }
      }
      className={cn(
        'inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white',
        className
      )}
    >
      {count > 99 ? '99+' : count}
    </motion.span>
  );
}

// ── SendAnimation ──────────────────────────────────────────────────────

/** Button that morphs to checkmark on success */
export function SendAnimation({
  status,
  onSend,
  children,
  className,
}: {
  status: 'idle' | 'sending' | 'sent';
  onSend?: () => void;
  children?: React.ReactNode;
  className?: string;
}) {
  const reduced = usePrefersReducedMotion();

  return (
    <motion.button
      onClick={onSend}
      disabled={status !== 'idle'}
      className={cn(
        'relative flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors',
        status === 'sent'
          ? 'bg-green-600 text-white'
          : status === 'sending'
            ? 'bg-primary-700 text-white/60'
            : 'bg-primary-600 text-white hover:bg-primary-500',
        className
      )}
      {...(!reduced ? { whileTap: { scale: 0.95 } } : {})}
    >
      <AnimatePresence mode="wait">
        {status === 'sent' ? (
          <motion.svg
            key="check"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={3}
          >
            <motion.path
              d="M5 13l4 4L19 7"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            />
          </motion.svg>
        ) : status === 'sending' ? (
          <motion.div
            key="loader"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"
          />
        ) : (
          <motion.span
            key="text"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {children || 'Send'}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

// ── ToggleSwitch ───────────────────────────────────────────────────────

/** Animated toggle with slide + color transition */
export function ToggleSwitch({
  checked,
  onChange,
  size = 'md',
  disabled = false,
}: {
  checked: boolean;
  onChange?: (val: boolean) => void;
  size?: 'sm' | 'md';
  disabled?: boolean;
}) {
  const reduced = usePrefersReducedMotion();
  const isSmall = size === 'sm';
  const trackW = isSmall ? 32 : 40;
  const trackH = isSmall ? 18 : 22;
  const thumbSize = isSmall ? 14 : 18;
  const travel = trackW - thumbSize - 4;

  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => !disabled && onChange?.(!checked)}
      className={cn(
        'relative rounded-full transition-colors',
        checked ? 'bg-primary-600' : 'bg-white/[0.12]',
        disabled && 'cursor-not-allowed opacity-40'
      )}
      style={{ width: trackW, height: trackH }}
    >
      <motion.div
        className="absolute left-[2px] top-[2px] rounded-full bg-white shadow-sm"
        style={{ width: thumbSize, height: thumbSize }}
        animate={{ x: checked ? travel : 0 }}
        transition={reduced ? { duration: 0 } : { type: 'spring', stiffness: 500, damping: 30 }}
      />
    </button>
  );
}

// ── StaggerChildren ────────────────────────────────────────────────────

/** Wrapper that staggers children entrance with spring physics */
export function StaggerChildren({
  children,
  staggerDelay = 0.06,
  className,
}: {
  children: React.ReactNode;
  staggerDelay?: number;
  className?: string;
}) {
  const reduced = usePrefersReducedMotion();

  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: reduced ? 0 : staggerDelay,
          },
        },
      }}
    >
      {React.Children.map(children, (child) =>
        React.isValidElement(child) ? (
          <motion.div
            variants={{
              hidden: reduced ? { opacity: 1 } : { opacity: 0, y: 12 },
              visible: { opacity: 1, y: 0 },
            }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          >
            {child}
          </motion.div>
        ) : (
          child
        )
      )}
    </motion.div>
  );
}

// ── RippleButton ───────────────────────────────────────────────────────

/** Material-design ripple effect on click */
export function RippleButton({
  children,
  onClick,
  className,
}: {
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  className?: string;
}) {
  const reduced = usePrefersReducedMotion();
  const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number }>>([]);
  const nextId = useRef(0);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!reduced) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const id = nextId.current++;
      setRipples((prev) => [...prev, { id, x, y }]);
      setTimeout(() => setRipples((prev) => prev.filter((r) => r.id !== id)), 600);
    }
    onClick?.(e);
  };

  return (
    <button onClick={handleClick} className={cn('relative overflow-hidden', className)}>
      {children}
      <AnimatePresence>
        {ripples.map(({ id, x, y }) => (
          <motion.span
            key={id}
            className="pointer-events-none absolute rounded-full bg-white/25"
            style={{ left: x - 20, top: y - 20, width: 40, height: 40 }}
            initial={{ scale: 0, opacity: 0.5 }}
            animate={{ scale: 6, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        ))}
      </AnimatePresence>
    </button>
  );
}

export default {
  useHoverScale,
  useTapScale,
  AnimatedCounter,
  PulseBadge,
  SendAnimation,
  ToggleSwitch,
  StaggerChildren,
  RippleButton,
};
