/**
 * Toggle Component
 *
 * Animated toggle switch with label and description.
 */

import { motion } from 'motion/react';
import { springs } from '@/lib/animation-presets';

import type { ToggleProps } from './types';

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * unknown for the settings module.
 */
/**
 * Toggle component.
 */
export function Toggle({ enabled, onChange, label, description, icon, disabled }: ToggleProps) {
  return (
    <div
      className={`flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.04] p-4 ${disabled ? 'opacity-50' : 'hover:border-white/[0.08]'} transition-colors`}
    >
      <div className="flex items-center gap-3">
        {icon && <div className={`text-gray-400 ${enabled ? 'text-primary-400' : ''}`}>{icon}</div>}
        <div>
          <h4 className="text-sm font-medium text-white">{label}</h4>
          {description && <p className="mt-0.5 text-xs text-gray-400">{description}</p>}
        </div>
      </div>

      <motion.button
        onClick={onChange}
        disabled={disabled}
        whileTap={{ scale: 0.95 }}
        className={`relative h-6 w-11 rounded-full transition-colors duration-200 ${enabled ? 'bg-primary-500' : 'bg-white/[0.08]'} ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'} `}
        style={enabled ? { boxShadow: '0 0 8px rgba(16, 185, 129, 0.4)' } : undefined}
      >
        <motion.div
          className="absolute top-1 h-4 w-4 rounded-full bg-white shadow-md"
          animate={{ left: enabled ? 24 : 4 }}
          transition={springs.snappy}
        />
      </motion.button>
    </div>
  );
}

export default Toggle;
