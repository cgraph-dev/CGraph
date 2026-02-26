/**
 * Message particle animation effects.
 * @module
 */
import { durations } from '@cgraph/animation-constants';
import { motion } from 'framer-motion';

interface MessageParticlesProps {
  isOwnMessage: boolean;
}

/**
 * unknown for the chat module.
 */
/**
 * Message Particles component.
 */
export function MessageParticles({ isOwnMessage }: MessageParticlesProps) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute h-1 w-1 rounded-full bg-primary-400"
          style={{
            left: isOwnMessage ? '90%' : '10%',
            top: `${20 + Math.random() * 60}%`,
          }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{
            opacity: [0, 0.8, 0],
            scale: [0, 1.5, 0],
            x: (isOwnMessage ? -1 : 1) * (30 + Math.random() * 40),
            y: -30 - Math.random() * 40,
          }}
          transition={{
            duration: durations.extended.ms / 1000 + Math.random() * 0.4,
            delay: i * 0.05,
            ease: 'easeOut',
          }}
        />
      ))}
    </div>
  );
}
