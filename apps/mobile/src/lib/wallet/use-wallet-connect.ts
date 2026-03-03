/**
 * Mobile wallet connection hook.
 *
 * Provides a simplified wallet auth flow for React Native:
 * 1. User taps "Connect Wallet"
 * 2. Deep-links to wallet app (MetaMask, etc.)
 * 3. Returns with signed message
 * 4. Backend verifies and returns JWT
 *
 * @module lib/wallet/use-wallet-connect
 */

import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import { useMobileWallet } from './wallet-connect-provider';

interface UseWalletConnectReturn {
  address: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  connect: () => void;
  disconnect: () => void;
  error: string | null;
}

/**
 * Hook for wallet authentication on mobile.
 *
 * Usage:
 * ```tsx
 * const { connect, disconnect, isConnected, address } = useWalletConnect();
 * ```
 */
export function useWalletConnect(): UseWalletConnectReturn {
  const { address, isConnected, isConnecting, openWalletApp, setAddress } = useMobileWallet();
  const [error, setError] = useState<string | null>(null);

  const connect = useCallback(() => {
    setError(null);
    try {
      // Open wallet app for connection
      // The full WalletConnect flow requires native modules;
      // for now we deep-link to MetaMask.
      // Full WalletConnect RN SDK integration can be added when
      // @walletconnect/modal-react-native stabilizes.
      openWalletApp();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to connect wallet';
      setError(message);
      Alert.alert('Wallet Connection Error', message);
    }
  }, [openWalletApp]);

  const disconnect = useCallback(() => {
    setAddress(null);
    setError(null);
  }, [setAddress]);

  return {
    address,
    isConnected,
    isConnecting,
    connect,
    disconnect,
    error,
  };
}
