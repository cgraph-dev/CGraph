/**
 * useSecretChat Hook
 *
 * Combines the secret chat Zustand store with API calls and
 * E2E encryption operations via @cgraph/crypto Triple Ratchet.
 *
 * Provides:
 * - Session lifecycle (init, destroy)
 * - Ghost mode toggling via API
 * - Panic wipe with key destruction
 * - Message encryption/decryption using Triple Ratchet (PQXDH)
 *
 * @module modules/secret-chat/hooks/useSecretChat
 */

import { useCallback, useRef } from 'react';
import { api } from '@/lib/api';
import { useSecretChatStore } from '../store';
import type { SecretChatSession, SecretThemeId } from '../store/types';
import {
  TripleRatchetEngine,
  pqxdhInitiate,
  splitTripleRatchetSecret,
  InMemoryProtocolStore,
  arrayBufferToBase64,
  base64ToArrayBuffer,
  generateECKeyPair,
  type PQXDHPreKeyBundle,
  type TripleRatchetMessage,
  type TripleRatchetDecryptedMessage,
} from '@cgraph/crypto';

// ── Helpers ────────────────────────────────────────────────────────────

/** Encode a string to Uint8Array */
function encodeText(text: string): Uint8Array {
  return new TextEncoder().encode(text);
}

/** Decode Uint8Array to string */
function decodeText(data: Uint8Array): string {
  return new TextDecoder().decode(data);
}

/**
 * Serialize a TripleRatchetMessage to a base64 JSON blob for transport.
 */
function serializeMessage(msg: TripleRatchetMessage): string {
  return JSON.stringify({
    header: {
      ec: {
        dh: arrayBufferToBase64(msg.header.ec.dh),
        pn: msg.header.ec.pn,
        n: msg.header.ec.n,
        sessionId: msg.header.ec.sessionId,
        timestamp: msg.header.ec.timestamp,
        version: msg.header.ec.version,
      },
      pq: msg.header.pq,
      version: msg.header.version,
    },
    ciphertext: arrayBufferToBase64(msg.ciphertext),
    nonce: arrayBufferToBase64(msg.nonce),
    mac: arrayBufferToBase64(msg.mac),
  });
}

/** Shape of the parsed serialized message JSON */
interface SerializedTripleRatchetMessage {
  header: {
    ec: {
      dh: string;
      pn: number;
      n: number;
      sessionId: string;
      timestamp: number;
      version: number;
    };
    pq: TripleRatchetMessage['header']['pq'];
    version: number;
  };
  ciphertext: string;
  nonce: string;
  mac: string;
}

/**
 * Deserialize a base64 JSON blob back into a TripleRatchetMessage.
 */
function deserializeMessage(blob: string): TripleRatchetMessage {
   
  const parsed: SerializedTripleRatchetMessage = JSON.parse(blob) as SerializedTripleRatchetMessage;

  return {
    header: {
      ec: {
        dh: new Uint8Array(base64ToArrayBuffer(parsed.header.ec.dh)),
        pn: parsed.header.ec.pn,
        n: parsed.header.ec.n,
        sessionId: parsed.header.ec.sessionId,
        timestamp: parsed.header.ec.timestamp,
        version: parsed.header.ec.version,
      },
      pq: parsed.header.pq,
      version: parsed.header.version,
    },
    ciphertext: new Uint8Array(base64ToArrayBuffer(parsed.ciphertext)),
    nonce: new Uint8Array(base64ToArrayBuffer(parsed.nonce)),
    mac: new Uint8Array(base64ToArrayBuffer(parsed.mac)),
  };
}

// ── Types ──────────────────────────────────────────────────────────────

/**
 * Return type for the useSecretChat hook
 */
export interface UseSecretChatReturn {
  /** Current active session */
  session: SecretChatSession | null;
  /** Whether ghost mode is active */
  ghostModeActive: boolean;
  /** Whether ghost mode toggle is in progress */
  ghostModeToggling: boolean;
  /** Currently selected theme */
  selectedThemeId: SecretThemeId;
  /** Whether panic wipe is in progress */
  isPanicWiping: boolean;
  /** Toggle ghost mode on/off via API */
  toggleGhostMode: () => Promise<void>;
  /** Set the active session */
  setSession: (session: SecretChatSession | null) => void;
  /** Change the secret chat theme */
  setTheme: (themeId: SecretThemeId) => void;
  /** Set the user alias */
  setAlias: (alias: string) => void;
  /** Trigger a panic wipe */
  panicWipe: () => Promise<void>;
  /** Reset all secret chat state */
  reset: () => void;
  /** Initialize a new E2E encrypted session via PQXDH key agreement */
  initSession: (peerBundle: PQXDHPreKeyBundle) => Promise<void>;
  /** Encrypt a plaintext message using Triple Ratchet */
  encryptMessage: (plaintext: string) => Promise<string>;
  /** Decrypt a received ciphertext blob using Triple Ratchet */
  decryptMessage: (ciphertext: string) => Promise<string>;
}

// ── Hook ───────────────────────────────────────────────────────────────

/**
 * Primary hook for secret chat functionality.
 *
 * Combines Zustand store state with:
 * - API integration (ghost mode, panic wipe)
 * - E2E encryption via Triple Ratchet (PQXDH + AES-256-GCM)
 * - In-memory protocol key store
 */
