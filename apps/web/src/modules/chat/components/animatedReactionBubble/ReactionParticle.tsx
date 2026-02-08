/**
 * ReactionParticle – single emoji particle used during the burst effect.
 */

import { motion } from 'framer-motion';
import { PARTICLE_COUNT } from '@/modules/chat/components/animatedReactionBubble/constants';

export interface ReactionParticleProps {
  emoji: string;
  index: number;
}

export function ReactionParticle({ emoji, index }: ReactionParticleProps) {
  const angle = (index / PARTICLE_COUNT) * Math.PI * 2;
  const distance = 40 + Math.random() * 20;

  return (
    <motion.div
      className="pointer-events-none absolute text-lg"
      style={{
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)',
      }}
      initial={{ opacity: 0, scale: 0 }}
      animate={{
        opacity: [0, 1, 0],
        scale: [0, 1.2, 0],
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance,
      }}
      transition={{
        duration: 0.6,
        delay: index * 0.03,
        ease: 'easeOut',
      }}
    >
      {emoji}
    </motion.div>
  );
}
