/**
 * HoloBadge Component
 * @version 4.0.0
 */

import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { HoloPreset, getTheme } from './types';

interface HoloBadgeProps {
  children: ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'md' | 'lg';
  preset?: HoloPreset;
  pulse?: boolean;
  className?: string;
}

export function HoloBadge({
  children,
  variant = 'default',
  size = 'md',
  preset = 'cyan',
  pulse = false,
  className,
}: HoloBadgeProps) {
  const theme = getTheme(preset);

  const variantColors: Record<string, string> = {
    default: theme.primary,
    success: theme.success,
    warning: theme.warning,
    error: theme.error,
    info: theme.info,
  };

  const sizeStyles: Record<string, string> = {
    sm: 'px-1.5 py-0.5 text-[10px]',
    md: 'px-2 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm',
  };

  const color = variantColors[variant];

  return (
    <motion.span
      className={cn(
        'inline-flex items-center rounded-md font-medium uppercase tracking-wide',
        sizeStyles[size],
        className
      )}
      style={{
        background: `${color}20`,
        color: color,
        border: `1px solid ${color}50`,
        boxShadow: `0 0 8px ${color}30`,
      }}
      animate={pulse ? { scale: [1, 1.05, 1] } : undefined}
      transition={{ duration: 1.5, repeat: Infinity }}
    >
      {children}
    </motion.span>
  );
}
