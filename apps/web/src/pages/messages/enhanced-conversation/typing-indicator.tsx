/**
 * TypingIndicator - animated typing dots
 */

import { durations } from '@cgraph/animation-constants';
import { motion } from 'framer-motion';

interface TypingIndicatorProps {
  isVisible: boolean;
}

/**
 * unknown for the messages module.
 */
/**
 * Typing Indicator component.
 */
export function TypingIndicator({ isVisible }: TypingIndicatorProps) {
  if (!isVisible) return null;

  return (
    <motion.div
      className="flex items-center gap-2"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
    >
      <div className="flex space-x-1">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="h-2 w-2 rounded-full bg-primary-400"
            animate={{ y: [0, -8, 0] }}
            transition={{
              duration: durations.dramatic.ms / 1000,
              repeat: Infinity,
              delay: i * 0.1,
            }}
          />
        ))}
      </div>
    </motion.div>
  );
}
