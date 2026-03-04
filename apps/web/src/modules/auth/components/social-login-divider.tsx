/**
 * SocialLoginDivider Component
 *
 * Animated divider for separating form sections.
 * Features:
 * - Multiple styles
 * - Animated line
 * - Customizable text
 */

import React from 'react';
import { motion } from 'motion/react';
import { tweens } from '@/lib/animation-presets';

export interface SocialLoginDividerProps {
  text?: string;
  variant?: 'default' | 'gradient' | 'dots';
  className?: string;
}

/**
 * unknown for the auth module.
 */
/**
 * Social Login Divider component.
 */
export function SocialLoginDivider({
  text = 'or continue with',
  variant = 'default',
  className = '',
}: SocialLoginDividerProps): React.ReactElement {
  if (variant === 'gradient') {
    return (
      <div className={`relative flex items-center justify-center py-4 ${className}`}>
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ ...tweens.smooth, delay: 0.2 }}
          className="absolute inset-0 flex items-center"
        >
          <div className="h-px w-full bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        </motion.div>
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="relative bg-dark-900 px-4 text-sm text-foreground-muted"
        >
          {text}
        </motion.span>
      </div>
    );
  }

  if (variant === 'dots') {
    return (
      <div className={`flex items-center justify-center gap-3 py-4 ${className}`}>
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 + i * 0.1 }}
            className="h-1.5 w-1.5 rounded-full bg-white/30"
          />
        ))}
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-sm text-white/50"
        >
          {text}
        </motion.span>
        {[0, 1, 2].map((i) => (
          <motion.div
            key={`right-${i}`}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5 + i * 0.1 }}
            className="h-1.5 w-1.5 rounded-full bg-white/30"
          />
        ))}
      </div>
    );
  }

  // Default variant
  return (
    <div className={`relative flex items-center py-4 ${className}`}>
      <motion.div
        initial={{ scaleX: 0, originX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ ...tweens.standard, delay: 0.2 }}
        className="flex-grow border-t border-white/10"
      />
      <motion.span
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="px-4 text-sm text-white/50"
      >
        {text}
      </motion.span>
      <motion.div
        initial={{ scaleX: 0, originX: 1 }}
        animate={{ scaleX: 1 }}
        transition={{ ...tweens.standard, delay: 0.2 }}
        className="flex-grow border-t border-white/10"
      />
    </div>
  );
}

export default SocialLoginDivider;
