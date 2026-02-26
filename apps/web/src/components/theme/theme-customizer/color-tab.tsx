/**
 * Color Tab Component
 *
 * Color preset selection with visual swatches.
 */

import { motion } from 'framer-motion';
import { CheckIcon } from '@heroicons/react/24/outline';
import { THEME_COLORS, type ThemeColorPreset } from '@/stores';

import type { ColorTabProps } from './types';

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * Color Tab component.
 */
export function ColorTab({ selectedColor, onSelectColor }: ColorTabProps) {
  // type assertion: Object.entries loses key type, re-assert ThemeColorPreset tuple
   
  const colors = Object.entries(THEME_COLORS) as [
    ThemeColorPreset,
    (typeof THEME_COLORS)[ThemeColorPreset],
  ][]; // type assertion: Object.entries loses key type, restoring ThemeColorPreset

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <h3 className="mb-4 text-lg font-semibold text-white">Color Presets</h3>
      <p className="mb-6 text-sm text-gray-400">Choose a color theme that represents your style</p>

      <div className="grid grid-cols-4 gap-4">
        {colors.map(([preset, config]) => (
          <motion.button
            key={preset}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onSelectColor(preset)}
            className={`relative rounded-xl p-4 transition-all ${
              selectedColor === preset
                ? 'ring-2 ring-white ring-offset-2 ring-offset-dark-800'
                : 'hover:bg-dark-700'
            }`}
          >
            <div
              className="mb-2 aspect-square w-full rounded-lg"
              style={{
                background: `linear-gradient(135deg, ${config.primary}, ${config.secondary})`,
                boxShadow: `0 4px 20px ${config.glow}`,
              }}
            />
            <span className="text-sm font-medium text-gray-300">{config.name}</span>
            {selectedColor === preset && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-white"
              >
                <CheckIcon className="h-3 w-3 text-dark-900" />
              </motion.div>
            )}
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}

export default ColorTab;
