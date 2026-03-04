/**
 * CGraph Liquid Glass — Card
 *
 * Frosted-glass card with iridescent border glow on hover,
 * spring-physics lift, and optional header/footer slots.
 *
 * @module components/liquid-glass/lg-card
 */
import { type ReactNode, type Ref } from 'react';
import { motion, type HTMLMotionProps } from 'motion/react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { springPreset } from './shared';

/* ── CVA ───────────────────────────────────────────────────────────────────── */

const cardVariants = cva(
  [
    'rounded-[var(--lg-radius)]',
    'border border-slate-200/60 dark:border-white/[0.08]',
    'transition-shadow duration-300',
    'overflow-hidden',
  ],
  {
    variants: {
      variant: {
        glass: [
          'bg-white/[0.72] backdrop-blur-[20px] backdrop-saturate-[1.6]',
          'shadow-[0_4px_12px_rgba(0,0,0,0.06),0_2px_4px_rgba(0,0,0,0.04)]',
          'dark:bg-[rgb(30,32,40)]/[0.72] dark:border-white/[0.08] dark:shadow-[0_4px_12px_rgba(0,0,0,0.35),0_2px_4px_rgba(0,0,0,0.25)]',
        ],
        elevated: [
          'bg-white/[0.82] backdrop-blur-[24px] backdrop-saturate-[1.8]',
          'shadow-[0_8px_30px_rgba(0,0,0,0.08),0_4px_8px_rgba(0,0,0,0.04)]',
          'dark:bg-[rgb(30,32,40)]/[0.82] dark:border-white/[0.10] dark:shadow-[0_8px_30px_rgba(0,0,0,0.40),0_4px_8px_rgba(0,0,0,0.25)]',
        ],
        flat: ['bg-white/90 shadow-sm dark:bg-gray-800/90'],
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

export interface LGCardProps
  extends Omit<HTMLMotionProps<'div'>, 'children'>, VariantProps<typeof cardVariants> {
  header?: ReactNode;
  footer?: ReactNode;
  /** Compact removes inner padding. */
  compact?: boolean;
  children?: ReactNode;
}

/** Liquid Glass card with glass, elevated, and flat variants. */
export function LGCard({
  ref,
  className,
  variant,
  interactive,
  header,
  footer,
  compact,
  children,
  ...props
}: LGCardProps & { ref?: Ref<HTMLDivElement> }) {
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
      {header && (
        <div className="border-b border-slate-200/40 px-5 py-3.5 dark:border-white/[0.06]">
          {header}
        </div>
      )}
      <div className={cn(compact ? '' : 'px-5 py-4')}>{children}</div>
      {footer && (
        <div className="border-t border-slate-200/40 px-5 py-3 dark:border-white/[0.06]">
          {footer}
        </div>
      )}
    </motion.div>
  );
}
