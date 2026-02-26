/**
 * Background effects for LeaderboardPage
 * @module pages/leaderboard
 */

import { durations } from '@cgraph/animation-constants';
import { motion } from 'framer-motion';

/**
 * Confetti particle for celebration effects
 */
export function ConfettiParticle({ delay, color }: { delay: number; color: string }) {
  const randomX = Math.random() * 100;
  const randomRotation = Math.random() * 360;
  const duration = 3 + Math.random() * 2;

  return (
    <motion.div
      className="pointer-events-none absolute h-2 w-2 rounded-sm"
      style={{
        left: `${randomX}%`,
        top: '-10px',
        backgroundColor: color,
        rotate: randomRotation,
      }}
      initial={{ y: -20, opacity: 1 }}
      animate={{
        y: ['0%', '100vh'],
        rotate: [randomRotation, randomRotation + 360],
        opacity: [1, 1, 0],
      }}
      transition={{
        duration,
        delay,
        ease: 'linear',
        repeat: Infinity,
        repeatDelay: Math.random() * 5,
      }}
    />
  );
}

/**
 * Floating particles background
 */
export function FloatingParticles() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden">
      {[...Array(25)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: Math.random() * 4 + 2,
            height: Math.random() * 4 + 2,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            background: `radial-gradient(circle, ${
              ['#8B5CF6', '#EC4899', '#3B82F6', '#10B981', '#F59E0B'][Math.floor(Math.random() * 5)]
            }aa 0%, transparent 70%)`,
          }}
          animate={{
            y: [0, -50, 0],
            x: [0, Math.random() * 30 - 15, 0],
            opacity: [0.2, 0.5, 0.2],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: durations.epic.ms / 1000 + Math.random() * 5,
            repeat: Infinity,
            delay: Math.random() * 5,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

/**
 * Confetti display component
 */
export function ConfettiDisplay({ show, page }: { show: boolean; page: number }) {
  if (!show || page !== 1) return null;

  const colors = ['#FFD700', '#C0C0C0', '#CD7F32', '#8B5CF6', '#EC4899'];

  return (
    <div className="pointer-events-none fixed inset-0 z-50">
      {[...Array(30)].map((_, i) => (
        <ConfettiParticle key={i} delay={i * 0.1} color={colors[i % colors.length]!} />
      ))}
    </div>
  );
}
