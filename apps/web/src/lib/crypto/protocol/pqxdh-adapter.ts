/**
 * PQXDH Session Adapter
 *
 * Creates and manages post-quantum E2EE sessions using @cgraph/crypto's
 * PQXDH key agreement and Triple Ratchet engine.
 *
 * This module is the bridge between the session manager's wire format
 * and the @cgraph/crypto library. It handles:
 *
 * 1. PQXDH key agreement (P-256 ECDH + ML-KEM-768 hybrid)
 * 2. Triple Ratchet initialization (EC Double Ratchet ∥ SPQR)
 * 3. Serialization of Triple Ratchet messages to our wire format
 *
 * Architecture (Discord/Signal pattern):
 *
 *   Store layer (Zustand)
 *     └── Session Manager (routing, session lifecycle)
 *           ├── classical-adapter (X3DH → DoubleRatchetEngine)
 *           └── pqxdh-adapter (PQXDH → TripleRatchetEngine) ← THIS FILE
 *                 └── @cgraph/crypto (PQXDH, Triple Ratchet, ML-KEM-768)
 *
 * @module lib/crypto/protocol/pqxdh-adapter
 */

import {
  pqxdhInitiate,
  pqxdhRespond,
  splitTripleRatchetSecret,
  type PQXDHPreKeyBundle,
  type PQXDHInitialMessage,
} from '@cgraph/crypto/pqxdh';
import type { ECKeyPair } from '@cgraph/crypto/x3dh';
import { TripleRatchetEngine, type TripleRatchetMessage } from '@cgraph/crypto/tripleRatchet';
import { kemKeygen, type KEMKeyPair } from '@cgraph/crypto/kem';
import { arrayBufferToBase64, base64ToArrayBuffer } from '../e2ee';
import type { PQPreKeyBundle } from './types';

// =============================================================================
// TYPES
// =============================================================================

export interface PQSessionResult {
  engine: TripleRatchetEngine;
  /** Data to include in the initial message so Bob can derive the same secret */
  initialMessage: PQXDHInitialMessage;
  /** The signed prekey pair used (for DH seeding) */
  signedPreKeyPair: ECKeyPair;
}

export interface PQAcceptResult {
  engine: TripleRatchetEngine;
}

// =============================================================================
// SESSION CREATION (Alice / Initiator)
// =============================================================================

/**
 * Create a PQXDH session as the initiator (Alice).
 *
 * Performs hybrid PQXDH key agreement (P-256 ECDH + ML-KEM-768),
 * splits the 64-byte shared secret, and initializes a Triple Ratchet.
 */
