/**
 * MinimalProfileCard - Simple profile display
 */

import { memo } from 'react';
import { motion } from 'framer-motion';
import type { CardProps } from './types';
import { AnimatedAvatar } from '../AnimatedAvatar';

export const MinimalProfileCard = memo(function MinimalProfileCard({
  state,
  colors,
  speedMultiplier,
}: CardProps) {
  return (
    <div className="flex items-center gap-4">
      <AnimatedAvatar
        borderType={state.avatarBorder}
        borderColor={state.avatarBorderColor}
        size="medium"
        speedMultiplier={speedMultiplier}
      />
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-bold text-white">CGraph User</h3>
          {/* Electric Title Badge with Animation */}
          <motion.div
            className="relative overflow-hidden rounded-full px-2 py-0.5 text-[10px] font-bold"
            style={{
              background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
            }}
            whileHover={{ scale: 1.05 }}
          >
            {/* Electric spark effect */}
            <motion.div
              className="pointer-events-none absolute inset-0"
              animate={{
                boxShadow: [
                  `0 0 10px ${colors.glow}, inset 0 0 5px ${colors.glow}`,
                  `0 0 20px ${colors.glow}, inset 0 0 10px ${colors.glow}`,
                  `0 0 10px ${colors.glow}, inset 0 0 5px ${colors.glow}`,
                ],
              }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
            <span className="relative z-10 flex items-center gap-0.5">
              <motion.span
                animate={{ rotate: [0, 15, -15, 0] }}
                transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
              >
                ⚡
              </motion.span>
              Speed Demon
            </span>
          </motion.div>
        </div>
        {state.showStatus && (
          <div className="mt-1 flex items-center gap-1.5 text-sm text-emerald-400">
            <motion.span
              className="h-2 w-2 rounded-full bg-emerald-400"
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            ></motion.span>
            Online
          </div>
        )}
      </div>
    </div>
  );
});
