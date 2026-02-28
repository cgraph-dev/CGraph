/**
 * Login form state, wallet connect, and submission logic.
 *
 * Supports 2FA login gate — when backend returns 2fa_required,
 * the form transitions to a TOTP code entry step.
 *
 * @module pages/auth/login/useLoginForm
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/modules/auth/store';
import { createLogger } from '@/lib/logger';

const logger = createLogger('Login');

/** Which step of the login flow is active */
export type LoginStep = 'credentials' | '2fa';

/**
 * Hook for managing login form, including 2FA step.
 */
export function useLoginForm() {
  const navigate = useNavigate();
  const {
    login,
    verifyLoginTwoFactor,
    getWalletChallenge,
    loginWithWallet,
    isLoading,
    error,
    clearError,
  } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // 2FA state
  const [loginStep, setLoginStep] = useState<LoginStep>('credentials');
  const [twoFactorToken, setTwoFactorToken] = useState<string | null>(null);

  // Auto-dismiss error after 5 seconds (enough time to read)
  useEffect(() => {
    if (!error) return;

    const timer = setTimeout(() => {
      clearError();
    }, 5000);
    return () => clearTimeout(timer);
  }, [error, clearError]);

  const handleSubmit = async () => {
    clearError();

    try {
      const result = await login(email, password);

      // Backend requires 2FA — transition to TOTP form
      if (result?.twoFactorRequired) {
        setTwoFactorToken(result.twoFactorToken);
        setLoginStep('2fa');
        return;
      }

      navigate('/messages');
    } catch {
      // Error is handled by store
    }
  };

  const handleVerifyTwoFactor = async (code: string) => {
    if (!twoFactorToken) return;
    clearError();

    try {
      await verifyLoginTwoFactor(twoFactorToken, code);
      navigate('/messages');
    } catch {
      // Error is handled by store — form displays it
    }
  };

  const handleBackToCredentials = () => {
    setLoginStep('credentials');
    setTwoFactorToken(null);
    clearError();
  };

  const handleWalletConnect = async () => {
    clearError();

    try {
      // Check if MetaMask is installed
      if (typeof window.ethereum === 'undefined') {
        throw new Error('Please install MetaMask to use wallet login');
      }

      // Request account access
      // type assertion: MetaMask ethereum.request() returns unknown, provider API is typed externally
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      const accounts = (await window.ethereum.request({
        method: 'eth_requestAccounts',
      })) as string[];
      const walletAddress = accounts[0];
      if (!walletAddress) {
        throw new Error('No wallet address returned from MetaMask');
      }

      // Step 1: Get challenge message with nonce from backend
      const challenge = await getWalletChallenge(walletAddress);

      // Step 2: Sign the challenge message with MetaMask
      // type assertion: MetaMask ethereum.request() returns unknown, provider API is typed externally
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      const signature = (await window.ethereum.request({
        method: 'personal_sign',
        params: [challenge.message, walletAddress],
      })) as string | undefined;
      if (!signature) {
        throw new Error('Signature not provided');
      }

      // Step 3: Verify signature and login
      await loginWithWallet(walletAddress, signature);
      navigate('/messages');
    } catch (err) {
      // Error is handled by store or shown locally
      logger.error('Wallet login error:', err);
    }
  };

  return {
    email,
    setEmail,
    password,
    setPassword,
    showPassword,
    setShowPassword,
    isLoading,
    error,
    loginStep,
    twoFactorToken,
    handleSubmit,
    handleVerifyTwoFactor,
    handleBackToCredentials,
    handleWalletConnect,
  };
}
