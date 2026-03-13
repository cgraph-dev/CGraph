/**
 * TestResultItem component
 * @module modules/chat/components/e2ee-connection-tester
 */

import { motion } from 'motion/react';
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import type { TestResult } from './types';
import { tweens, loop } from '@/lib/animation-presets';

interface TestResultItemProps {
  test: TestResult;
  index: number;
}

/**
 * unknown for the chat module.
 */
/**
 * Test Result Item component.
 */
export function TestResultItem({ test, index }: TestResultItemProps) {
  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircleIcon className="h-5 w-5 text-green-400" />;
      case 'error':
        return <XCircleIcon className="h-5 w-5 text-red-400" />;
      case 'warning':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />;
      case 'running':
        return (
          <motion.div animate={{ rotate: 360 }} transition={loop(tweens.slow)}>
            <ArrowPathIcon className="h-5 w-5 text-primary-400" />
          </motion.div>
        );
      default:
        return <ClockIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <motion.div
      className={`rounded-lg border p-4 transition-all ${
        test.status === 'success'
          ? 'border-green-500/20 bg-green-500/5'
          : test.status === 'error'
            ? 'border-red-500/20 bg-red-500/5'
            : test.status === 'warning'
              ? 'border-yellow-500/20 bg-yellow-500/5'
              : test.status === 'running'
                ? 'border-primary-500/30 bg-primary-500/5'
                : 'border-dark-600 bg-dark-700/30'
      }`}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex-shrink-0">{getStatusIcon(test.status)}</div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <div className="text-sm font-medium text-white">{test.name}</div>
            {test.duration && (
              <span className="whitespace-nowrap text-xs text-gray-500">{test.duration}ms</span>
            )}
          </div>
          <div className="mt-0.5 text-xs text-gray-400">{test.message}</div>
          {test.details && <div className="mt-1 text-xs italic text-gray-500">{test.details}</div>}
        </div>
      </div>
    </motion.div>
  );
}
