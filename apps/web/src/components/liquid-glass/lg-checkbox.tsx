/**
 * CGraph Liquid Glass — Checkbox
 *
 * Frosted-glass checkbox with spring-physics checkmark animation,
 * iridescent glow on check, and accessible labelling.
 *
 * @module components/liquid-glass/lg-checkbox
 */
import { useId, type ComponentPropsWithoutRef, type Ref } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { springSnap } from './shared';

export interface LGCheckboxProps extends Omit<ComponentPropsWithoutRef<'button'>, 'onChange'> {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  label?: string;
  indeterminate?: boolean;
}

/** Liquid Glass checkbox with spring-animated checkmark. */
export function LGCheckbox({
  ref,
  checked = false,
  onChange,
  label,
  indeterminate,
  disabled,
  className,
  ...props
}: LGCheckboxProps & { ref?: Ref<HTMLButtonElement> }) {
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
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300/60 focus-visible:ring-offset-2',
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
          className="cursor-pointer select-none text-sm font-medium text-slate-700"
        >
          {label}
        </label>
      )}
    </div>
  );
}
