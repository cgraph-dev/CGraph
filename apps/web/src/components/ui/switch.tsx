/**
 * Switch Component
 *
 * Toggle switch for boolean settings with spring physics.
 */

import { motion } from 'motion/react';
import { springs } from '@/lib/animation-presets';

export interface SwitchProps {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
  id?: string;
}

/**
 * unknown for the ui module.
 */
/**
 * Switch component.
 */
export function Switch({
  checked = false,
  onCheckedChange,
  disabled = false,
  className = '',
  id,
}: SwitchProps) {
  return (
    <motion.button
      type="button"
      role="switch"
      aria-checked={checked}
      id={id}
      disabled={disabled}
      onClick={() => onCheckedChange?.(!checked)}
      whileTap={{ scale: 0.95 }}
      className={`
        relative inline-flex h-6 w-11 items-center rounded-full
        transition-colors duration-200 ease-in-out
        focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2
        focus:ring-offset-background
        disabled:opacity-50 disabled:cursor-not-allowed
        ${checked ? 'bg-primary' : 'bg-surfaceBorder'}
        ${className}
      `}
    >
      <motion.span
        className="inline-block h-4 w-4 rounded-full bg-white shadow-sm"
        animate={{ x: checked ? 24 : 4 }}
        transition={springs.snappy}
      />
    </motion.button>
  );
}

export default Switch;
