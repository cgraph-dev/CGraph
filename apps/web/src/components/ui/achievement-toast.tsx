/**
 * @description AchievementToast — animated achievement unlock notification.
 * Triggered by GamificationChannel WebSocket events.
 * @module components/ui/achievement-toast
 */
import { motion, AnimatePresence } from 'motion/react';
import { GradientText } from '@/components/ui/gradient-text';

interface AchievementToastProps {
  achievement: { title: string; description: string; xp: number; icon: string } | null;
  onDismiss: () => void;
}

/** Renders an animated achievement unlock toast with shimmer and spring entrance. */
export function AchievementToast({ achievement, onDismiss }: AchievementToastProps) {
  return (
    <AnimatePresence>
      {achievement && (
        <motion.div
          initial={{ opacity: 0, y: 60, scale: 0.8, rotateX: -20 }}
          animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
          exit={{ opacity: 0, y: -40, scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 260, damping: 18, mass: 1.2 }}
          className="pointer-events-auto fixed bottom-6 left-1/2 z-50 min-w-72 max-w-sm -translate-x-1/2 cursor-pointer overflow-hidden rounded-2xl"
          style={{
            backdropFilter: 'blur(40px)',
            WebkitBackdropFilter: 'blur(40px)',
            background:
              'linear-gradient(135deg, rgba(139,92,246,0.2) 0%, rgba(6,182,212,0.1) 100%)',
            border: '1px solid rgba(139,92,246,0.4)',
            boxShadow: '0 0 40px rgba(139,92,246,0.3), 0 24px 60px rgba(0,0,0,0.6)',
          }}
          onClick={onDismiss}
        >
          {/* Shimmer effect */}
          <motion.div
            className="pointer-events-none absolute inset-0"
            animate={{ x: ['-100%', '200%'] }}
            transition={{ duration: 1.2, delay: 0.3, ease: 'easeInOut' }}
            style={{
              background:
                'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.08) 50%, transparent 100%)',
            }}
          />

          <div className="relative z-10 flex items-center gap-4 p-4">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 15, delay: 0.15 }}
              className="flex-shrink-0 text-4xl"
            >
              {achievement.icon}
            </motion.div>
            <div className="min-w-0 flex-1">
              <p className="mb-0.5 text-xs uppercase tracking-widest text-white/50">
                Achievement Unlocked
              </p>
              <GradientText className="block truncate text-base font-bold">
                {achievement.title}
              </GradientText>
              <p className="truncate text-sm text-white/60">{achievement.description}</p>
            </div>
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4, type: 'spring', stiffness: 300 }}
              className="flex flex-shrink-0 flex-col items-center"
            >
              <span className="text-lg font-bold text-emerald-400">+{achievement.xp}</span>
              <span className="text-xs text-white/40">XP</span>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
