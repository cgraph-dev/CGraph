/**
 * WalletConnect provider wrapping wagmi + TanStack Query.
 *
 * Wraps the app in WagmiProvider and QueryClientProvider for
 * wagmi hooks (useConnect, useAccount, useSignMessage, etc.).
 *
 * @module lib/wallet/wallet-connect-provider
 */

import { type ReactNode } from 'react';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { wagmiConfig } from './wagmi-config';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      retry: 1,
    },
  },
});

interface WalletProviderProps {
  children: ReactNode;
}

/**
 * Provider that enables wallet connection throughout the app.
 *
 * Place this inside your existing providers (auth, theme, etc.)
 * but outside any component that needs wallet access.
 */
export function WalletProvider({ children }: WalletProviderProps) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
