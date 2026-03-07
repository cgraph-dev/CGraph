/**
 * Styled button component.
 * @module
 */
import React from 'react';
import { motion, type HTMLMotionProps } from 'motion/react';
import { useMotionSafe } from '@/hooks/useMotionSafe';
import { useMagneticButton } from './magnetic-button';

interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'ref'> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success' | 'glass';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  /** Set false to disable magnetic/shimmer effects on this instance */
  animated?: boolean;
}

/**
 * Versatile button component with multiple variants and sizes.
 */
export function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  animated = true,
  disabled,
  children,
  className = '',
  ref,
  ...props
}: ButtonProps & { ref?: React.Ref<HTMLButtonElement> }) {
  const { tapScale, hoverScale, springs, shouldAnimate } = useMotionSafe();
  const magnetic = useMagneticButton();

  const isMagnetic = animated && shouldAnimate && (variant === 'primary' || variant === 'glass');
  const hasShimmer = animated && shouldAnimate && variant === 'primary';

  const baseStyles =
    'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

  const variantStyles: Record<typeof variant, string> = {
    primary:
      'bg-gradient-to-r from-[var(--color-brand-purple)] to-[var(--color-brand-cyan)] text-white hover:opacity-90 shadow-none hover:shadow-none hover:-translate-y-0.5',
    secondary:
      'bg-white/[0.06] text-white hover:bg-white/[0.10] border border-white/[0.08] hover:border-white/[0.15] hover:shadow-md',
    outline:
      'border border-white/[0.12] text-white/80 hover:bg-white/[0.04] hover:border-white/[0.20] focus:ring-[var(--color-brand-purple)]',
    ghost:
      'text-white/60 hover:bg-white/[0.06] hover:text-white focus:ring-[var(--color-brand-purple)]',
    danger:
      'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 shadow-sm hover:shadow-lg hover:shadow-red-600/30 hover:-translate-y-0.5',
    success:
      'bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-emerald-500 shadow-sm hover:shadow-lg hover:shadow-emerald-600/30 hover:-translate-y-0.5',
    glass:
      'bg-white/[0.06] border border-white/[0.08] hover:bg-white/[0.12] text-white backdrop-blur-sm',
  };

  const sizeStyles: Record<typeof size, string> = {
    sm: 'px-3 py-1.5 text-sm gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-6 py-3 text-base gap-2',
  };

  return (
    <motion.button
      ref={isMagnetic ? magnetic.ref : ref}
      disabled={disabled || isLoading}
      className={` ${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${fullWidth ? 'w-full' : ''} ${hasShimmer ? 'btn-shimmer' : ''} ${className} `}
      style={isMagnetic ? { x: magnetic.style.x, y: magnetic.style.y } : undefined}
      onMouseMove={isMagnetic ? magnetic.onMouseMove : undefined}
      onMouseLeave={isMagnetic ? magnetic.onMouseLeave : undefined}
      whileTap={tapScale(0.97)}
      whileHover={hoverScale(1.02)}
      transition={springs.snappy}
      {...props}
    >
      {isLoading ? (
        <>
          <LoadingSpinner size={size} />
          <span>Loading...</span>
        </>
      ) : (
        <>
          {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
          {children}
          {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
        </>
      )}
    </motion.button>
  );
}

Button.displayName = 'Button';

const SPINNER_SIZE_CLASSES = {
  sm: 'w-3.5 h-3.5',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
  icon: 'w-5 h-5',
} as const;

interface LoadingSpinnerProps {
  size: keyof typeof SPINNER_SIZE_CLASSES;
  className?: string;
}

function LoadingSpinner({ size, className = '' }: LoadingSpinnerProps): React.ReactElement {
  return (
    <svg
      className={`animate-spin ${SPINNER_SIZE_CLASSES[size]} ${className}`}
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

// Icon button variant for toolbar actions
interface IconButtonProps extends Omit<HTMLMotionProps<'button'>, 'ref'> {
  icon: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  label: string; // Required for accessibility
  isLoading?: boolean;
}

/**
 * unknown for the ui module.
 */
/**
 * Icon Button component.
 */
export function IconButton({
  icon,
  variant = 'ghost',
  size = 'md',
  label,
  isLoading = false,
  disabled,
  className = '',
  ref,
  ...props
}: IconButtonProps & { ref?: React.Ref<HTMLButtonElement> }) {
  const { tapScale, hoverScale, springs } = useMotionSafe();

  const baseStyles =
    'inline-flex items-center justify-center rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

  const variantStyles: Record<typeof variant, string> = {
    primary:
      'bg-gradient-to-r from-[var(--color-brand-purple)] to-[var(--color-brand-cyan)] text-white hover:opacity-90',
    secondary: 'bg-white/[0.06] text-white hover:bg-white/[0.10] border border-white/[0.08]',
    ghost:
      'text-white/60 hover:bg-white/[0.06] hover:text-white focus:ring-[var(--color-brand-purple)]',
    danger: 'text-red-400 hover:bg-red-500/10 hover:text-red-300 focus:ring-red-500',
  };

  const sizeStyles: Record<typeof size, string> = {
    sm: 'p-1.5',
    md: 'p-2',
    lg: 'p-3',
  };

  const iconSizes: Record<typeof size, string> = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  return (
    <motion.button
      ref={ref}
      disabled={disabled || isLoading}
      aria-label={label}
      title={label}
      className={` ${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className} `}
      whileTap={tapScale(0.95)}
      whileHover={hoverScale(1.05)}
      transition={springs.snappy}
      {...props}
    >
      {isLoading ? (
        <LoadingSpinner size="icon" className={iconSizes[size]} />
      ) : (
        <span className={iconSizes[size]}>{icon}</span>
      )}
    </motion.button>
  );
}

IconButton.displayName = 'IconButton';

export default Button;
