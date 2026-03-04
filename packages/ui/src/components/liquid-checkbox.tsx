/**
 * CGraph Liquid Glass — Checkbox
 *
 * Frosted-glass checkbox with spring-physics checkmark animation,
 * iridescent glow on check, and accessible labelling.
 *
 * @module @cgraph/ui/checkbox
 */
import { forwardRef, useId, type ComponentPropsWithoutRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn, springSnap } from '../shared';

export interface LiquidCheckboxProps extends Omit<ComponentPropsWithoutRef<'button'>, 'onChange'> {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  label?: string;
  indeterminate?: boolean;
}

export const LiquidCheckbox = forwardRef<HTMLButtonElement, LiquidCheckboxProps>(
  ({ checked = false, onChange, label, indeterminate, disabled, className, ...props }, ref) => {
    const autoId = useId();

    return (
      <div className={cn('inline-flex items-center gap-2.5', className)}>
        <button
          ref={ref}
          id={autoId}
          type="button"
          role="checkbox"
          aria-checked={indeterminate ? 'mixed' : checked}
          disabled={disabled}
          onClick={() => onChange?.(!checked)}
          className={cn(
            'relative flex h-5 w-5 flex-shrink-0 items-center justify-center',
            'cursor-pointer rounded-md',
            'transition-all duration-200',
            'focus-visible:ring-2 focus-visible:ring-blue-300/60 focus-visible:ring-offset-2 focus-visible:outline-none',
            'disabled:pointer-events-none disabled:opacity-50',
            checked || indeterminate
              ? 'border-blue-500 bg-blue-500 shadow-[0_0_10px_rgba(147,197,253,0.35)]'
              : 'border border-slate-300/60 bg-white/60 backdrop-blur-[12px]'
          )}
          {...props}
        >
          <AnimatePresence mode="wait">
            {(checked || indeterminate) && (
              <motion.svg
                key={indeterminate ? 'minus' : 'check'}
                className="h-3.5 w-3.5 text-white"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={3}
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={springSnap}
                aria-hidden="true"
              >
                {indeterminate ? <path d="M5 12h14" /> : <path d="M20 6L9 17l-5-5" />}
              </motion.svg>
            )}
          </AnimatePresence>
        </button>
        {label && (
          <label
            htmlFor={autoId}
            className="cursor-pointer text-sm font-medium text-slate-700 select-none"
          >
            {label}
          </label>
        )}
      </div>
    );
  }
);

LiquidCheckbox.displayName = 'LiquidCheckbox';
