/**
 * ShapeCard component
 * @module modules/settings/components/avatar-settings
 */

import { motion } from 'motion/react';
import { GlassCard, useAvatarStyle } from '@/shared/components/ui';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import { SHAPES } from './constants';

/**
 * unknown for the settings module.
 */
/**
 * Shape Card display component.
 */
export function ShapeCard() {
  const { style, updateStyle } = useAvatarStyle();

  return (
    <GlassCard className="p-6" variant="frosted">
      <h3 className="mb-4 text-lg font-semibold text-white">Avatar Shape</h3>
      <div className="grid grid-cols-4 gap-3">
        {SHAPES.map((shape) => (
          <motion.button
            key={shape}
            onClick={() => {
              updateStyle('shape', shape);
              HapticFeedback.light();
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`relative rounded-lg p-3 text-sm capitalize transition-all ${
              style.shape === shape
                ? 'border-2 border-primary-500 bg-primary-500/20 text-white'
                : 'border border-white/[0.08] bg-white/[0.06] text-gray-400 hover:border-primary-500/50 hover:text-white'
            } `}
          >
            {shape.replace('-', ' ')}
          </motion.button>
        ))}
      </div>
    </GlassCard>
  );
}
