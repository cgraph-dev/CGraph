/**
 * OverallStatusBanner component
 * @module modules/chat/components/e2ee-connection-tester
 */

import { motion } from 'framer-motion';
import {
  ShieldCheckIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import type { OverallStatus } from './types';
import { tweens, loop } from '@/lib/animation-presets';

interface OverallStatusBannerProps {
  status: OverallStatus;
  totalDuration: number;
}

export function OverallStatusBanner({ status, totalDuration }: OverallStatusBannerProps) {
  if (status === 'idle') return null;

  return (
    <motion.div
      className={`mb-6 rounded-xl border-2 p-4 ${
        status === 'success'
          ? 'border-green-500/30 bg-green-500/10'
          : status === 'partial'
            ? 'border-yellow-500/30 bg-yellow-500/10'
            : status === 'failed'
              ? 'border-red-500/30 bg-red-500/10'
              : 'border-primary-500/30 bg-primary-500/10'
      }`}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center gap-3">
        {status === 'testing' && (
          <motion.div
            animate={{ rotate: 360 }}
            transition={loop(tweens.ambient)}
          >
            <ShieldCheckIcon className="h-6 w-6 text-primary-400" />
          </motion.div>
        )}
        {status === 'success' && <CheckCircleIcon className="h-6 w-6 text-green-400" />}
        {status === 'partial' && <ExclamationTriangleIcon className="h-6 w-6 text-yellow-400" />}
        {status === 'failed' && <XCircleIcon className="h-6 w-6 text-red-400" />}

        <div className="flex-1">
          <div className="font-semibold text-white">
            {status === 'testing' && 'Running diagnostics...'}
            {status === 'success' && 'All Tests Passed! Connection is secure.'}
            {status === 'partial' && 'Tests completed with warnings'}
            {status === 'failed' && 'Some tests failed'}
          </div>
          {totalDuration > 0 && (
            <div className="mt-0.5 text-xs text-gray-400">
              Completed in {(totalDuration / 1000).toFixed(2)}s
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
