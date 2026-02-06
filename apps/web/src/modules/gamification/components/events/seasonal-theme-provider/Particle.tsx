import { motion } from 'framer-motion';
import type { ParticleProps } from './types';

export function Particle({ type, color, delay, duration }: ParticleProps) {
  const getParticleShape = () => {
    switch (type) {
      case 'snow':
        return '❄️';
      case 'hearts':
        return '❤️';
      case 'leaves':
        return '🍂';
      case 'petals':
        return '🌸';
      case 'sparkles':
        return '✨';
      case 'fireflies':
        return '✨';
      default:
        return '•';
    }
  };

  const randomX = Math.random() * 100;
  const randomSway = (Math.random() - 0.5) * 30;

  return (
    <motion.div
      initial={{ top: '-5%', left: `${randomX}%`, opacity: 0 }}
      animate={{
        top: '105%',
        left: `${randomX + randomSway}%`,
        opacity: [0, 1, 1, 0],
      }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        ease: 'linear',
      }}
      className="pointer-events-none absolute"
      style={{ color, fontSize: type === 'hearts' ? '16px' : '12px' }}
    >
      {getParticleShape()}
    </motion.div>
  );
}
