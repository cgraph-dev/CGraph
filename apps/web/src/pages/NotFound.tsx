import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import GlassCard from '@/components/ui/GlassCard';
import { HapticFeedback } from '@/lib/animations/AnimationEngine';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient particles */}
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-0.5 h-0.5 rounded-full bg-primary-400 pointer-events-none"
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
        transition={{ duration: 0.5 }}
        className="text-center relative z-10"
      >
        <GlassCard variant="holographic" glow glowColor="rgba(16, 185, 129, 0.3)" className="p-12 max-w-lg">
          {/* 404 Number with animation */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 300, damping: 20 }}
            className="mb-6"
          >
            <div className="relative inline-block">
              <h1 className="text-9xl font-bold bg-gradient-to-r from-primary-400 via-purple-400 to-primary-400 bg-clip-text text-transparent">
                404
              </h1>
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-primary-500/20 via-purple-500/20 to-primary-500/20 blur-3xl"
                animate={{ opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 3, repeat: Infinity }}
              />
            </div>
          </motion.div>

          {/* Icon */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, type: 'spring', stiffness: 400, damping: 15 }}
            className="mb-6 flex justify-center"
          >
            <div className="p-4 bg-gradient-to-br from-primary-500/20 to-purple-500/20 rounded-full">
              <ExclamationTriangleIcon className="h-16 w-16 text-primary-400" />
            </div>
          </motion.div>

          {/* Text */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h2 className="text-3xl font-bold bg-gradient-to-r from-white via-primary-200 to-purple-200 bg-clip-text text-transparent mb-4">
              Page Not Found
            </h2>
            <p className="text-gray-400 mb-8 max-w-md mx-auto">
              The page you're looking for doesn't exist or has been moved. Let's get you back on track.
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
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-600 to-purple-600 hover:from-primary-500 hover:to-purple-500 text-white font-medium rounded-lg transition-all relative overflow-hidden group"
                style={{ boxShadow: '0 0 30px rgba(16, 185, 129, 0.3)' }}
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100"
                  transition={{ duration: 0.3 }}
                />
                <svg className="h-5 w-5 relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                  />
                </svg>
                <span className="relative z-10">Go Home</span>
              </motion.button>
            </Link>
          </motion.div>
        </GlassCard>
      </motion.div>
    </div>
  );
}
