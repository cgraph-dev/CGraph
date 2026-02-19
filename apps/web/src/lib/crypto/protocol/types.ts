/**
 * Protocol Types — Version-negotiated E2EE sessions
 *
 * Defines the protocol version enum and metadata types used to
 * distinguish classical (X3DH + EC Double Ratchet) sessions from
 * post-quantum (PQXDH + Triple Ratchet) sessions.
 *
 * @module lib/crypto/protocol/types
 */

/**
 * Protocol versions supported by the session manager.
 *
 * CLASSICAL_V1:   X3DH key agreement → EC Double Ratchet (homegrown)
 * CLASSICAL_V2:   X3DH key agreement → EC Double Ratchet (@cgraph/crypto)
 * PQXDH_V1:       PQXDH key agreement → Triple Ratchet (@cgraph/crypto)
 */
export enum CryptoProtocol {
  /** X3DH + homegrown Double Ratchet (legacy, existing sessions) */
  CLASSICAL_V1 = 1,
  /** X3DH + @cgraph/crypto Double Ratchet (new classical sessions) */
  CLASSICAL_V2 = 2,
  /** PQXDH + Triple Ratchet (post-quantum, requires KEM prekeys) */
  PQXDH_V1 = 3,
}

/**
 * Current @cgraph/crypto version used when creating sessions.
 * Single source of truth — avoids hardcoded version strings.
 */
export const CRYPTO_LIB_VERSION = '0.9.31';

/** Per-session protocol metadata persisted alongside engine state */
export interface SessionProtocolMeta {
  protocol: CryptoProtocol;
  /** @cgraph/crypto package version that created this session */
  cryptoVersion: string;
}

/** Extended pre-key bundle that includes ML-KEM-768 keys */
export interface PQPreKeyBundle {
  // Classical fields (same as ServerPrekeyBundle)
  identity_key: string;
  identity_key_id: string;
  signing_key?: string;
  signed_prekey: string;
  signed_prekey_signature: string;
  signed_prekey_id: string;
  one_time_prekey?: string;
  one_time_prekey_id?: string;
  // Post-quantum fields
  kyber_prekey?: string;
  kyber_prekey_id?: number;
  kyber_prekey_signature?: string;
}

/**
 * Check if a pre-key bundle advertises post-quantum support.
 * Both the KEM public key and its signature must be present.
 */
export function bundleSupportsPQ(bundle: PQPreKeyBundle): boolean {
  return !!(bundle.kyber_prekey && bundle.kyber_prekey_signature && bundle.kyber_prekey_id != null);
}
