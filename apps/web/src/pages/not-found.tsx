/** NotFound — 404 page with animated illustration and navigation links. */
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { GlassCard } from '@/shared/components/ui';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { tweens, loop, springs } from '@/lib/animation-presets';

export default function NotFound() {
  const { t } = useTranslation('common');
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950 p-4">
      {/* Ambient particles */}
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="pointer-events-none absolute h-0.5 w-0.5 rounded-full bg-primary-400"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0.1, 0.4, 0.1],
            scale: [1, 1.5, 1],
          }}
          transition={{
            duration: 5 + Math.random() * 3,
            repeat: Infinity,
            delay: Math.random() * 5,
            ease: 'easeInOut',
          }}
        />
      ))}

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={tweens.smooth}
        className="relative z-10 text-center"
      >
        <GlassCard
          variant="holographic"
          glow
          glowColor="rgba(16, 185, 129, 0.3)"
          className="max-w-lg p-12"
        >
          {/* 404 Number with animation */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, ...springs.stiff }}
            className="mb-6"
          >
            <div className="relative inline-block">
              <h1 className="bg-gradient-to-r from-primary-400 via-purple-400 to-primary-400 bg-clip-text text-9xl font-bold text-transparent">
                404
              </h1>
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-primary-500/20 via-purple-500/20 to-primary-500/20 blur-3xl"
                animate={{ opacity: [0.3, 0.6, 0.3] }}
                transition={loop(tweens.decorative)}
              />
            </div>
          </motion.div>

          {/* Icon */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, ...springs.snappy }}
            className="mb-6 flex justify-center"
          >
            <div className="rounded-full bg-gradient-to-br from-primary-500/20 to-purple-500/20 p-4">
              <ExclamationTriangleIcon className="h-16 w-16 text-primary-400" />
            </div>
          </motion.div>

          {/* Text */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h2 className="mb-4 bg-gradient-to-r from-white via-primary-200 to-purple-200 bg-clip-text text-3xl font-bold text-transparent">
              {t('errors.pageNotFound')}
            </h2>
            <p className="mx-auto mb-8 max-w-md text-gray-400">
              {t('errors.pageNotFoundDescription')}
            </p>
          </motion.div>

          {/* Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Link to="/" onClick={() => HapticFeedback.medium()}>
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="group relative inline-flex items-center gap-2 overflow-hidden rounded-lg bg-gradient-to-r from-primary-600 to-purple-600 px-6 py-3 font-medium text-white transition-all hover:from-primary-500 hover:to-purple-500"
                style={{ boxShadow: '0 0 30px rgba(16, 185, 129, 0.3)' }}
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100"
                  transition={tweens.standard}
                />
                <svg
                  className="relative z-10 h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                  />
                </svg>
                <span className="relative z-10">{t('errors.goHome')}</span>
              </motion.button>
            </Link>
          </motion.div>
        </GlassCard>
      </motion.div>
    </div>
  );
}
