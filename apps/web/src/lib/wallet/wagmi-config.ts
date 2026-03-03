/**
 * wagmi client configuration for wallet authentication.
 *
 * Supports injected wallets (MetaMask, Brave), WalletConnect v2,
 * and Coinbase Wallet connectors.
 *
 * @module lib/wallet/wagmi-config
 */

import { type Config, createConfig, http } from 'wagmi';
import { mainnet } from 'wagmi/chains';
import { injected, walletConnect, coinbaseWallet } from '@wagmi/connectors';

const WC_PROJECT_ID = import.meta.env.VITE_WC_PROJECT_ID ?? 'PLACEHOLDER_WC_PROJECT_ID';

/**
 * wagmi configuration with multi-wallet support.
 *
 * Connectors:
 * - `injected` — MetaMask, Brave Wallet, or any browser extension wallet
 * - `walletConnect` — QR code connection to 100+ mobile wallets
 * - `coinbaseWallet` — Coinbase Wallet (extension + mobile)
 */
export const wagmiConfig: Config = createConfig({
  chains: [mainnet],
  connectors: [
    injected({ shimDisconnect: true }),
    walletConnect({
      projectId: WC_PROJECT_ID,
      metadata: {
        name: 'CGraph',
        description: 'Secure Community Platform',
        url: 'https://web.cgraph.org',
        icons: ['https://cgraph.org/logo.png'],
      },
      showQrModal: true,
    }),
    coinbaseWallet({
      appName: 'CGraph',
      appLogoUrl: 'https://cgraph.org/logo.png',
    }),
  ],
  transports: {
    [mainnet.id]: http(),
  },
});
