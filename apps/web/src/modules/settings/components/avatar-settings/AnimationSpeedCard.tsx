/**
 * AnimationSpeedCard component
 * @module modules/settings/components/avatar-settings
 */

import { motion } from 'framer-motion';
import { GlassCard, useAvatarStyle } from '@/shared/components/ui';
import { HapticFeedback } from '@/lib/animations/AnimationEngine';
import { ANIMATION_SPEEDS } from './constants';

export function AnimationSpeedCard() {
  const { style, updateStyle } = useAvatarStyle();

  return (
    <GlassCard className="p-6" variant="frosted">
      <h3 className="mb-4 text-lg font-semibold text-white">Animation Speed</h3>
      <div className="grid grid-cols-4 gap-3">
        {ANIMATION_SPEEDS.map((speed) => (
          <motion.button
            key={speed}
            onClick={() => {
              updateStyle('animationSpeed', speed);
              HapticFeedback.light();
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`relative rounded-lg p-3 text-sm capitalize transition-all ${
              style.animationSpeed === speed
                ? 'border-2 border-primary-500 bg-primary-500/20 text-white'
                : 'border border-dark-600 bg-dark-700/50 text-gray-400 hover:border-primary-500/50 hover:text-white'
            } `}
          >
            {speed}
          </motion.button>
        ))}
      </div>
    </GlassCard>
  );
}
