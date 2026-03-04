/**
 * BackupStep component
 * @module pages/settings/two-factor-setup
 */

import { motion } from 'motion/react';
import { containerVariants, itemVariants } from './constants';

interface BackupStepProps {
  backupCodes: string[];
  isLoading: boolean;
  copiedBackup: boolean;
  onCopyBackupCodes: () => void;
  onComplete: () => void;
}

/**
 * unknown for the settings module.
 */
/**
 * Backup Step component.
 */
export function BackupStep({
  backupCodes,
  isLoading,
  copiedBackup,
  onCopyBackupCodes,
  onComplete,
}: BackupStepProps) {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      <motion.div variants={itemVariants} className="text-center">
        <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-yellow-500/20 text-yellow-400">
          <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-white">Save Backup Codes</h2>
        <p className="mt-2 text-sm text-gray-400">
          Store these codes safely. You&apos;ll need them if you lose access to your authenticator.
        </p>
      </motion.div>

      {/* Backup Codes Grid */}
      <motion.div variants={itemVariants} className="rounded-xl bg-dark-800/50 p-4">
        <div className="mb-4 grid grid-cols-2 gap-2">
          {backupCodes.map((code, index) => (
            <div
              key={index}
              className="rounded-lg bg-dark-700 px-3 py-2 font-mono text-sm text-gray-300"
            >
              {code}
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={onCopyBackupCodes}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-dark-600 py-2 text-sm text-gray-400 transition-colors hover:bg-dark-700 hover:text-white"
        >
          {copiedBackup ? (
            <>
              <svg
                className="h-4 w-4 text-green-500"
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
              Copied!
            </>
          ) : (
            <>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
              Copy All Codes
            </>
          )}
        </button>
      </motion.div>

      <motion.div
        variants={itemVariants}
        className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-3 text-sm text-yellow-400"
      >
        <strong>Important:</strong> Each code can only be used once. Store them in a secure location
        like a password manager.
      </motion.div>

      <motion.button
        variants={itemVariants}
        onClick={onComplete}
        disabled={isLoading}
        className="w-full rounded-xl bg-gradient-to-r from-primary-500 to-purple-600 py-3 font-medium text-white shadow-lg shadow-primary-500/25 transition-all hover:scale-[1.02] hover:shadow-primary-500/40 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isLoading ? 'Enabling 2FA...' : "I've Saved My Codes"}
      </motion.button>
    </motion.div>
  );
}
