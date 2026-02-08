/**
 * Register form state and validation hook.
 *
 * @module pages/auth/register/useRegisterForm
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/modules/auth/store';

export function useRegisterForm() {
  const navigate = useNavigate();
  const { register, isLoading, error, clearError } = useAuthStore();

  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const displayError = localError || error;

  // Auto-dismiss error after 5 seconds
  useEffect(() => {
    if (!displayError) return;
    const timer = setTimeout(() => {
      clearError();
      setLocalError(null);
    }, 5000);
    return () => clearTimeout(timer);
  }, [displayError, clearError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setLocalError(null);

    if (password !== confirmPassword) {
      setLocalError('Passwords do not match');
      return;
    }
    if (password.length < 8) {
      setLocalError('Password must be at least 8 characters');
      return;
    }
    if (!agreeToTerms) {
      setLocalError('Please agree to the Terms of Service and Privacy Policy');
      return;
    }

    try {
      await register(email, username, password);
      navigate('/messages');
    } catch {
      // Error is handled by store
    }
  };

  return {
    email,
    setEmail,
    username,
    setUsername,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    showPassword,
    setShowPassword,
    showConfirmPassword,
    setShowConfirmPassword,
    agreeToTerms,
    setAgreeToTerms,
    displayError,
    isLoading,
    handleSubmit,
  };
}
