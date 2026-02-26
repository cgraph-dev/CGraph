/**
 * CallControl component - single control button
 */

import { motion } from 'framer-motion';
import type { CallControlProps } from './types';

/**
 * unknown for the calls module.
 */
/**
 * Call Control component.
 */
export function CallControl({ icon, label, onClick, active, danger, disabled }: CallControlProps) {
  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.1 }}
      whileTap={{ scale: disabled ? 1 : 0.95 }}
      onClick={onClick}
      disabled={disabled}
      className={`flex flex-col items-center gap-2 rounded-2xl p-4 transition-colors ${
        danger
          ? 'bg-red-500 text-white hover:bg-red-600'
          : active
            ? 'bg-primary-500 text-white'
            : 'bg-dark-700/80 text-gray-300 hover:bg-dark-600'
      } ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
    >
      {icon}
      <span className="text-xs font-medium">{label}</span>
    </motion.button>
  );
}
