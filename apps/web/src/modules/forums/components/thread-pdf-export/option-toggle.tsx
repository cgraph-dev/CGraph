/**
 * Option Toggle Component
 *
 * Toggle switch for PDF export options.
 */

import { memo } from 'react';
import { motion } from 'motion/react';
import { springs } from '@/lib/animation-presets';
import type { OptionToggleProps } from './types';

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * Toggle switch with label and optional description
 */
export const OptionToggle = memo(function OptionToggle({
  label,
  description,
  checked,
  onChange,
}: OptionToggleProps) {
  return (
    <label className="flex cursor-pointer items-center justify-between">
      <div>
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
        {description && <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>}
      </div>
      <motion.button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        whileTap={{ scale: 0.95 }}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 ${
          checked ? 'bg-orange-600' : 'bg-gray-200 dark:bg-white/[0.06]'
        }`}
      >
        <motion.span
          className="pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0"
          animate={{ x: checked ? 20 : 0 }}
          transition={springs.snappy}
        />
      </motion.button>
    </label>
  );
});

export default OptionToggle;
