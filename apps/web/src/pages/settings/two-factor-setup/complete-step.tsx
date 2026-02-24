/**
 * CompleteStep component
 * @module pages/settings/two-factor-setup
 */

import { motion } from 'framer-motion';
import { containerVariants, itemVariants } from './constants';
import { springs } from '@/lib/animation-presets';

interface CompleteStepProps {
  onDone: () => void;
}

export function CompleteStep({ onDone }: CompleteStepProps) {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="py-8 text-center"
    >
      <motion.div
        variants={itemVariants}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={springs.wobbly}
        className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full bg-green-500/20 text-green-400"
      >
        <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </motion.div>

      <motion.h2 variants={itemVariants} className="mb-2 text-2xl font-bold text-white">
        2FA Enabled!
      </motion.h2>

      <motion.p variants={itemVariants} className="mb-8 text-gray-400">
        Your account is now protected with two-factor authentication.
      </motion.p>

      <motion.button
        variants={itemVariants}
        onClick={onDone}
        className="rounded-xl bg-gradient-to-r from-primary-500 to-purple-600 px-8 py-3 font-medium text-white shadow-lg shadow-primary-500/25 transition-all hover:scale-[1.02] hover:shadow-primary-500/40"
      >
        Done
      </motion.button>
    </motion.div>
  );
}