export async function createPQXDHSession(
  ourIdentityKeyPair: ECKeyPair,
  recipientBundle: PQPreKeyBundle
): Promise<PQSessionResult> {
  // Convert our PQPreKeyBundle to @cgraph/crypto's PQXDHPreKeyBundle
  const cryptoBundle: PQXDHPreKeyBundle = {
    identityKey: new Uint8Array(base64ToArrayBuffer(recipientBundle.identity_key)),
    signingKey: recipientBundle.signing_key
      ? new Uint8Array(base64ToArrayBuffer(recipientBundle.signing_key))
      : new Uint8Array(base64ToArrayBuffer(recipientBundle.identity_key)),
    signedPreKey: new Uint8Array(base64ToArrayBuffer(recipientBundle.signed_prekey)),
    signedPreKeySignature: new Uint8Array(
      base64ToArrayBuffer(recipientBundle.signed_prekey_signature)
    ),
    signedPreKeyId: Number(recipientBundle.signed_prekey_id),
    kyberPreKey: new Uint8Array(base64ToArrayBuffer(recipientBundle.kyber_prekey!)),
    kyberPreKeySignature: new Uint8Array(
      base64ToArrayBuffer(recipientBundle.kyber_prekey_signature!)
    ),
    kyberPreKeyId: recipientBundle.kyber_prekey_id!,
    ...(recipientBundle.one_time_prekey && {
      oneTimePreKey: new Uint8Array(base64ToArrayBuffer(recipientBundle.one_time_prekey)),
      oneTimePreKeyId: Number(recipientBundle.one_time_prekey_id),
    }),
  };

  // PQXDH key agreement — 64-byte output for Triple Ratchet
  const pqxdhResult = await pqxdhInitiate(ourIdentityKeyPair, cryptoBundle, 64);

  // Split into EC ratchet seed + SCKA (post-quantum ratchet) seed
  const { skEc, skScka } = splitTripleRatchetSecret(pqxdhResult.sharedSecret);

  // Bob's signed prekey becomes the initial DH key for the ratchet
  const bobSignedPreKey = new Uint8Array(base64ToArrayBuffer(recipientBundle.signed_prekey));

  // Initialize Triple Ratchet as Alice
  const engine = await TripleRatchetEngine.initializeAlice(skEc, skScka, bobSignedPreKey);

  const initialMessage: PQXDHInitialMessage = {
    identityKey: ourIdentityKeyPair.rawPublicKey,
    ephemeralKey: pqxdhResult.ephemeralPublicKey,
    kemCipherText: pqxdhResult.kemCipherText,
    signedPreKeyId: Number(recipientBundle.signed_prekey_id),
    kyberPreKeyId: recipientBundle.kyber_prekey_id!,
    ...(pqxdhResult.usedOneTimePreKey && {
      oneTimePreKeyId: Number(recipientBundle.one_time_prekey_id),
    }),
    version: 4,
  };

  return {
    engine,
    initialMessage,
    signedPreKeyPair: {
       
      publicKey: null as unknown as CryptoKey, // safe downcast – placeholder, not needed after init
       
      privateKey: null as unknown as CryptoKey, // safe downcast – placeholder, not needed after init
      rawPublicKey: bobSignedPreKey,
    },
  };
}

// =============================================================================
// SESSION ACCEPTANCE (Bob / Responder)
// =============================================================================

/**
 * Accept a PQXDH session as the responder (Bob).
 *
 * Derives the same shared secret using our private keys and the
 * sender's initial message data, then initializes a Triple Ratchet.
 */
export async function acceptPQXDHSession(
  ourIdentityKeyPair: ECKeyPair,
  ourSignedPreKeyPair: ECKeyPair,
  ourKyberSecretKey: Uint8Array,
  senderIdentityKey: Uint8Array,
  senderEphemeralKey: Uint8Array,
  kemCipherText: Uint8Array,
  oneTimePreKeyPair?: ECKeyPair
): Promise<PQAcceptResult> {
  // PQXDH respond — 64-byte output for Triple Ratchet
  const pqxdhResult = await pqxdhRespond(
    ourIdentityKeyPair,
    ourSignedPreKeyPair,
    ourKyberSecretKey,
    senderIdentityKey,
    senderEphemeralKey,
    kemCipherText,
    oneTimePreKeyPair,
    64
  );

  const { skEc, skScka } = splitTripleRatchetSecret(pqxdhResult.sharedSecret);

  // Initialize Triple Ratchet as Bob
  const engine = await TripleRatchetEngine.initializeBob(skEc, skScka, ourSignedPreKeyPair);

  return { engine };
}

// =============================================================================
// TRIPLE RATCHET MESSAGE SERIALIZATION
// =============================================================================

/**
 * Serialize a TripleRatchetMessage to the base64-encoded wire format.
 *
 * The PQ message format includes both EC and PQ ratchet headers.
 * Recipients that don't support PQ will reject these messages.
 */
