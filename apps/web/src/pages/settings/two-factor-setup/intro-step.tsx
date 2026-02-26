/**
 * IntroStep component
 * @module pages/settings/two-factor-setup
 */

import { motion } from 'framer-motion';
import { containerVariants, itemVariants, FEATURES } from './constants';

interface IntroStepProps {
  onContinue: () => void;
}

/**
 * unknown for the settings module.
 */
/**
 * Intro Step component.
 */
export function IntroStep({ onContinue }: IntroStepProps) {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      <motion.div variants={itemVariants} className="text-center">
        <div className="mb-4 inline-flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-purple-600 text-white">
          <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-white">Enable Two-Factor Authentication</h2>
        <p className="mt-2 text-gray-400">Add an extra layer of security to your account</p>
      </motion.div>

      <motion.div variants={itemVariants} className="space-y-4">
        {FEATURES.map((item) => (
          <div
            key={item.title}
            className="flex items-start gap-4 rounded-xl border border-dark-600 bg-dark-800/30 p-4"
          >
            <span className="text-2xl">{item.icon}</span>
            <div>
              <h4 className="font-medium text-white">{item.title}</h4>
              <p className="text-sm text-gray-400">{item.desc}</p>
            </div>
          </div>
        ))}
      </motion.div>

      <motion.button
        variants={itemVariants}
        onClick={onContinue}
        className="w-full rounded-xl bg-gradient-to-r from-primary-500 to-purple-600 py-3 font-medium text-white shadow-lg shadow-primary-500/25 transition-all hover:scale-[1.02] hover:shadow-primary-500/40"
      >
        Get Started
      </motion.button>
    </motion.div>
  );
}
