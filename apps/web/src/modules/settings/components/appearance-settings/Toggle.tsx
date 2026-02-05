/**
 * Toggle Component
 *
 * Animated toggle switch with label and description.
 */

import { motion } from 'framer-motion';

import type { ToggleProps } from './types';

// =============================================================================
// COMPONENT
// =============================================================================

export function Toggle({ enabled, onChange, label, description, icon, disabled }: ToggleProps) {
  return (
    <div
      className={`flex items-center justify-between rounded-lg border border-dark-700 bg-dark-800/50 p-4 ${disabled ? 'opacity-50' : 'hover:border-dark-600'} transition-colors`}
    >
      <div className="flex items-center gap-3">
        {icon && <div className={`text-gray-400 ${enabled ? 'text-primary-400' : ''}`}>{icon}</div>}
        <div>
          <h4 className="text-sm font-medium text-white">{label}</h4>
          {description && <p className="mt-0.5 text-xs text-gray-400">{description}</p>}
        </div>
      </div>

      <button
        onClick={onChange}
        disabled={disabled}
        className={`relative h-6 w-11 rounded-full transition-colors duration-200 ${enabled ? 'bg-primary-500' : 'bg-dark-600'} ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'} `}
      >
        <motion.div
          className="absolute top-1 h-4 w-4 rounded-full bg-white shadow-md"
          animate={{ left: enabled ? 24 : 4 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      </button>
    </div>
  );
}

export default Toggle;
