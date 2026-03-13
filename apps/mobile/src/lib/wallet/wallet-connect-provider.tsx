/**
 * Mobile WalletConnect provider.
 *
 * Provides wallet connection context for React Native.
 * Uses a lightweight approach with deep-link wallet interaction
 * rather than the full @walletconnect/modal-react-native SDK
 * to avoid native module complexity.
 *
 * @module lib/wallet/wallet-connect-provider
 */

import React, { createContext, use, useState, useCallback, type ReactNode } from 'react';
import { Linking, Alert, Platform } from 'react-native';
import { authApi as authService } from '@/services/api';

interface WalletState {
  address: string | null;
  isConnected: boolean;
  isConnecting: boolean;
}

interface WalletContextValue extends WalletState {
  requestChallenge: (address: string) => Promise<{ message: string; nonce: string }>;
  verifySignature: (address: string, signature: string, message: string) => Promise<unknown>;
  setAddress: (address: string | null) => void;
  setConnecting: (connecting: boolean) => void;
  openWalletApp: (uri?: string) => void;
}

const WalletContext = createContext<WalletContextValue | null>(null);

interface WalletProviderProps {
  children: ReactNode;
}

/**
 * Provider that enables wallet connection throughout the mobile app.
 */
export function MobileWalletProvider({ children }: WalletProviderProps) {
  const [state, setState] = useState<WalletState>({
    address: null,
    isConnected: false,
    isConnecting: false,
  });

  const setAddress = useCallback((address: string | null) => {
    setState((prev) => ({
      ...prev,
      address,
      isConnected: !!address,
    }));
  }, []);

  const setConnecting = useCallback((connecting: boolean) => {
    setState((prev) => ({ ...prev, isConnecting: connecting }));
  }, []);

  const requestChallenge = useCallback(
    (address: string) => authService.walletChallenge({ wallet_address: address }),
    []
  );

  const verifySignature = useCallback(
    (address: string, signature: string, message: string) =>
      authService.walletLogin({
        wallet_address: address,
        signature,
        message,
      }),
    []
  );

  const openWalletApp = useCallback((uri?: string) => {
    const walletUri = uri ?? (Platform.OS === 'ios' ? 'metamask://' : 'metamask://');
    Linking.canOpenURL(walletUri).then((supported) => {
      if (supported) {
        Linking.openURL(walletUri);
      } else {
        Alert.alert(
          'Wallet Not Found',
          'Please install MetaMask or another Ethereum wallet to continue.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Install MetaMask',
              onPress: () => {
                const storeUrl =
                  Platform.OS === 'ios'
                    ? 'https://apps.apple.com/app/metamask/id1438144202'
                    : 'https://play.google.com/store/apps/details?id=io.metamask';
                Linking.openURL(storeUrl);
              },
            },
          ]
        );
      }
    });
  }, []);

  return (
    <WalletContext.Provider
      value={{
        ...state,
        requestChallenge,
        verifySignature,
        setAddress,
        setConnecting,
        openWalletApp,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

/**
 * Access mobile wallet context.
 */
export function useMobileWallet() {
  const context = use(WalletContext);
  if (!context) {
    throw new Error('useMobileWallet must be used within MobileWalletProvider');
  }
  return context;
}
