/**
 * CGraph Liquid Glass — Select / Dropdown
 *
 * Frosted-glass dropdown with spring-physics open/close, iridescent
 * highlight on active option, and keyboard navigation.
 *
 * @module @cgraph/ui/select
 */
import {
  forwardRef,
  useState,
  useRef,
  useEffect,
  useCallback,
  useId,
  type ReactNode,
  type KeyboardEvent,
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn, springPreset, glassSurface } from '../shared';

/* ── Types ─────────────────────────────────────────────────────────────────── */

export interface LiquidSelectOption {
  value: string;
  label: string;
  icon?: ReactNode;
  disabled?: boolean;
}

export interface LiquidSelectProps {
  options: LiquidSelectOption[];
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  label?: string;
  disabled?: boolean;
  className?: string;
  /** sm | md | lg */
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-10 px-3.5 text-sm',
  lg: 'h-12 px-4 text-base',
} as const;

/* ── Component ─────────────────────────────────────────────────────────────── */

export const LiquidSelect = forwardRef<HTMLDivElement, LiquidSelectProps>(
  (
    {
      options,
      value,
      onChange,
      placeholder = 'Select\u2026',
      label,
      disabled,
      className,
      size = 'md',
    },
    ref
  ) => {
    const [isOpen, setIsOpen] = useState(false);
    const [activeIdx, setActiveIdx] = useState(-1);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const listRef = useRef<HTMLUListElement>(null);
    const autoId = useId();

    const selected = options.find((o) => o.value === value);

    /* Close on outside click */
    useEffect(() => {
      if (!isOpen) return;
      const handler = (e: MouseEvent) => {
        const target = e.target;
        if (!(target instanceof Node)) return;
        if (!triggerRef.current?.contains(target) && !listRef.current?.contains(target)) {
          setIsOpen(false);
        }
      };
      document.addEventListener('mousedown', handler);
      return () => document.removeEventListener('mousedown', handler);
    }, [isOpen]);

    /* Keyboard navigation */
    const handleKeyDown = useCallback(
      (e: KeyboardEvent) => {
        if (disabled) return;
        switch (e.key) {
          case 'ArrowDown':
            e.preventDefault();
            if (!isOpen) {
              setIsOpen(true);
              setActiveIdx(0);
            } else {
              setActiveIdx((prev) => Math.min(prev + 1, options.length - 1));
            }
            break;
          case 'ArrowUp':
            e.preventDefault();
            setActiveIdx((prev) => Math.max(prev - 1, 0));
            break;
          case 'Enter':
          case ' ':
            e.preventDefault();
            if (isOpen && activeIdx >= 0) {
              const opt = options[activeIdx];
              if (opt && !opt.disabled) {
                onChange?.(opt.value);
                setIsOpen(false);
                triggerRef.current?.focus();
              }
            } else {
              setIsOpen(true);
            }
            break;
          case 'Escape':
            setIsOpen(false);
            triggerRef.current?.focus();
            break;
        }
      },
      [isOpen, activeIdx, options, onChange, disabled]
    );

    const select = (opt: LiquidSelectOption) => {
      if (opt.disabled) return;
      onChange?.(opt.value);
      setIsOpen(false);
      triggerRef.current?.focus();
    };

    return (
      <div ref={ref} className={cn('relative w-full', className)} onKeyDown={handleKeyDown}>
        {label && (
          <label className="mb-1.5 block text-sm font-medium text-slate-700" id={`${autoId}-label`}>
            {label}
          </label>
        )}

        {/* Trigger */}
        <button
          ref={triggerRef}
          type="button"
          role="combobox"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-labelledby={label ? `${autoId}-label` : undefined}
          aria-controls={`${autoId}-list`}
          disabled={disabled}
          onClick={() => setIsOpen((p) => !p)}
          className={cn(
            'flex w-full items-center justify-between',
            'bg-white/60 backdrop-blur-[16px] backdrop-saturate-[1.5]',
            'border border-slate-200/60',
            'rounded-[var(--lg-radius-sm)]',
            'text-slate-800 transition-all duration-200',
            'cursor-pointer outline-none',
            'focus:border-blue-300/70 focus:bg-white/80',
            'focus:shadow-[0_0_0_3px_rgba(147,197,253,0.3),0_0_16px_rgba(147,197,253,0.15)]',
            'disabled:pointer-events-none disabled:opacity-50',
            sizeClasses[size]
          )}
        >
          <span className={cn(!selected && 'text-slate-400')}>
            {selected ? (
              <span className="flex items-center gap-2">
                {selected.icon}
                {selected.label}
              </span>
            ) : (
              placeholder
            )}
          </span>
          {/* Chevron */}
          <motion.svg
            className="h-4 w-4 text-slate-400"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={springPreset}
            aria-hidden="true"
          >
            <path d="M6 9l6 6 6-6" />
          </motion.svg>
        </button>

        {/* Dropdown list */}
        <AnimatePresence>
          {isOpen && (
            <motion.ul
              ref={listRef}
              id={`${autoId}-list`}
              role="listbox"
              aria-labelledby={label ? `${autoId}-label` : undefined}
              className={cn(
                'absolute z-50 mt-1.5 w-full overflow-hidden',
                'rounded-[var(--lg-radius-sm)]',
                glassSurface,
                'shadow-[0_8px_30px_rgba(0,0,0,0.08),0_4px_8px_rgba(0,0,0,0.04)]',
                'py-1'
              )}
              initial={{ opacity: 0, y: -6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.97 }}
              transition={springPreset}
            >
              {options.map((opt, idx) => (
                <li
                  key={opt.value}
                  role="option"
                  aria-selected={opt.value === value}
                  aria-disabled={opt.disabled}
                  className={cn(
                    'flex cursor-pointer items-center gap-2 px-3.5 py-2 text-sm select-none',
                    'transition-colors duration-150',
                    opt.value === value && 'bg-blue-50/80 font-medium text-blue-700',
                    idx === activeIdx && opt.value !== value && 'bg-slate-100/60',
                    opt.disabled && 'pointer-events-none opacity-40',
                    !opt.disabled && 'hover:bg-slate-100/60'
                  )}
                  onClick={() => select(opt)}
                  onMouseEnter={() => setActiveIdx(idx)}
                >
                  {opt.icon}
                  {opt.label}
                  {opt.value === value && (
                    <svg
                      className="ml-auto h-4 w-4 text-blue-500"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2.5}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  )}
                </li>
              ))}
            </motion.ul>
          )}
        </AnimatePresence>
      </div>
    );
  }
);

LiquidSelect.displayName = 'LiquidSelect';
