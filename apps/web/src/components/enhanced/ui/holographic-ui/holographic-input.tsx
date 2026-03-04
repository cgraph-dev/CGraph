/**
 * Holographic-styled input component.
 * @module
 */
import { useState } from 'react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { getTheme } from './constants';
import type { HolographicInputProps } from './types';
import { tweens } from '@/lib/animation-presets';

/**
 * HolographicInput Component
 *
 * Text input with focus glow animation
 */
export function HolographicInput({
  value,
  onChange,
  placeholder,
  type = 'text',
  disabled = false,
  colorTheme = 'cyan',
  className,
}: HolographicInputProps) {
  const theme = getTheme(colorTheme);
  const [isFocused, setIsFocused] = useState(false);

  return (
    <motion.div
      className={cn('relative', className)}
      animate={{
        boxShadow: isFocused
          ? `0 0 20px ${theme.glow}, inset 0 0 10px ${theme.glow}`
          : `0 0 10px ${theme.glow}40`,
      }}
      style={{
        borderRadius: 8,
      }}
    >
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className={cn(
          'w-full rounded-lg bg-transparent px-4 py-3 outline-none',
          'placeholder-opacity-50 transition-all',
          disabled && 'cursor-not-allowed opacity-50'
        )}
        style={{
          color: theme.primary,
          border: `1px solid ${isFocused ? theme.primary : theme.secondary}50`,
          background: theme.background,
        }}
      />

      {/* Focus indicator line */}
      <motion.div
        className="absolute bottom-0 left-1/2 h-0.5"
        style={{
          background: theme.accent,
          boxShadow: `0 0 10px ${theme.accent}`,
        }}
        initial={{ width: 0, x: '-50%' }}
        animate={{
          width: isFocused ? '100%' : 0,
          x: '-50%',
        }}
        transition={tweens.standard}
      />
    </motion.div>
  );
}

export default HolographicInput;
