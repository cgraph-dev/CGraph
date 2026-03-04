/**
 * CGraph Liquid Glass — Card
 *
 * Frosted-glass card with iridescent border glow on hover,
 * spring-physics lift, and optional header/footer slots.
 *
 * @module @cgraph/ui/card
 */
import { forwardRef, type ReactNode } from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn, springPreset } from '../shared';

/* ── CVA ───────────────────────────────────────────────────────────────────── */

const cardVariants = cva(
  [
    'rounded-[var(--lg-radius)]',
    'border border-slate-200/60',
    'transition-shadow duration-300',
    'overflow-hidden',
  ],
  {
    variants: {
      variant: {
        glass: [
          'bg-white/[0.72] backdrop-blur-[20px] backdrop-saturate-[1.6]',
          'shadow-[0_4px_12px_rgba(0,0,0,0.06),0_2px_4px_rgba(0,0,0,0.04)]',
        ],
        elevated: [
          'bg-white/[0.82] backdrop-blur-[24px] backdrop-saturate-[1.8]',
          'shadow-[0_8px_30px_rgba(0,0,0,0.08),0_4px_8px_rgba(0,0,0,0.04)]',
        ],
        flat: ['bg-white/90 shadow-sm'],
      },
      interactive: {
        true: 'cursor-pointer',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'glass',
      interactive: false,
    },
  }
);

/* ── Component ─────────────────────────────────────────────────────────────── */

export interface LiquidCardProps
  extends Omit<HTMLMotionProps<'div'>, 'children'>, VariantProps<typeof cardVariants> {
  header?: ReactNode;
  footer?: ReactNode;
  /** Compact removes inner padding. */
  compact?: boolean;
  children?: ReactNode;
}

export const LiquidCard = forwardRef<HTMLDivElement, LiquidCardProps>(
  ({ className, variant, interactive, header, footer, compact, children, ...props }, ref) => {
    const isInteractive = interactive === true;

    return (
      <motion.div
        ref={ref}
        className={cn(cardVariants({ variant, interactive }), className)}
        whileHover={
          isInteractive
            ? {
                scale: 1.015,
                y: -2,
                boxShadow:
                  '0 12px 36px rgba(0,0,0,0.1), 0 0 0 1px rgba(147,197,253,0.2), 0 0 24px rgba(196,181,253,0.15)',
              }
            : undefined
        }
        transition={springPreset}
        {...props}
      >
        {header && <div className="border-b border-slate-200/40 px-5 py-3.5">{header}</div>}
        <div className={cn(compact ? '' : 'px-5 py-4')}>{children}</div>
        {footer && <div className="border-t border-slate-200/40 px-5 py-3">{footer}</div>}
      </motion.div>
    );
  }
);

LiquidCard.displayName = 'LiquidCard';

export { cardVariants };
