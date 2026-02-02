/**
 * TypingIndicator Component
 *
 * Animated typing indicator with bouncing dots and glass effect.
 * Shows when other users are typing in a conversation.
 */

import { memo } from 'react';
import { motion } from 'framer-motion';
import GlassCard from '@/components/ui/GlassCard';

interface TypingIndicatorProps {
  /** Array of usernames currently typing */
  typing: string[];
  /** Whether to enable glow effects */
  enableGlow?: boolean;
  /** Glass effect variant */
  glassEffect?: 'default' | 'frosted' | 'crystal' | 'neon' | 'holographic';
}

function TypingIndicatorComponent({
  typing,
  enableGlow = false,
  glassEffect = 'crystal',
}: TypingIndicatorProps) {
  if (typing.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.9 }}
      transition={{ duration: 0.3, type: 'spring' }}
    >
      <div className="ml-4 inline-block">
        <GlassCard
          variant={glassEffect}
          glow={enableGlow}
          className="inline-flex items-center gap-3 rounded-2xl px-4 py-2"
        >
          <div className="flex space-x-1.5">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="h-2.5 w-2.5 rounded-full bg-gradient-to-r from-primary-400 to-purple-400"
                animate={{
                  y: [0, -8, 0],
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  delay: i * 0.2,
                  ease: 'easeInOut',
                }}
                style={{
                  boxShadow: enableGlow ? '0 0 10px rgba(16, 185, 129, 0.5)' : 'none',
                }}
              />
            ))}
          </div>
          <span className="bg-gradient-to-r from-primary-400 to-purple-400 bg-clip-text text-sm font-medium text-transparent">
            {typing.length === 1 ? `${typing[0]} is typing...` : 'typing...'}
          </span>
        </GlassCard>
      </div>
    </motion.div>
  );
}

export const TypingIndicator = memo(TypingIndicatorComponent);
