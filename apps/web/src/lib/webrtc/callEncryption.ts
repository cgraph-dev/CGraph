/**
 * Call Encryption (Web)
 *
 * SFrame E2EE integration for LiveKit calls using ExternalE2EEKeyProvider.
 * Derives per-room encryption keys via HKDF-SHA256 and manages key lifecycle.
 *
 * @module lib/webrtc/callEncryption
 * @version 1.0.0
 */

import {
  Room,
  RoomEvent,
  type E2EEOptions,
  type ExternalE2EEKeyProvider,
} from 'livekit-client';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type E2EEState = 'enabled' | 'disabled' | 'degraded';

export interface CallEncryptionState {
  isEnabled: boolean;
  state: E2EEState;
}

// ---------------------------------------------------------------------------
// Key Derivation
// ---------------------------------------------------------------------------

/**
 * Derive an encryption key from a room key using HKDF-SHA256.
 *
 * @param roomKey - Raw room key bytes
 * @param roomName - Room name used as HKDF info
 * @returns Derived CryptoKey for E2EE
 */
async function deriveKey(
  roomKey: Uint8Array,
  roomName: string
): Promise<CryptoKey> {
  const baseKey = await crypto.subtle.importKey(
    'raw',
    roomKey,
    { name: 'HKDF' },
    false,
    ['deriveKey']
  );

  const encoder = new TextEncoder();
  const salt = encoder.encode('livekit-e2ee');
  const info = encoder.encode(roomName);

  return crypto.subtle.deriveKey(
    { name: 'HKDF', hash: 'SHA-256', salt, info },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
}

/**
 * Export a CryptoKey to raw bytes for the E2EE key provider.
 */
async function exportKeyToBytes(key: CryptoKey): Promise<Uint8Array> {
  const raw = await crypto.subtle.exportKey('raw', key);
  return new Uint8Array(raw);
}

// ---------------------------------------------------------------------------
// E2EE Setup
// ---------------------------------------------------------------------------

/** Store key providers per room for cleanup */
const roomKeyProviders = new Map<string, ExternalE2EEKeyProvider>();

/**
 * Set up SFrame E2EE on a LiveKit Room.
 *
 * Creates an ExternalE2EEKeyProvider, derives the encryption key via
 * HKDF-SHA256, and enables E2EE on the room.
 *
 * @param room - Connected LiveKit Room instance
 * @param roomKey - Raw 256-bit room key from backend
 */
export async function setupE2EE(
  room: Room,
  roomKey: Uint8Array
): Promise<void> {
  try {
    // Dynamic import to handle environments where E2EE isn't available
    const { ExternalE2EEKeyProvider: KeyProvider } = await import(
      'livekit-client'
    );

    const keyProvider = new KeyProvider();
    const derivedKey = await deriveKey(roomKey, room.name);
    const keyBytes = await exportKeyToBytes(derivedKey);

    // Set the key material on the provider
    await keyProvider.setKey(keyBytes);

    // Configure E2EE options
    const e2eeOptions: E2EEOptions = {
      keyProvider,
      worker: undefined, // Uses default SFrame worker
    };

    // Enable E2EE on the room
    await room.setE2EEEnabled(true, e2eeOptions);

    // Store provider for later key rotation
    roomKeyProviders.set(room.name, keyProvider);
  } catch (err) {
    console.warn('[callEncryption] E2EE setup failed, continuing without encryption:', err);
  }
}

/**
 * Rotate the E2EE key for a room.
 *
 * @param room - Connected LiveKit Room instance
 * @param newKey - New raw 256-bit room key
 */
export async function rotateKey(
  room: Room,
  newKey: Uint8Array
): Promise<void> {
  const keyProvider = roomKeyProviders.get(room.name);
  if (!keyProvider) {
    console.warn('[callEncryption] No key provider found for room, setting up fresh');
    await setupE2EE(room, newKey);
    return;
  }

  try {
    const derivedKey = await deriveKey(newKey, room.name);
    const keyBytes = await exportKeyToBytes(derivedKey);
    await keyProvider.setKey(keyBytes);
  } catch (err) {
    console.warn('[callEncryption] Key rotation failed:', err);
  }
}

/**
 * Check if E2EE is currently active on a room.
 */
export function isEncrypted(room: Room): boolean {
  return room.isE2EEEnabled ?? false;
}

/**
 * Get the current E2EE state for a room.
 */
export function getE2EEState(room: Room): CallEncryptionState {
  const enabled = isEncrypted(room);
  return {
    isEnabled: enabled,
    state: enabled ? 'enabled' : 'disabled',
  };
}

/**
 * Clean up E2EE resources for a room.
 */
export function cleanupE2EE(room: Room): void {
  roomKeyProviders.delete(room.name);
}

/**
 * Decode a base64 room key string to Uint8Array.
 */
export function decodeRoomKey(base64Key: string): Uint8Array {
  const binaryString = atob(base64Key);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}
