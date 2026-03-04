/**
 * VerifyStep component
 * @module pages/settings/two-factor-setup
 */

import { motion, AnimatePresence } from 'motion/react';
import { containerVariants, itemVariants } from './constants';

interface VerifyStepProps {
  verificationCode: string[];
  isLoading: boolean;
  error: string;
  onCodeChange: (index: number, value: string) => void;
  onKeyDown: (index: number, e: React.KeyboardEvent) => void;
  onVerify: () => void;
  onBack: () => void;
}

/**
 * unknown for the settings module.
 */
/**
 * Verify Step component.
 */
export function VerifyStep({
  verificationCode,
  isLoading,
  error,
  onCodeChange,
  onKeyDown,
  onVerify,
  onBack,
}: VerifyStepProps) {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      <motion.div variants={itemVariants} className="text-center">
        <h2 className="text-xl font-bold text-white">Verify Setup</h2>
        <p className="mt-2 text-sm text-gray-400">
          Enter the 6-digit code from your authenticator app
        </p>
      </motion.div>

      {/* Code Input */}
      <motion.div variants={itemVariants} className="flex justify-center gap-2">
        {verificationCode.map((digit, index) => (
          <input
            key={index}
            id={`code-${index}`}
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={digit}
            onChange={(e) => onCodeChange(index, e.target.value)}
            onKeyDown={(e) => onKeyDown(index, e)}
            className="h-14 w-12 rounded-xl border-2 border-white/[0.08] bg-white/[0.04] text-center text-2xl font-bold text-white transition-all focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30"
          />
        ))}
      </motion.div>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center text-sm text-red-400"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      <motion.button
        variants={itemVariants}
        onClick={onVerify}
        disabled={isLoading || verificationCode.some((d) => !d)}
        className="w-full rounded-xl bg-gradient-to-r from-primary-500 to-purple-600 py-3 font-medium text-white shadow-lg shadow-primary-500/25 transition-all hover:scale-[1.02] hover:shadow-primary-500/40 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            Verifying...
          </span>
        ) : (
          'Verify Code'
        )}
      </motion.button>

      <motion.button
        variants={itemVariants}
        onClick={onBack}
        className="w-full py-2 text-gray-400 transition-colors hover:text-white"
      >
        Back to QR Code
      </motion.button>
    </motion.div>
  );
}
