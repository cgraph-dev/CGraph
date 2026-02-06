/**
 * E2EEConnectionTester Component - Main component
 * @module modules/chat/components/e2ee-connection-tester
 */

import { motion } from 'framer-motion';
import {
  ShieldCheckIcon,
  XMarkIcon,
  ArrowPathIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';
import { GlassCard } from '@/shared/components/ui';
import { useAuthStore } from '@/stores/authStore';
import type { E2EEConnectionTesterProps } from './types';
import { useE2EETests } from './useE2EETests';
import { TestResultItem } from './TestResultItem';
import { OverallStatusBanner } from './OverallStatusBanner';

export default function E2EEConnectionTester({
  conversationId,
  recipientId,
  recipientName,
  onClose,
}: E2EEConnectionTesterProps) {
  useAuthStore(); // Keep store connected
  const { tests, isRunning, overallStatus, totalDuration, runTests } = useE2EETests(
    conversationId,
    recipientId
  );

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <GlassCard variant="holographic" glow borderGradient className="p-6">
          {/* Header */}
          <div className="mb-6 flex items-start justify-between">
            <div>
              <h3 className="flex items-center gap-3 text-2xl font-bold text-white">
                <ShieldCheckIcon className="h-7 w-7 text-green-400" />
                E2EE Connection Test
              </h3>
              <p className="mt-1 text-gray-400">
                Testing encryption with{' '}
                <span className="font-semibold text-primary-400">{recipientName}</span>
              </p>
            </div>
            <button
              onClick={onClose}
              className="rounded-full p-2 text-gray-400 transition-colors hover:bg-dark-700 hover:text-white"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Overall Status */}
          <OverallStatusBanner status={overallStatus} totalDuration={totalDuration} />

          {/* Test Results */}
          <div className="mb-6 space-y-2">
            {tests.map((test, index) => (
              <TestResultItem key={test.name} test={test} index={index} />
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            {!isRunning ? (
              <>
                <motion.button
                  onClick={runTests}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary-600 to-purple-600 px-6 py-3 font-semibold text-white transition-all hover:from-primary-500 hover:to-purple-500"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <ShieldCheckIcon className="h-5 w-5" />
                  {overallStatus === 'idle' ? 'Run Tests' : 'Run Again'}
                </motion.button>
                <motion.button
                  onClick={onClose}
                  className="rounded-xl bg-dark-700 px-6 py-3 font-semibold text-white transition-colors hover:bg-dark-600"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Close
                </motion.button>
              </>
            ) : (
              <button
                disabled
                className="flex flex-1 cursor-not-allowed items-center justify-center gap-2 rounded-xl bg-dark-700 px-6 py-3 font-semibold text-gray-500"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                  <ArrowPathIcon className="h-5 w-5" />
                </motion.div>
                Testing in progress...
              </button>
            )}
          </div>

          {/* Info Box */}
          <motion.div
            className="mt-4 rounded-lg border border-blue-500/20 bg-blue-500/10 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <div className="flex gap-3">
              <InformationCircleIcon className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-400" />
              <div className="text-xs text-gray-300">
                <p className="mb-1 font-semibold text-blue-300">About this test</p>
                <p>
                  This diagnostic performs real cryptographic operations using Web Crypto API to
                  verify that end-to-end encryption is functioning correctly. All tests use
                  industry-standard algorithms: X25519 for key exchange, AES-256-GCM for encryption,
                  and HMAC-SHA256 for authentication.
                </p>
              </div>
            </div>
          </motion.div>
        </GlassCard>
      </motion.div>
    </motion.div>
  );
}
