/**
 * @cgraph/crypto — Signal-grade E2EE for CGraph
 *
 * Post-quantum hybrid encryption using Triple Ratchet protocol:
 * - PQXDH key agreement (P-256 ECDH + ML-KEM-768)
 * - Triple Ratchet = EC Double Ratchet ∥ SPQR, combined via KDF_HYBRID
 * - AES-256-GCM symmetric encryption
 * - Cross-platform: Web (crypto.subtle) + React Native
 *
 * Protocol version 4 — matches Signal's Double Ratchet Revision 4.
 *
 * @module @cgraph/crypto
 * @version 0.9.31
 */

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------
export { CryptoError, CryptoErrorCode } from './errors';
export {
  sessionNotInitialized,
  invalidKey,
  macVerificationFailed,
  tooManySkippedMessages,
  invalidProtocolVersion,
} from './errors';

// ---------------------------------------------------------------------------
// Stores
// ---------------------------------------------------------------------------
export type {
  ProtocolAddress,
  SessionRecord,
  IdentityKeyRecord,
  SignedPreKeyRecord,
  PreKeyRecord,
  KyberPreKeyRecord,
  SessionStore,
  IdentityKeyStore,
  PreKeyStore,
  SignedPreKeyStore,
  KyberPreKeyStore,
  ProtocolStore,
} from './stores';
export { InMemoryProtocolStore, addressToString, addressFromString } from './stores';

// ---------------------------------------------------------------------------
// Core types (legacy + new)
// ---------------------------------------------------------------------------
export type {
  KeyPair,
  ExportedKeyPair,
  IdentityKeyPair,
  SignedPreKey,
  OneTimePreKey,
  KeyBundle,
  EncryptedMessage,
  Session,
  HKDFOptions,
} from './types';

// ---------------------------------------------------------------------------
// Portable types (cross-platform, Uint8Array-based)
// ---------------------------------------------------------------------------
export type {
  RawKeyPair,
  PortableIdentityKeyPair,
  PortablePreKey,
  PortableSignedPreKey,
  PortableOneTimePreKey,
  PortableKeyBundle,
  ServerPrekeyBundle,
  PortableEncryptedMessage,
  PortableSession,
  PortableEncryptionResult,
  PortableHKDFOptions,
} from './types-portable';

// ---------------------------------------------------------------------------
// AES-256-GCM
// ---------------------------------------------------------------------------
export { encryptAES, decryptAES, generateAESKey } from './aes';

// ---------------------------------------------------------------------------
// File Encryption (AES-256-GCM for binary data)
// ---------------------------------------------------------------------------
export { encryptFile, decryptFile, encryptFileWithMetadata } from './file-encryption';
export type { EncryptedFile, DecryptedFile } from './file-encryption';

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------
export {
  generateKeyPair,
  deriveSharedSecret,
  hkdf,
  exportPublicKey,
  importPublicKey,
  arrayBufferToBase64,
  base64ToArrayBuffer,
  generateSigningKeyPair,
  generateId,
} from './utils';

// ---------------------------------------------------------------------------
// KEM — ML-KEM-768
// ---------------------------------------------------------------------------
export {
  kemKeygen,
  kemEncapsulate,
  kemDecapsulate,
  serializeKEMPublicKey,
  deserializeKEMPublicKey,
  serializeKEMCiphertext,
  deserializeKEMCiphertext,
  wipeKEMKeyPair,
  KEM_PUBLIC_KEY_LENGTH,
  KEM_SECRET_KEY_LENGTH,
  KEM_CIPHERTEXT_LENGTH,
  KEM_SHARED_SECRET_LENGTH,
} from './kem';
export type { KEMKeyPair, KEMEncapsulation } from './kem';

// ---------------------------------------------------------------------------
// X3DH (classical)
// ---------------------------------------------------------------------------
export { x3dhInitiate, x3dhRespond, generateECKeyPair, sign } from './x3dh';
export type { ECKeyPair, X3DHPreKeyBundle, X3DHResult } from './x3dh';

// ---------------------------------------------------------------------------
// PQXDH (post-quantum)
// ---------------------------------------------------------------------------
export {
  pqxdhInitiate,
  pqxdhRespond,
  generatePQXDHBundle,
  splitTripleRatchetSecret,
  PQXDH_VERSION,
} from './pqxdh';
export type { PQXDHPreKeyBundle, PQXDHResult, PQXDHInitialMessage } from './pqxdh';

// ---------------------------------------------------------------------------
// Double Ratchet (EC)
// ---------------------------------------------------------------------------
export { DoubleRatchetEngine, generateDHKeyPair, importDHPublicKey } from './doubleRatchet';
export type {
  KeyPair as DHKeyPair,
  RatchetState,
  MessageHeader,
  EncryptedMessage as ECEncryptedMessage,
  DecryptedMessage as ECDecryptedMessage,
  RatchetConfig,
} from './doubleRatchet';

// ---------------------------------------------------------------------------
// SCKA — ML-KEM Braid
// ---------------------------------------------------------------------------
export { SCKAEngine, SCKADirection } from './scka';
export type { SCKAHeader, SCKASendResult, SCKAReceiveResult, SCKAState } from './scka';

// ---------------------------------------------------------------------------
// SPQR — Sparse Post-Quantum Ratchet
// ---------------------------------------------------------------------------
export { SPQREngine } from './spqr';
export type { SPQRState, SPQRHeader, SPQRSendResult, SPQRReceiveResult } from './spqr';

// ---------------------------------------------------------------------------
// Triple Ratchet — the main event
// ---------------------------------------------------------------------------
export { TripleRatchetEngine, TRIPLE_RATCHET_VERSION } from './tripleRatchet';
export type {
  TripleRatchetHeader,
  TripleRatchetMessage,
  TripleRatchetDecryptedMessage,
  TripleRatchetStats,
} from './tripleRatchet';
