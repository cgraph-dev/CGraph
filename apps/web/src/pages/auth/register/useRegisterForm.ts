/**
 * Register form state and validation hook.
 *
 * Uses React 19 useActionState for form submission + validation.
 *
 * @module pages/auth/register/useRegisterForm
 */

import { useState, useEffect, useActionState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/modules/auth/store';

interface RegisterFormState {
  error: string | null;
}

export function useRegisterForm() {
  const navigate = useNavigate();
  const { register, error, clearError } = useAuthStore();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formState, formAction, isPending] = useActionState(
    async (_prev: RegisterFormState, formData: FormData): Promise<RegisterFormState> => {
      clearError();

      const email = formData.get('email') as string;
      const username = formData.get('username') as string;
      const password = formData.get('password') as string;
      const confirmPassword = formData.get('confirmPassword') as string;
      const agreeToTerms = formData.get('agreeToTerms') === 'on';

      if (password !== confirmPassword) {
        return { error: 'Passwords do not match' };
      }
      if (password.length < 8) {
        return { error: 'Password must be at least 8 characters' };
      }
      if (!agreeToTerms) {
        return { error: 'Please agree to the Terms of Service and Privacy Policy' };
      }

      try {
        await register(email, username, password);
        navigate('/messages');
        return { error: null };
      } catch {
        // Error is handled by store
        return { error: null };
      }
    },
    { error: null }
  );

  const displayError = formState.error || error;

  // Auto-dismiss error after 5 seconds
  useEffect(() => {
    if (!displayError) return;
    const timer = setTimeout(() => {
      clearError();
    }, 5000);
    return () => clearTimeout(timer);
  }, [displayError, clearError]);

  return {
    showPassword,
    setShowPassword,
    showConfirmPassword,
    setShowConfirmPassword,
    displayError,
    isLoading: isPending,
    formAction,
  };
}
