/**
 * useE2EETests hook - manages E2EE test state and execution
 * @module modules/chat/components/e2ee-connection-tester
 */

import { useState, useCallback } from 'react';
import { HapticFeedback } from '@/lib/animations/AnimationEngine';
import type { TestResult, OverallStatus } from './types';
import { INITIAL_TESTS, SUCCESS_MESSAGES } from './constants';
import { createTestRunner } from './cryptoTests';

export function useE2EETests(conversationId: string, recipientId: string) {
  const [isRunning, setIsRunning] = useState(false);
  const [tests, setTests] = useState<TestResult[]>(INITIAL_TESTS);
  const [overallStatus, setOverallStatus] = useState<OverallStatus>('idle');
  const [testStartTime, setTestStartTime] = useState<number>(0);
  const [totalDuration, setTotalDuration] = useState<number>(0);

  const runSingleTest = useCallback(
    async (index: number): Promise<void> => {
      const startTime = Date.now();

      // Update status to running
      setTests((prev) => prev.map((t, i) => (i === index ? { ...t, status: 'running' } : t)));

      // Wait a bit to show the running state
      await new Promise((resolve) => setTimeout(resolve, 300));

      try {
        const testRunner = createTestRunner(index, conversationId, recipientId);
        await testRunner(setTests);

        const duration = Date.now() - startTime;

        // Update status to success (if not already set to warning by test)
        setTests((prev) =>
          prev.map((t, i) => {
            if (i !== index) return t;
            // Don't override warning status
            if (t.status === 'warning') return { ...t, duration };
            return {
              ...t,
              status: 'success',
              message: SUCCESS_MESSAGES[index] || 'Test passed',
              duration,
            };
          })
        );
      } catch (error: unknown) {
        const duration = Date.now() - startTime;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        setTests((prev) =>
          prev.map((t, i) =>
            i === index
              ? {
                  ...t,
                  status: 'error',
                  message: 'Test failed',
                  details: errorMessage,
                  duration,
                }
              : t
          )
        );
      }
    },
    [conversationId, recipientId]
  );

  const runTests = useCallback(async () => {
    // Reset tests to initial state
    setTests(INITIAL_TESTS);
    setIsRunning(true);
    setOverallStatus('testing');
    const startTime = Date.now();
    setTestStartTime(startTime);
    HapticFeedback.medium();

    // Run each test sequentially
    for (let i = 0; i < INITIAL_TESTS.length; i++) {
      await runSingleTest(i);
    }

    setIsRunning(false);
    setTotalDuration(Date.now() - startTime);

    // Determine overall status from current tests
    setTests((currentTests) => {
      const hasError = currentTests.some((t) => t.status === 'error');
      const hasWarning = currentTests.some((t) => t.status === 'warning');
      const allSuccess = currentTests.every((t) => t.status === 'success');

      if (hasError) {
        setOverallStatus('failed');
        HapticFeedback.error();
      } else if (hasWarning) {
        setOverallStatus('partial');
        HapticFeedback.medium();
      } else if (allSuccess) {
        setOverallStatus('success');
        HapticFeedback.success();
      }

      return currentTests;
    });
  }, [runSingleTest]);

  return {
    tests,
    isRunning,
    overallStatus,
    totalDuration,
    runTests,
  };
}
