/**
 * CGraph Liquid Glass — TextInput
 *
 * Frosted-glass input field with iridescent focus glow, spring-physics
 * scale on focus, and optional label/error.
 *
 * @module components/liquid-glass/lg-text-input
 */
import { type InputHTMLAttributes, type ReactNode, useState, useId, type Ref } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { durationsSec } from '@/lib/animation-presets';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { springPreset } from './shared';

/* ── CVA ───────────────────────────────────────────────────────────────────── */

const inputVariants = cva(
  [
    'w-full',
    'bg-white/60 backdrop-blur-[16px] backdrop-saturate-[1.5]',
    'border border-slate-200/60',
    'rounded-[var(--lg-radius-sm)]',
    'text-slate-800 placeholder:text-slate-400',
    'transition-all duration-200',
    'outline-none',
    'focus:bg-white/80 focus:border-blue-300/70',
    'focus:shadow-[0_0_0_3px_rgba(147,197,253,0.3),0_0_16px_rgba(147,197,253,0.15)]',
    'disabled:opacity-50 disabled:pointer-events-none',
  ],
  {
    variants: {
      inputSize: {
        sm: 'h-8 px-3 text-xs',
        md: 'h-10 px-3.5 text-sm',
        lg: 'h-12 px-4 text-base',
      },
      state: {
        default: '',
        error: [
          'border-red-300/70',
          'focus:border-red-400/70',
          'focus:shadow-[0_0_0_3px_rgba(252,165,165,0.3),0_0_16px_rgba(252,165,165,0.15)]',
        ],
        success: [
          'border-green-300/70',
          'focus:border-green-400/70',
          'focus:shadow-[0_0_0_3px_rgba(134,239,172,0.3),0_0_16px_rgba(134,239,172,0.15)]',
        ],
      },
    },
    defaultVariants: {
      inputSize: 'md',
      state: 'default',
    },
  }
);

/* ── Component ─────────────────────────────────────────────────────────────── */

export interface LGTextInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'>, VariantProps<typeof inputVariants> {
  label?: string;
  error?: string;
  hint?: string;
  /** Leading icon slot. */
  iconLeft?: ReactNode;
  /** Trailing icon slot. */
  iconRight?: ReactNode;
}

/** Liquid Glass text input with label, error, and icon slots. */
export function LGTextInput({
  ref,
  className,
  inputSize,
  state,
  label,
  error,
  hint,
  iconLeft,
  iconRight,
  id,
  ...props
}: LGTextInputProps & { ref?: Ref<HTMLInputElement> }) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const [isFocused, setIsFocused] = useState(false);

  const resolvedState = error ? 'error' : state;

  return (
    <div className="flex w-full flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-slate-700">
          {label}
        </label>
      )}

      <motion.div
        className="relative"
        animate={{ scale: isFocused ? 1.01 : 1 }}
        transition={springPreset}
      >
        {iconLeft && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            {iconLeft}
          </span>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            inputVariants({ inputSize, state: resolvedState }),
            iconLeft && 'pl-9',
            iconRight && 'pr-9',
            className
          )}
          onFocus={(e) => {
            setIsFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            props.onBlur?.(e);
          }}
          aria-invalid={resolvedState === 'error' || undefined}
          aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
          {...props}
        />
        {iconRight && (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
            {iconRight}
          </span>
        )}
      </motion.div>

      <AnimatePresence mode="wait">
        {error ? (
          <motion.p
            key="error"
            id={`${inputId}-error`}
            className="text-xs text-red-500"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: durationsSec.fast }}
            role="alert"
          >
            {error}
          </motion.p>
        ) : hint ? (
          <p id={`${inputId}-hint`} className="text-xs text-slate-400">
            {hint}
          </p>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
