/**
 * Protocol Module — Version-Negotiated E2EE
 *
 * Provides protocol version negotiation between classical (X3DH + EC Double Ratchet)
 * and post-quantum (PQXDH + Triple Ratchet) E2EE sessions.
 *
 * Architecture (Discord/Signal pattern):
 *
 *   Chat UI
 *     └── E2EE Store (Zustand)
 *           └── Session Manager
 *                 └── Protocol Module ← THIS
 *                       ├── Classical: X3DH → DoubleRatchetEngine
 *                       └── Post-Quantum: PQXDH → TripleRatchetEngine
 *                             └── @cgraph/crypto
 *
 * Session negotiation:
 * - If recipient's bundle includes kyber_prekey → PQXDH + Triple Ratchet
 * - Otherwise → Classical X3DH + Double Ratchet (current default)
 * - Feature-gated behind `useTripleRatchet` flag in E2EE store
 *
 * @module lib/crypto/protocol
 */

// Types
export { CryptoProtocol, bundleSupportsPQ } from './types';
export type { SessionProtocolMeta, PQPreKeyBundle } from './types';

// PQXDH adapter
export {
  createPQXDHSession,
  acceptPQXDHSession,
  serializePQMessage,
  deserializePQMessage,
  generateKEMPreKey,
} from './pqxdh-adapter';
export type { PQSessionResult, PQAcceptResult } from './pqxdh-adapter';
