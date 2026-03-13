/**
 * Hook encapsulating email verification state and logic.
 *
 * Handles token verification on mount and resend functionality.
 *
 * @module pages/auth/verify-email/useVerifyEmail
 */

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '@/lib/api';
import { useAuthStore } from '@/modules/auth/store';

export type VerificationState = 'verifying' | 'success' | 'expired' | 'error' | 'already-verified';

/**
 * unknown for the auth module.
 */
/**
 * Hook for managing verify email.
 */
export function useVerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const { user, checkAuth } = useAuthStore();

  const [state, setState] = useState<VerificationState>('verifying');
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  // Verify token on mount
  useEffect(() => {
    async function verifyToken() {
      if (!token) {
        setState('error');
        return;
      }

      try {
        const response = await api.post('/api/v1/auth/verify-email', { token });

        if (response.data.already_verified) {
          setState('already-verified');
        } else {
          setState('success');
          await checkAuth?.();
        }
      } catch (error: unknown) {
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        const apiError = error as { response?: { status?: number } };
        if (apiError.response?.status === 410) {
          setState('expired');
        } else {
          setState('error');
        }
      }
    }

    verifyToken();
  }, [token, checkAuth]);

  // Resend verification email
  const handleResend = useCallback(async () => {
    if (!user?.email) return;

    setIsResending(true);
    try {
      await api.post('/api/v1/auth/resend-verification', {
        email: user.email,
      });
      setResendSuccess(true);
    } catch {
      // Silently fail - we don't want to reveal if email exists
    } finally {
      setIsResending(false);
    }
  }, [user?.email]);

  return { state, isResending, resendSuccess, handleResend };
}
