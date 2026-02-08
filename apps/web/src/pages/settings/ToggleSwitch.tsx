/**
 * Animated toggle switch component used in settings pages.
 */

import { motion } from 'framer-motion';

interface ToggleSwitchProps {
  enabled: boolean;
  onToggle: () => void;
  disabled?: boolean;
}

export function ToggleSwitch({ enabled, onToggle, disabled }: ToggleSwitchProps) {
  return (
    <motion.button
      onClick={onToggle}
      className={`relative h-8 w-14 rounded-full transition-colors ${
        enabled ? 'bg-primary-600' : 'bg-white/10'
      }`}
      whileTap={{ scale: 0.95 }}
      disabled={disabled}
    >
      <motion.div
        className="absolute top-1 h-6 w-6 rounded-full bg-white shadow-lg"
        animate={{ x: enabled ? 30 : 4 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      />
    </motion.button>
  );
}
