/**
 * CGraph Liquid Glass — SearchInput
 *
 * Glass search bar with magnifying-glass icon, animated clear button,
 * spring-physics expand on focus.
 *
 * @module components/liquid-glass/lg-search-input
 */
import { type InputHTMLAttributes, useState, useId, type Ref } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { springPreset } from './shared';

export interface LGSearchInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /** Controlled value. */
  value?: string;
  /** Callback when clear button is clicked. */
  onClear?: () => void;
  /** sm | md | lg */
  inputSize?: 'sm' | 'md' | 'lg';
}

const sizeMap = {
  sm: 'h-8 text-xs pl-8 pr-8',
  md: 'h-10 text-sm pl-9 pr-9',
  lg: 'h-12 text-base pl-10 pr-10',
} as const;

const iconSizeMap = {
  sm: 'h-3.5 w-3.5',
  md: 'h-4 w-4',
  lg: 'h-5 w-5',
} as const;

/** Liquid Glass search input with pill shape and spring-expand on focus. */
export function LGSearchInput({
  ref,
  className,
  value,
  onClear,
  inputSize = 'md',
  onChange,
  ...props
}: LGSearchInputProps & { ref?: Ref<HTMLInputElement> }) {
  const [isFocused, setIsFocused] = useState(false);
  const autoId = useId();
  const inputId = props.id ?? autoId;
  const hasValue = value !== undefined ? value.length > 0 : false;

  return (
    <motion.div
      className="relative w-full"
      animate={{ scale: isFocused ? 1.01 : 1 }}
      transition={springPreset}
    >
      {/* Search icon */}
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500">
        <svg
          className={cn(iconSizeMap[inputSize])}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.35-4.35" />
        </svg>
      </span>

      <input
        ref={ref}
        id={inputId}
        type="search"
        role="searchbox"
        value={value}
        onChange={onChange}
        className={cn(
          'w-full',
          'bg-white/60 backdrop-blur-[16px] backdrop-saturate-[1.5]',
          'dark:bg-[rgb(30,32,40)]/60',
          'border border-slate-200/60 dark:border-white/[0.08]',
          'rounded-full',
          'text-slate-800 placeholder:text-slate-400 dark:text-white dark:placeholder:text-gray-500',
          'outline-none transition-all duration-200',
          'focus:border-blue-300/70 focus:bg-white/80 dark:focus:bg-[rgb(30,32,40)]/80',
          'focus:shadow-[0_0_0_3px_rgba(147,197,253,0.3),0_0_16px_rgba(147,197,253,0.15)]',
          'disabled:pointer-events-none disabled:opacity-50',
          sizeMap[inputSize],
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
        {...props}
      />

      {/* Clear button */}
      <AnimatePresence>
        {hasValue && onClear && (
          <motion.button
            type="button"
            className={cn(
              'absolute right-2.5 top-1/2 -translate-y-1/2',
              'flex items-center justify-center rounded-full',
              'h-5 w-5 bg-slate-200/80 text-slate-500',
              'dark:bg-white/[0.12] dark:text-gray-400',
              'cursor-pointer hover:bg-slate-300/80 dark:hover:bg-white/[0.20]',
              'transition-colors duration-150'
            )}
            onClick={onClear}
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.7 }}
            transition={springPreset}
            aria-label="Clear search"
          >
            <svg
              className="h-3 w-3"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </motion.button>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