export function serializePQMessage(msg: TripleRatchetMessage): {
  header: {
    ec: {
      dh: string;
      pn: number;
      n: number;
      sessionId: string;
      timestamp: number;
      version: number;
    };
    pq: {
      epoch: number;
      n: number;
      scka: {
        epoch: number;
        kemPublicKey?: string;
        kemCipherText?: string;
      };
    };
    version: number;
  };
  ciphertext: string;
  nonce: string;
  mac: string;
} {
  return {
    header: {
      ec: {
        dh: arrayBufferToBase64(new Uint8Array(msg.header.ec.dh).buffer),
        pn: msg.header.ec.pn,
        n: msg.header.ec.n,
        sessionId: msg.header.ec.sessionId,
        timestamp: msg.header.ec.timestamp,
        version: msg.header.ec.version,
      },
      pq: {
        epoch: msg.header.pq.epoch,
        n: msg.header.pq.n,
        scka: {
          epoch: msg.header.pq.scka.epoch,
          ...(msg.header.pq.scka.kemPublicKey && {
            kemPublicKey: arrayBufferToBase64(
              new Uint8Array(msg.header.pq.scka.kemPublicKey).buffer
            ),
          }),
          ...(msg.header.pq.scka.kemCipherText && {
            kemCipherText: arrayBufferToBase64(
              new Uint8Array(msg.header.pq.scka.kemCipherText).buffer
            ),
          }),
        },
      },
      version: msg.header.version,
    },
    ciphertext: arrayBufferToBase64(new Uint8Array(msg.ciphertext).buffer),
    nonce: arrayBufferToBase64(new Uint8Array(msg.nonce).buffer),
    mac: arrayBufferToBase64(new Uint8Array(msg.mac).buffer),
  };
}

/**
 * Deserialize a wire-format PQ message back into a TripleRatchetMessage.
 */
export function deserializePQMessage(
  wire: ReturnType<typeof serializePQMessage>
): TripleRatchetMessage {
  return {
    header: {
      ec: {
        dh: new Uint8Array(base64ToArrayBuffer(wire.header.ec.dh)),
        pn: wire.header.ec.pn,
        n: wire.header.ec.n,
        sessionId: wire.header.ec.sessionId,
        timestamp: wire.header.ec.timestamp,
        version: wire.header.ec.version,
      },
      pq: {
        epoch: wire.header.pq.epoch,
        n: wire.header.pq.n,
        scka: {
          epoch: wire.header.pq.scka.epoch,
          ...(wire.header.pq.scka.kemPublicKey && {
            kemPublicKey: new Uint8Array(base64ToArrayBuffer(wire.header.pq.scka.kemPublicKey)),
          }),
          ...(wire.header.pq.scka.kemCipherText && {
            kemCipherText: new Uint8Array(base64ToArrayBuffer(wire.header.pq.scka.kemCipherText)),
          }),
        },
      },
      version: wire.header.version,
    },
    ciphertext: new Uint8Array(base64ToArrayBuffer(wire.ciphertext)),
    nonce: new Uint8Array(base64ToArrayBuffer(wire.nonce)),
    mac: new Uint8Array(base64ToArrayBuffer(wire.mac)),
  };
}

// =============================================================================
// KEM KEY GENERATION
// =============================================================================

/**
 * Generate KEM prekey material for key bundle registration.
 *
 * Returns the ML-KEM-768 key pair and a signature over the public key
 * using the identity signing key.
 */
export async function generateKEMPreKey(signingKeyPair: ECKeyPair): Promise<{
  kemKeyPair: KEMKeyPair;
  kyberPreKeyId: number;
  kyberPreKeySignature: Uint8Array;
}> {
  const kemKeyPair = kemKeygen();
  const kyberPreKeyId = crypto.getRandomValues(new Uint32Array(1))[0]!;

  // Sign the KEM public key with our ECDSA identity signing key
  const { sign } = await import('@cgraph/crypto/x3dh');
  const kyberPreKeySignature = await sign(signingKeyPair.privateKey, kemKeyPair.publicKey);

  return { kemKeyPair, kyberPreKeyId, kyberPreKeySignature };
}
