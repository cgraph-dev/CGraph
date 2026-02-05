/**
 * Typing Preview Component
 *
 * Animated preview for typing indicator styles.
 */

import { motion } from 'framer-motion';

// =============================================================================
// TYPES
// =============================================================================

interface TypingPreviewProps {
  type: string;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function TypingPreview({ type }: TypingPreviewProps) {
  if (type === 'dots' || type === 'wave') {
    return (
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="h-2 w-2 rounded-full bg-gray-400"
            animate={{
              y: type === 'wave' ? [0, -6, 0] : [0, -4, 0],
              opacity: [0.4, 1, 0.4],
            }}
            transition={{
              duration: 0.6,
              repeat: Infinity,
              delay: i * 0.15,
            }}
          />
        ))}
      </div>
    );
  }

  if (type === 'pulse') {
    return (
      <motion.div
        className="h-6 w-6 rounded-full border-2 border-gray-400"
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.6, 1, 0.6],
        }}
        transition={{ duration: 1, repeat: Infinity }}
      />
    );
  }

  return (
    <div className="flex gap-1">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="h-2 w-2 rounded-full bg-gray-400"
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2 }}
        />
      ))}
    </div>
  );
}

export default TypingPreview;
