/**
 * CGraph Liquid Glass — Button
 *
 * Clay-morphism button with colored glow variants, spring-physics
 * hover/tap animations, and full CVA variant API.
 *
 * @module @cgraph/ui/button
 */
import { forwardRef, type ReactNode } from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn, springPreset } from '../shared';

/* ── CVA variant map ───────────────────────────────────────────────────────── */

const buttonVariants = cva(
  /* base — clay-morphism look */
  [
    'relative inline-flex items-center justify-center gap-2',
    'font-medium select-none cursor-pointer',
    'rounded-[var(--lg-radius-sm)]',
    'transition-colors duration-200',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
    'disabled:pointer-events-none disabled:opacity-50',
  ],
  {
    variants: {
      variant: {
        /* Soft glass (default) — translucent surface with iridescent shadow */
        glass: [
          'bg-white/70 backdrop-blur-[16px] backdrop-saturate-[1.6]',
          'border border-slate-200/60',
          'text-slate-800',
          'hover:bg-white/85',
          'shadow-[0_2px_8px_rgba(0,0,0,0.05),inset_0_1px_0_rgba(255,255,255,0.6)]',
          'focus-visible:ring-slate-300/60',
        ],
        /* Colored glow variants — filled with outer glow */
        red: [
          'bg-red-500 text-white',
          'hover:bg-red-600',
          'shadow-[0_0_20px_rgba(252,165,165,0.5),0_0_40px_rgba(252,165,165,0.25)]',
          'focus-visible:ring-red-400/60',
        ],
        blue: [
          'bg-blue-500 text-white',
          'hover:bg-blue-600',
          'shadow-[0_0_20px_rgba(147,197,253,0.5),0_0_40px_rgba(147,197,253,0.25)]',
          'focus-visible:ring-blue-400/60',
        ],
        neutral: [
          'bg-slate-500 text-white',
          'hover:bg-slate-600',
          'shadow-[0_0_20px_rgba(148,163,184,0.4),0_0_40px_rgba(148,163,184,0.2)]',
          'focus-visible:ring-slate-400/60',
        ],
        purple: [
          'bg-purple-500 text-white',
          'hover:bg-purple-600',
          'shadow-[0_0_20px_rgba(196,181,253,0.5),0_0_40px_rgba(196,181,253,0.25)]',
          'focus-visible:ring-purple-400/60',
        ],
        pink: [
          'bg-pink-500 text-white',
          'hover:bg-pink-600',
          'shadow-[0_0_20px_rgba(249,168,212,0.5),0_0_40px_rgba(249,168,212,0.25)]',
          'focus-visible:ring-pink-400/60',
        ],
        green: [
          'bg-green-500 text-white',
          'hover:bg-green-600',
          'shadow-[0_0_20px_rgba(134,239,172,0.5),0_0_40px_rgba(134,239,172,0.25)]',
          'focus-visible:ring-green-400/60',
        ],
        /* Ghost — no background until hover */
        ghost: [
          'bg-transparent text-slate-700',
          'hover:bg-white/50 hover:backdrop-blur-[8px]',
          'focus-visible:ring-slate-300/60',
        ],
        /* Outline — bordered glass */
        outline: [
          'bg-transparent',
          'border border-slate-300/70',
          'text-slate-700',
          'hover:bg-white/40 hover:backdrop-blur-[12px]',
          'focus-visible:ring-slate-300/60',
        ],
      },
      size: {
        sm: 'h-8 px-3 text-xs rounded-lg',
        md: 'h-10 px-4 text-sm',
        lg: 'h-12 px-6 text-base',
        icon: 'h-10 w-10 p-0',
      },
    },
    defaultVariants: {
      variant: 'glass',
      size: 'md',
    },
  }
);

/* ── Component ─────────────────────────────────────────────────────────────── */

export interface LiquidButtonProps
  extends Omit<HTMLMotionProps<'button'>, 'children'>, VariantProps<typeof buttonVariants> {
  /** Optional leading icon. */
  iconLeft?: ReactNode;
  /** Optional trailing icon. */
  iconRight?: ReactNode;
  /** Shows a loading spinner and disables the button. */
  isLoading?: boolean;
  children?: ReactNode;
}

/**
 * Liquid Glass Button.
 *
 * Clay-morphism surface with colored glow, spring-physics hover
 * scale, and accessible focus ring.
 */
export const LiquidButton = forwardRef<HTMLButtonElement, LiquidButtonProps>(
  (
    { className, variant, size, iconLeft, iconRight, isLoading, disabled, children, ...props },
    ref
  ) => {
    const isDisabled = disabled || isLoading;

    return (
      <motion.button
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        disabled={isDisabled}
        whileHover={{ scale: 1.03, y: -1 }}
        whileTap={{ scale: 0.97 }}
        transition={springPreset}
        {...props}
      >
        {isLoading ? (
          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
            />
          </svg>
        ) : (
          iconLeft
        )}
        {children}
        {iconRight}
      </motion.button>
    );
  }
);

LiquidButton.displayName = 'LiquidButton';

export { buttonVariants };
