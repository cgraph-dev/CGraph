/**
 * Holographic-styled button component.
 * @module
 */
import { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { getTheme } from './constants';
import type { HolographicButtonProps } from './types';
import { tweens, loop } from '@/lib/animation-presets';

/**
 * HolographicButton Component
 *
 * Glowing button with hover and press states
 */
export function HolographicButton({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  colorTheme = 'cyan',
  className,
}: HolographicButtonProps) {
  const theme = getTheme(colorTheme);
  const [isPressed, setIsPressed] = useState(false);

  const sizeClasses: Record<string, string> = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  };

  const variantStyles: Record<string, { background: string; border: string }> = {
    primary: {
      background: `linear-gradient(135deg, ${theme.primary}20, ${theme.secondary}30)`,
      border: `2px solid ${theme.primary}`,
    },
    secondary: {
      background: 'transparent',
      border: `1px solid ${theme.secondary}`,
    },
    danger: {
      background: 'linear-gradient(135deg, rgba(255,50,50,0.2), rgba(255,100,100,0.3))',
      border: '2px solid rgba(255,100,100,0.8)',
    },
    ghost: {
      background: 'transparent',
      border: 'none',
    },
  };

  return (
    <motion.button
      className={cn(
        'relative overflow-hidden rounded-lg font-semibold uppercase tracking-wider',
        'transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-offset-2',
        disabled && 'cursor-not-allowed opacity-50',
        sizeClasses[size],
        className
      )}
      style={{
        ...variantStyles[variant],
        color: variant === 'danger' ? 'rgba(255,150,150,1)' : theme.primary,
        boxShadow: isPressed ? `inset 0 0 20px ${theme.glow}` : `0 0 15px ${theme.glow}`,
      }}
      onClick={disabled || loading ? undefined : onClick}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      whileHover={{ scale: disabled ? 1 : 1.05 }}
      whileTap={{ scale: disabled ? 1 : 0.95 }}
    >
      {/* Hover glow effect */}
      <motion.div
        className="pointer-events-none absolute inset-0"
        initial={{ opacity: 0 }}
        whileHover={{ opacity: 1 }}
        style={{
          background: `radial-gradient(circle at center, ${theme.glow}, transparent 70%)`,
        }}
      />

      {/* Loading spinner */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            className="h-5 w-5 rounded-full border-2"
            style={{
              borderColor: `${theme.primary} transparent ${theme.primary} transparent`,
            }}
            animate={{ rotate: 360 }}
            transition={loop(tweens.slow)}
          />
        </div>
      )}

      {/* Content */}
      <span className={cn('relative z-10', loading && 'opacity-0')}>{children}</span>
    </motion.button>
  );
}

export default HolographicButton;
