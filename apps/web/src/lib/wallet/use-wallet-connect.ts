/**
 * Hook for multi-wallet connection, SIWE signing, and backend auth.
 *
 * Abstracts wagmi's useConnect/useAccount/useSignMessage into a
 * single hook that integrates with CGraph's auth store.
 *
 * @module lib/wallet/use-wallet-connect
 */

import { useCallback, useMemo } from 'react';
import {
  useAccount,
  useConnect,
  useDisconnect,
  useSignMessage,
} from 'wagmi';
import { useAuthStore } from '@/modules/auth/store';
import { createLogger } from '@/lib/logger';
import type { WalletConnectorType } from '@cgraph/shared-types';

const logger = createLogger('WalletConnect');

interface UseWalletConnectReturn {
  /** Current connected wallet address (null if disconnected) */
  address: string | undefined;
  /** Whether a wallet is currently connected */
  isConnected: boolean;
  /** Whether a connection is in progress */
  isConnecting: boolean;
  /** Available connectors (injected, walletConnect, coinbase) */
  connectors: {
    id: string;
    name: string;
    type: WalletConnectorType;
    ready: boolean;
  }[];
  /** Connect a specific wallet and complete SIWE auth flow */
  connectAndSign: (connectorType?: WalletConnectorType) => Promise<void>;
  /** Disconnect wallet */
  disconnect: () => void;
  /** Error message if any */
  error: string | null;
}

/**
 * Multi-wallet connection hook with SIWE auth integration.
 *
 * Usage:
 * ```tsx
 * const { connectAndSign, disconnect, address, isConnected, connectors } = useWalletConnect();
 *
 * // Connect via WalletConnect QR code
 * await connectAndSign('walletconnect');
 *
 * // Connect via MetaMask
 * await connectAndSign('injected');
 * ```
 */
export function useWalletConnect(): UseWalletConnectReturn {
  const { getWalletChallenge, loginWithWallet, error, clearError } = useAuthStore();

  const { address, isConnected } = useAccount();
  const { connectAsync, connectors: rawConnectors, isPending } = useConnect();
  const { disconnect: wagmiDisconnect } = useDisconnect();
  const { signMessageAsync } = useSignMessage();

  const connectors = useMemo(
    () =>
      rawConnectors.map((c) => ({
        id: c.id,
        name: c.name,
        type: mapConnectorType(c.type),
        ready: true,
      })),
    [rawConnectors],
  );

  const connectAndSign = useCallback(
    async (connectorType: WalletConnectorType = 'injected') => {
      clearError();

      try {
        // 1. Find the matching connector
        const connector = rawConnectors.find((c) => mapConnectorType(c.type) === connectorType);
        if (!connector) {
          throw new Error(`Connector "${connectorType}" not available`);
        }

        // 2. Connect wallet
        logger.info(`Connecting via ${connectorType}...`);
        const result = await connectAsync({ connector });
        const walletAddress = result.accounts[0];
        if (!walletAddress) {
          throw new Error('No wallet address returned');
        }

        // 3. Get SIWE challenge from backend
        logger.info('Requesting SIWE challenge...');
        const challenge = await getWalletChallenge(walletAddress);

        // 4. Sign the SIWE message with wallet
        logger.info('Requesting wallet signature...');
        const signature = await signMessageAsync({
          message: challenge.message,
        });

        // 5. Send signed message + signature to backend for verification
        logger.info('Verifying signature with backend...');
        await loginWithWallet(walletAddress, signature, challenge.message);

        logger.info('Wallet auth complete');
      } catch (err) {
        logger.error('Wallet connect error:', err);
        // If user rejected, disconnect cleanly
        wagmiDisconnect();
        throw err;
      }
    },
    [rawConnectors, connectAsync, signMessageAsync, getWalletChallenge, loginWithWallet, clearError, wagmiDisconnect],
  );

  const disconnect = useCallback(() => {
    wagmiDisconnect();
    logger.info('Wallet disconnected');
  }, [wagmiDisconnect]);

  return {
    address,
    isConnected,
    isConnecting: isPending,
    connectors,
    connectAndSign,
    disconnect,
    error,
  };
}

/** Map wagmi connector type strings to our type union */
function mapConnectorType(type: string): WalletConnectorType {
  if (type === 'injected') return 'injected';
  if (type.toLowerCase().includes('walletconnect')) return 'walletconnect';
  if (type.toLowerCase().includes('coinbase')) return 'coinbase';
  return 'injected';
}
