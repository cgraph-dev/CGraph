/**
 * ScanStep component
 * @module pages/settings/two-factor-setup
 */

import { motion } from 'motion/react';
import { containerVariants, itemVariants } from './constants';
import type { TwoFactorSetupData } from './types';

interface ScanStepProps {
  isLoading: boolean;
  setupData: TwoFactorSetupData | null;
  copiedSecret: boolean;
  onCopySecret: () => void;
  onContinue: () => void;
}

/**
 * unknown for the settings module.
 */
/**
 * Scan Step component.
 */
export function ScanStep({
  isLoading,
  setupData,
  copiedSecret,
  onCopySecret,
  onContinue,
}: ScanStepProps) {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      <motion.div variants={itemVariants} className="text-center">
        <h2 className="text-xl font-bold text-white">Scan QR Code</h2>
        <p className="mt-2 text-sm text-gray-400">Scan this code with your authenticator app</p>
      </motion.div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
        </div>
      ) : setupData ? (
        <>
          {/* QR Code */}
          <motion.div variants={itemVariants} className="flex justify-center">
            <div className="rounded-2xl bg-white p-4">
              <img src={setupData.qrCodeUrl} alt="2FA QR Code" className="h-48 w-48" />
            </div>
          </motion.div>

          {/* Manual Entry */}
          <motion.div variants={itemVariants}>
            <p className="mb-2 text-center text-sm text-gray-400">Or enter this code manually:</p>
            <div className="flex items-center gap-2 rounded-xl bg-dark-800/50 p-3">
              <code className="flex-1 text-center font-mono text-lg tracking-wider text-primary-400">
                {setupData.secret.match(/.{1,4}/g)?.join(' ')}
              </code>
              <button
                type="button"
                onClick={onCopySecret}
                className="p-2 text-gray-400 transition-colors hover:text-white"
              >
                {copiedSecret ? (
                  <svg
                    className="h-5 w-5 text-green-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                )}
              </button>
            </div>
          </motion.div>

          <motion.button
            variants={itemVariants}
            onClick={onContinue}
            className="w-full rounded-xl bg-gradient-to-r from-primary-500 to-purple-600 py-3 font-medium text-white shadow-lg shadow-primary-500/25 transition-all hover:scale-[1.02] hover:shadow-primary-500/40"
          >
            Continue
          </motion.button>
        </>
      ) : null}
    </motion.div>
  );
}
