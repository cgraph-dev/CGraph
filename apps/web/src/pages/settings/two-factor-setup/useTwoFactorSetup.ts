/**
 * useTwoFactorSetup hook
 * @module pages/settings/two-factor-setup
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { api } from '@/lib/api';
import type { TwoFactorSetupData, SetupStep, UseTwoFactorSetupReturn } from './types';
import { STEPS } from './constants';

export function useTwoFactorSetup(): UseTwoFactorSetupReturn {
  const [step, setStep] = useState<SetupStep>('intro');
  const [setupData, setSetupData] = useState<TwoFactorSetupData | null>(null);
  const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [copiedBackup, setCopiedBackup] = useState(false);
  const secretTimerRef = useRef<ReturnType<typeof setTimeout>>(null);
  const backupTimerRef = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(
    () => () => {
      if (secretTimerRef.current) clearTimeout(secretTimerRef.current);
      if (backupTimerRef.current) clearTimeout(backupTimerRef.current);
    },
    []
  );

  // Generate 2FA secret on entering scan step
  useEffect(() => {
    async function generateSecret() {
      if (step !== 'scan' || setupData) return;

      setIsLoading(true);
      try {
        const response = await api.post('/api/v1/auth/2fa/setup');
        setSetupData(response.data);
      } catch (_err) {
        setError('Failed to generate 2FA secret. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
    generateSecret();
  }, [step, setupData]);

  // Handle verification code input
  const handleCodeChange = useCallback(
    (index: number, value: string) => {
      if (value.length > 1) {
        // Handle paste
        const digits = value.replace(/\D/g, '').slice(0, 6).split('');
        const newCode = [...verificationCode];
        digits.forEach((digit, i) => {
          if (index + i < 6) newCode[index + i] = digit;
        });
        setVerificationCode(newCode);
        // Focus next empty or last input
        const nextIndex = Math.min(index + digits.length, 5);
        document.getElementById(`code-${nextIndex}`)?.focus();
      } else if (/^\d$/.test(value) || value === '') {
        const newCode = [...verificationCode];
        newCode[index] = value;
        setVerificationCode(newCode);
        // Auto-focus next input
        if (value && index < 5) {
          document.getElementById(`code-${index + 1}`)?.focus();
        }
      }
    },
    [verificationCode]
  );

  const handleKeyDown = useCallback(
    (index: number, e: React.KeyboardEvent) => {
      if (e.key === 'Backspace' && !verificationCode[index] && index > 0) {
        document.getElementById(`code-${index - 1}`)?.focus();
      }
    },
    [verificationCode]
  );

  // Verify the code
  const handleVerify = useCallback(async () => {
    const code = verificationCode.join('');
    if (code.length !== 6) {
      setError('Please enter all 6 digits');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await api.post('/api/v1/auth/2fa/verify', { code });
      setStep('backup');
    } catch {
      setError('Invalid code. Please try again.');
      setVerificationCode(['', '', '', '', '', '']);
      document.getElementById('code-0')?.focus();
    } finally {
      setIsLoading(false);
    }
  }, [verificationCode]);

  // Copy to clipboard helpers
  const copySecret = useCallback(() => {
    if (setupData?.secret) {
      navigator.clipboard.writeText(setupData.secret);
      setCopiedSecret(true);
      secretTimerRef.current = setTimeout(() => setCopiedSecret(false), 2000);
    }
  }, [setupData?.secret]);

  const copyBackupCodes = useCallback(() => {
    if (setupData?.backupCodes) {
      navigator.clipboard.writeText(setupData.backupCodes.join('\n'));
      setCopiedBackup(true);
      backupTimerRef.current = setTimeout(() => setCopiedBackup(false), 2000);
    }
  }, [setupData?.backupCodes]);

  // Finalize setup
  const handleComplete = useCallback(async () => {
    setIsLoading(true);
    try {
      await api.post('/api/v1/auth/2fa/enable');
      setStep('complete');
    } catch {
      setError('Failed to enable 2FA. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const stepIndex = STEPS.indexOf(step);

  return {
    step,
    setStep,
    setupData,
    verificationCode,
    isLoading,
    error,
    copiedSecret,
    copiedBackup,
    handleCodeChange,
    handleKeyDown,
    handleVerify,
    copySecret,
    copyBackupCodes,
    handleComplete,
    stepIndex,
  };
}
