/**
 * Reset Password Page - Main Component
 *
 * Handles password reset with token validation.
 * Features strength meter and confirmation.
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '@/lib/api';
import { GlassCard } from '@/shared/components/ui';

import type { ResetState } from './types';
import { calculatePasswordStrength } from './utils';
import { ValidatingView, ExpiredView, SuccessView } from './state-views';
import { ResetPasswordForm } from './reset-password-form';

/**
 * Reset Password component.
 */
export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [state, setState] = useState<ResetState>('validating');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const strength = useMemo(() => calculatePasswordStrength(password), [password]);
  const passwordsMatch = password === confirmPassword && password.length > 0;
  const canSubmit = strength.score >= 4 && passwordsMatch && !isLoading;

  // Validate token on mount
  useEffect(() => {
    async function validateToken() {
      if (!token) {
        setState('expired');
        return;
      }

      try {
        await api.post('/api/v1/auth/reset-password/validate', { token });
        setState('form');
      } catch (error: unknown) {
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        const apiError = error as { response?: { status?: number } };
        if (apiError.response?.status === 410) {
          setState('expired');
        } else {
          setState('error');
          setErrorMessage('Unable to validate reset link. Please try again.');
        }
      }
    }

    validateToken();
  }, [token]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!canSubmit) return;

      setIsLoading(true);
      setErrorMessage('');

      try {
        await api.post('/api/v1/auth/reset-password/confirm', {
          token,
          password,
        });
        setState('success');
      } catch (error: unknown) {
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        const apiError = error as { response?: { data?: { message?: string } } };
        setErrorMessage(
          apiError.response?.data?.message || 'Failed to reset password. Please try again.'
        );
      } finally {
        setIsLoading(false);
      }
    },
    [canSubmit, token, password]
  );

  const renderContent = () => {
    switch (state) {
      case 'validating':
        return <ValidatingView />;
      case 'expired':
      case 'error':
        return <ExpiredView />;
      case 'success':
        return <SuccessView onContinue={() => navigate('/login')} />;
      case 'form':
        return (
          <ResetPasswordForm
            password={password}
            confirmPassword={confirmPassword}
            showPassword={showPassword}
            showConfirmPassword={showConfirmPassword}
            strength={strength}
            passwordsMatch={passwordsMatch}
            canSubmit={canSubmit}
            isLoading={isLoading}
            errorMessage={errorMessage}
            onPasswordChange={setPassword}
            onConfirmPasswordChange={setConfirmPassword}
            onToggleShowPassword={() => setShowPassword(!showPassword)}
            onToggleShowConfirmPassword={() => setShowConfirmPassword(!showConfirmPassword)}
            onSubmit={handleSubmit}
          />
        );
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 p-4">
      {/* Animated Background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="bg-gradient-radial absolute -right-1/2 -top-1/2 h-full w-full rounded-full from-primary-500/10 to-transparent" />
        <div className="bg-gradient-radial absolute -bottom-1/2 -left-1/2 h-full w-full rounded-full from-purple-500/10 to-transparent" />
      </div>

      <GlassCard variant="frosted" className="relative z-10 w-full max-w-md" hover3D={false}>
        <div className="p-8">{renderContent()}</div>
      </GlassCard>
    </div>
  );
}
