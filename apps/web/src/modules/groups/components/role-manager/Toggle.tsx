/**
 * Toggle Component
 *
 * Simple toggle switch for boolean values.
 */

import { motion } from 'framer-motion';
import type { ToggleProps } from './types';

export function Toggle({ value, onChange }: ToggleProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      onClick={() => onChange(!value)}
      className={`h-6 w-12 flex-shrink-0 rounded-full transition-colors ${
        value ? 'bg-primary-600' : 'bg-dark-600'
      }`}
    >
      <motion.div
        animate={{ x: value ? 24 : 0 }}
        className="h-6 w-6 rounded-full bg-white shadow-lg"
      />
    </motion.button>
  );
}
