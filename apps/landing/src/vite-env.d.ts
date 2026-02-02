/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_WEB_APP_URL: string;
  readonly VITE_GA_TRACKING_ID?: string;
  readonly DEV: boolean;
  readonly PROD: boolean;
  readonly MODE: string;
  readonly SSR: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Ethereum/Web3 types for wallet integration
interface EthereumProvider {
  request(args: { method: string; params?: unknown[] }): Promise<unknown>;
  on?(eventName: string, callback: (...args: unknown[]) => void): void;
  removeListener?(eventName: string, callback: (...args: unknown[]) => void): void;
  isMetaMask?: boolean;
}

declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}

export {};
