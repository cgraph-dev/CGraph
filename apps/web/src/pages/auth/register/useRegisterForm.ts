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

  function getFormString(formData: FormData, key: string): string {
    const value = formData.get(key);
    return typeof value === 'string' ? value : '';
  }

  const [formState, formAction, isPending] = useActionState(
    async (_prev: RegisterFormState, formData: FormData): Promise<RegisterFormState> => {
      clearError();

      const email = getFormString(formData, 'email');
      const username = getFormString(formData, 'username');
      const password = getFormString(formData, 'password');
      const confirmPassword = getFormString(formData, 'confirmPassword');
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
