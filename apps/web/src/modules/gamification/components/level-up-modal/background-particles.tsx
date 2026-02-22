import { motion } from 'framer-motion';

const PARTICLE_COLORS = ['#10b981', '#8b5cf6', '#ec4899', '#f59e0b'] as const;

/**
 * 30 floating animated particles rendered behind the modal content.
 */
export default function BackgroundParticles() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {[...Array(30)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute h-2 w-2 rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            background: `linear-gradient(135deg, ${PARTICLE_COLORS[i % 4]}, transparent)`,
          }}
          animate={{
            y: [0, -30, 0],
            x: [0, Math.random() * 20 - 10, 0],
            opacity: [0, 1, 0],
            scale: [0, 1.5, 0],
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 2,
          }}
        />
      ))}
    </div>
  );
}
