/**
 * BorderStyleCard component
 * @module modules/settings/components/avatar-settings
 */

import { motion } from 'motion/react';
import { GlassCard, useAvatarStyle } from '@/shared/components/ui';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import { BORDER_STYLES } from './constants';
import { springs } from '@/lib/animation-presets';

/**
 * unknown for the settings module.
 */
/**
 * Border Style Card display component.
 */
export function BorderStyleCard() {
  const { style, updateStyle } = useAvatarStyle();

  return (
    <GlassCard className="p-6" variant="frosted">
      <h3 className="mb-4 text-lg font-semibold text-white">Border Style</h3>
      <div className="grid grid-cols-5 gap-3">
        {BORDER_STYLES.map((borderStyle) => (
          <motion.button
            key={borderStyle}
            onClick={() => {
              updateStyle('borderStyle', borderStyle);
              HapticFeedback.light();
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`relative rounded-lg p-3 text-sm capitalize transition-all ${
              style.borderStyle === borderStyle
                ? 'border-2 border-primary-500 bg-primary-500/20 text-white'
                : 'border border-dark-600 bg-dark-700/50 text-gray-400 hover:border-primary-500/50 hover:text-white'
            } `}
          >
            {borderStyle}
            {style.borderStyle === borderStyle && (
              <motion.div
                layoutId="selectedBorderStyle"
                className="absolute inset-0 rounded-lg bg-primary-500/10"
                transition={springs.stiff}
              />
            )}
          </motion.button>
        ))}
      </div>
    </GlassCard>
  );
}
