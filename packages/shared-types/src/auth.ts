/**
 * Shared authentication types for SIWE + WalletConnect flows.
 * @module @cgraph/shared-types/auth
 */

/** SIWE (EIP-4361) message fields */
export interface SIWEMessage {
  domain: string;
  address: string;
  statement: string;
  uri: string;
  version: string;
  chainId: string;
  nonce: string;
  issuedAt: string;
  expirationTime: string;
}

/** Wallet connection state (shared between web + mobile) */
export interface WalletConnectionState {
  address: string | null;
  chainId: number | null;
  connector: 'injected' | 'walletconnect' | 'coinbase' | null;
  isConnected: boolean;
}

/** POST /api/v1/auth/wallet/challenge request body */
export interface WalletChallengeRequest {
  wallet_address: string;
}

/** POST /api/v1/auth/wallet/challenge response */
export interface WalletChallengeResponse {
  message: string;
  nonce: string;
}

/** POST /api/v1/auth/wallet/verify request body */
export interface WalletVerifyRequest {
  wallet_address: string;
  signature: string;
  message: string;
}

/** POST /api/v1/auth/wallet/verify response */
export interface WalletVerifyResponse {
  access_token: string;
  refresh_token: string;
  user: {
    id: string;
    username: string;
    wallet_address: string;
  };
}

/** Connector type options for wallet selection UI */
export type WalletConnectorType = 'injected' | 'walletconnect' | 'coinbase';
