/**
 * HoloButton Component
 * @version 4.0.0
 */

import { ReactNode, useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { HoloPreset, getTheme } from './types';

interface HoloButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  preset?: HoloPreset;
  disabled?: boolean;
  loading?: boolean;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  className?: string;
}

export function HoloButton({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  preset = 'cyan',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  className,
}: HoloButtonProps) {
  const theme = getTheme(preset);
  const [isPressed, setIsPressed] = useState(false);

  const sizeStyles: Record<string, string> = {
    xs: 'px-2 py-1 text-xs gap-1',
    sm: 'px-3 py-1.5 text-sm gap-1.5',
    md: 'px-5 py-2.5 text-sm gap-2',
    lg: 'px-6 py-3 text-base gap-2',
    xl: 'px-8 py-4 text-lg gap-3',
  };

  const variantColors = {
    primary: { bg: theme.primary, text: theme.background, glow: theme.glow },
    secondary: { bg: 'transparent', text: theme.primary, glow: theme.glow },
    ghost: { bg: 'transparent', text: theme.textMuted, glow: 'transparent' },
    danger: { bg: theme.error, text: '#fff', glow: theme.error },
    success: { bg: theme.success, text: theme.background, glow: theme.success },
  };

  const colors = variantColors[variant];

  return (
    <motion.button
      onClick={disabled || loading ? undefined : onClick}
      disabled={disabled || loading}
      className={cn(
        'relative inline-flex items-center justify-center rounded-lg font-semibold uppercase tracking-wider',
        'transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        disabled && 'cursor-not-allowed opacity-50',
        fullWidth && 'w-full',
        sizeStyles[size],
        className
      )}
      style={{
        background:
          variant === 'primary'
            ? `linear-gradient(135deg, ${colors.bg}30, ${colors.bg}50)`
            : colors.bg,
        color: colors.text,
        border: `1.5px solid ${variant === 'ghost' ? theme.border : colors.bg}`,
        boxShadow: isPressed
          ? `inset 0 0 20px ${colors.glow}50`
          : `0 0 12px ${colors.glow}40, 0 4px 20px ${colors.glow}20`,
      }}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      whileHover={disabled ? {} : { scale: 1.03, y: -1 }}
      whileTap={disabled ? {} : { scale: 0.97 }}
    >
      {/* Hover glow */}
      <motion.div
        className="pointer-events-none absolute inset-0 rounded-lg"
        initial={{ opacity: 0 }}
        whileHover={{ opacity: 1 }}
        style={{
          background: `radial-gradient(circle at center, ${colors.glow}30, transparent 70%)`,
        }}
      />

      {/* Loading spinner */}
      {loading && (
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div
            className="h-5 w-5 rounded-full border-2"
            style={{ borderColor: `${colors.text} transparent ${colors.text} transparent` }}
            animate={{ rotate: 360 }}
            transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
          />
        </motion.div>
      )}

      {/* Content */}
      <span
        className={cn('relative z-10 flex items-center', sizeStyles[size], loading && 'opacity-0')}
      >
        {icon && iconPosition === 'left' && icon}
        {children}
        {icon && iconPosition === 'right' && icon}
      </span>
    </motion.button>
  );
}