export function useSecretChat(): UseSecretChatReturn {
  const store = useSecretChatStore();

  // Persist engine and protocol store across renders in refs
  const engineRef = useRef<TripleRatchetEngine | null>(null);
  const protocolStoreRef = useRef<InMemoryProtocolStore | null>(null);

  // ── Ghost Mode ─────────────────────────────────────────────────────

  const toggleGhostMode = useCallback(async () => {
    const { ghostMode, setGhostToggling, setGhostActive } = useSecretChatStore.getState();
    setGhostToggling(true);

    try {
      await api.post('/api/v1/secret-chats/ghost', {
        enabled: !ghostMode.isActive,
      });
      setGhostActive(!ghostMode.isActive);
    } finally {
      setGhostToggling(false);
    }
  }, []);

  // ── Panic Wipe ─────────────────────────────────────────────────────

  const panicWipe = useCallback(async () => {
    const { session, panicWipe: doPanicWipe } = useSecretChatStore.getState();

    if (!session) return;

    try {
      await api.post(`/api/v1/secret-chats/${session.id}/panic-wipe`);
    } finally {
      // Destroy crypto state
      engineRef.current = null;
      protocolStoreRef.current = null;
      doPanicWipe();
    }
  }, []);

  // ── E2E Encryption: Session Init ───────────────────────────────────

  /**
   * Initialize a new E2E encrypted session.
   *
   * Performs PQXDH key agreement with the peer's pre-key bundle,
   * then initializes a Triple Ratchet engine for message encryption.
   *
   * @param peerBundle - The peer's PQXDH pre-key bundle (fetched from server)
   */
  const initSession = useCallback(async (peerBundle: PQXDHPreKeyBundle) => {
    // Generate ephemeral identity EC key pair for this session
    const identityKeyPair = await generateECKeyPair();

    // Perform PQXDH key agreement (we are Alice / initiator)
    // Output 64 bytes: 32 for EC Double Ratchet + 32 for SPQR
    const pqxdhResult = await pqxdhInitiate(identityKeyPair, peerBundle, 64);

    // Split the 64-byte shared secret for Triple Ratchet
    const { skEc, skScka } = splitTripleRatchetSecret(pqxdhResult.sharedSecret);

    // Initialize Triple Ratchet as Alice
    const engine = await TripleRatchetEngine.initializeAlice(skEc, skScka, peerBundle.signedPreKey);

    engineRef.current = engine;

    // Create protocol store with session identity keys
    protocolStoreRef.current = new InMemoryProtocolStore(
      { publicKey: identityKeyPair.rawPublicKey, privateKey: new Uint8Array(32) },
      1
    );

    // Store peer's identity key in protocol store for future lookups
    const address = { name: 'secret-peer', deviceId: 1 };
    await protocolStoreRef.current.saveIdentity(address, peerBundle.identityKey);

    // Wipe secret material
    pqxdhResult.sharedSecret.fill(0);
    skEc.fill(0);
    skScka.fill(0);

    // Send initial message with our public keys to the server
    await api.post('/api/v1/secret-chats/init', {
      identity_key: arrayBufferToBase64(identityKeyPair.rawPublicKey),
      ephemeral_key: arrayBufferToBase64(pqxdhResult.ephemeralPublicKey),
      kem_ciphertext: arrayBufferToBase64(pqxdhResult.kemCipherText),
      signed_pre_key_id: peerBundle.signedPreKeyId,
      one_time_pre_key_id: peerBundle.oneTimePreKeyId,
      kyber_pre_key_id: peerBundle.kyberPreKeyId,
    });
  }, []);

  // ── E2E Encryption: Encrypt ────────────────────────────────────────

  /**
   * Encrypt a plaintext message using the Triple Ratchet engine.
   *
   * @param plaintext - The message text to encrypt
   * @returns Serialized ciphertext blob (base64 JSON) for transport
   * @throws If no session engine is initialized
   */
  const encryptMessage = useCallback(async (plaintext: string): Promise<string> => {
    if (!engineRef.current) {
      throw new Error('Secret chat session not initialized — call initSession() first');
    }

    const plaintextBytes = encodeText(plaintext);
    const encrypted: TripleRatchetMessage = await engineRef.current.encrypt(plaintextBytes);

    // Wipe plaintext bytes
    plaintextBytes.fill(0);

    return serializeMessage(encrypted);
  }, []);

  // ── E2E Encryption: Decrypt ────────────────────────────────────────

  /**
   * Decrypt a received ciphertext blob using the Triple Ratchet engine.
   *
   * @param ciphertext - Serialized ciphertext blob from the sender
   * @returns Decrypted plaintext string
   * @throws If no session engine is initialized or MAC verification fails
   */
  const decryptMessage = useCallback(async (ciphertext: string): Promise<string> => {
    if (!engineRef.current) {
      throw new Error('Secret chat session not initialized — call initSession() first');
    }

    const message = deserializeMessage(ciphertext);
    const decrypted: TripleRatchetDecryptedMessage = await engineRef.current.decrypt(message);

    return decodeText(decrypted.plaintext);
  }, []);

  // ── Return ─────────────────────────────────────────────────────────

  return {
    session: store.session,
    ghostModeActive: store.ghostMode.isActive,
    ghostModeToggling: store.ghostMode.isToggling,
    selectedThemeId: store.selectedThemeId,
    isPanicWiping: store.isPanicWiping,
    toggleGhostMode,
    setSession: store.setSession,
    setTheme: store.setTheme,
    setAlias: store.setAlias,
    panicWipe,
    reset: store.reset,
    initSession,
    encryptMessage,
    decryptMessage,
  };
}
