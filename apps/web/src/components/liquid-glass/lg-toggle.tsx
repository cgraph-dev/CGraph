/**
 * CGraph Liquid Glass — Toggle
 *
 * Frosted-glass toggle switch with spring-physics knob animation,
 * iridescent accent when active, and accessible labelling.
 *
 * @module components/liquid-glass/lg-toggle
 */
import { useId, type ComponentPropsWithoutRef, type Ref } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { springSnap } from './shared';

export interface LGToggleProps extends Omit<ComponentPropsWithoutRef<'button'>, 'onChange'> {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  label?: string;
  size?: 'sm' | 'md';
}

const trackSize = {
  sm: 'h-5 w-9',
  md: 'h-6 w-11',
} as const;

const knobSize = {
  sm: 'h-3.5 w-3.5',
  md: 'h-4.5 w-4.5',
} as const;

const knobTravel = {
  sm: 16,
  md: 20,
} as const;

/** Liquid Glass toggle switch with spring knob animation. */
export function LGToggle({
  ref,
  checked = false,
  onChange,
  label,
  size = 'md',
  disabled,
  className,
  ...props
}: LGToggleProps & { ref?: Ref<HTMLButtonElement> }) {
  const autoId = useId();

  return (
    <div className={cn('inline-flex items-center gap-2.5', className)}>
      <button
        ref={ref}
        id={autoId}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange?.(!checked)}
        className={cn(
          'relative flex-shrink-0 cursor-pointer rounded-full',
          'transition-colors duration-200',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300/60 focus-visible:ring-offset-2',
          'disabled:pointer-events-none disabled:opacity-50',
          checked
            ? 'bg-blue-500 shadow-[0_0_12px_rgba(147,197,253,0.4)]'
            : 'border border-slate-200/60 bg-white/60 backdrop-blur-[12px]',
          trackSize[size]
        )}
        {...props}
      >
        <motion.span
          className={cn(
            'absolute left-1 top-1/2 -translate-y-1/2 rounded-full',
            'shadow-sm',
            checked ? 'bg-white' : 'bg-slate-400',
            knobSize[size]
          )}
          animate={{ x: checked ? knobTravel[size] : 0 }}
          transition={springSnap}
          aria-hidden="true"
        />
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
