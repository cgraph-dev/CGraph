/**
 * ReactionParticle – single emoji particle used during the burst effect.
 * Supports standard and "super" (premium) mode with wider spread.
 */

import { motion } from 'framer-motion';
import {
  PARTICLE_COUNT,
  SUPER_PARTICLE_COUNT,
  SUPER_PARTICLE_DISTANCE,
} from '@/modules/chat/components/animatedReactionBubble/constants';

export interface ReactionParticleProps {
  emoji: string;
  index: number;
  isSuper?: boolean;
}

/**
 * unknown for the chat module.
 */
/**
 * Reaction Particle component.
 */
export function ReactionParticle({ emoji, index, isSuper }: ReactionParticleProps) {
  const count = isSuper ? SUPER_PARTICLE_COUNT : PARTICLE_COUNT;
  const baseDistance = isSuper ? SUPER_PARTICLE_DISTANCE : 40;
  const angle = (index / count) * Math.PI * 2;
  const distance = baseDistance + Math.random() * (isSuper ? 40 : 20);
  const duration = isSuper ? 0.9 : 0.6;
  const peakScale = isSuper ? 1.6 : 1.2;

  return (
    <motion.div
      className="pointer-events-none absolute text-lg"
      style={{
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)',
        fontSize: isSuper ? '1.4rem' : undefined,
      }}
      initial={{ opacity: 0, scale: 0 }}
      animate={{
        opacity: [0, 1, 0],
        scale: [0, peakScale, 0],
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance,
      }}
      transition={{
        duration,
        delay: index * (isSuper ? 0.02 : 0.03),
        ease: 'easeOut',
      }}
    >
      {emoji}
    </motion.div>
  );
}
