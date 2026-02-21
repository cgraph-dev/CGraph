/**
 * Login form state, wallet connect, and submission logic.
 *
 * @module pages/auth/login/useLoginForm
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/modules/auth/store';
import { createLogger } from '@/lib/logger';

const logger = createLogger('Login');

export function useLoginForm() {
  const navigate = useNavigate();
  const { login, getWalletChallenge, loginWithWallet, isLoading, error, clearError } =
    useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

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
      await login(email, password);
      navigate('/messages');
    } catch {
      // Error is handled by store
    }
  };

  const handleWalletConnect = async () => {
    clearError();

    try {
      // Check if MetaMask is installed
      if (typeof window.ethereum === 'undefined') {
        throw new Error('Please install MetaMask to use wallet login');
      }

      // Request account access
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
    handleSubmit,
    handleWalletConnect,
  };
}
