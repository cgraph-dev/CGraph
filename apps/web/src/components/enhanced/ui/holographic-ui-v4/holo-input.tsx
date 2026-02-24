/**
 * HoloInput Component
 * @version 4.0.0
 */

import { ReactNode, useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { HoloPreset, getTheme } from './types';
import { tweens } from '@/lib/animation-presets';

interface HoloInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: 'text' | 'password' | 'email' | 'number' | 'search';
  preset?: HoloPreset;
  disabled?: boolean;
  error?: string;
  label?: string;
  icon?: ReactNode;
  className?: string;
}

export function HoloInput({
  value,
  onChange,
  placeholder,
  type = 'text',
  preset = 'cyan',
  disabled = false,
  error,
  label,
  icon,
  className,
}: HoloInputProps) {
  const theme = getTheme(preset);
  const [isFocused, setIsFocused] = useState(false);

  const borderColor = error ? theme.error : isFocused ? theme.primary : theme.border;

  return (
    <div className={cn('relative', className)}>
      {label && (
        <label className="mb-2 block text-sm font-medium" style={{ color: theme.textMuted }}>
          {label}
        </label>
      )}

      <motion.div
        className="relative"
        animate={{
          boxShadow: isFocused
            ? `0 0 16px ${error ? theme.error : theme.glow}40`
            : `0 0 8px ${theme.glow}20`,
        }}
        style={{ borderRadius: 8 }}
      >
        {icon && (
          <div
            className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: theme.textMuted }}
          >
            {icon}
          </div>
        )}

        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className={cn(
            'w-full rounded-lg bg-transparent px-4 py-3 outline-none transition-all',
            icon && 'pl-10',
            disabled && 'cursor-not-allowed opacity-50'
          )}
          style={{
            color: theme.text,
            border: `1.5px solid ${borderColor}`,
            background: theme.surface,
          }}
        />

        {/* Focus line */}
        <motion.div
          className="absolute bottom-0 left-1/2 h-0.5 rounded-full"
          style={{ background: error ? theme.error : theme.accent }}
          initial={{ width: 0, x: '-50%' }}
          animate={{ width: isFocused ? '100%' : 0, x: '-50%' }}
          transition={tweens.brisk}
        />
      </motion.div>

      {error && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-1.5 text-sm"
          style={{ color: theme.error }}
        >
          {error}
        </motion.p>
      )}
    </div>
  );
}
