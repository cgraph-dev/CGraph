/**
 * Call Encryption (Mobile)
 *
 * E2EE integration for LiveKit calls on React Native.
 * Mirrors the web implementation but uses react-native-compatible APIs.
 * Key derivation via SubtleCrypto polyfill (react-native-quick-crypto).
 *
 * @module lib/webrtc/callEncryption
 * @version 1.0.0
 */

import { Room, type E2EEOptions } from '@livekit/react-native';

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
 * Uses SubtleCrypto (provided by react-native-quick-crypto polyfill).
 *
 * @param roomKey - Raw room key bytes
 * @param roomName - Room name used as HKDF info
 * @returns Derived key bytes
 */
async function deriveKeyBytes(roomKey: Uint8Array, roomName: string): Promise<Uint8Array> {
  try {
    const subtle = globalThis.crypto?.subtle;
    if (!subtle) {
      // Fallback: use the room key directly if SubtleCrypto not available
      console.warn('[callEncryption] SubtleCrypto not available, using raw key');
      return roomKey;
    }

    const baseKey = await subtle.importKey('raw', roomKey, { name: 'HKDF' }, false, ['deriveKey']);

    const encoder = new TextEncoder();
    const salt = encoder.encode('livekit-e2ee');
    const info = encoder.encode(roomName);

    const derivedKey = await subtle.deriveKey(
      { name: 'HKDF', hash: 'SHA-256', salt, info },
      baseKey,
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );

    const raw = await subtle.exportKey('raw', derivedKey);
    return new Uint8Array(raw);
  } catch (err) {
    console.warn('[callEncryption] Key derivation failed, using raw key:', err);
    return roomKey;
  }
}

// ---------------------------------------------------------------------------
// E2EE Setup
// ---------------------------------------------------------------------------

/** Track E2EE state per room */
const roomE2EEState = new Map<string, CallEncryptionState>();

/**
 * Set up E2EE on a mobile LiveKit Room.
 *
 * @param room - Connected LiveKit Room instance
 * @param roomKey - Raw 256-bit room key from backend
 */
export async function setupMobileE2EE(room: Room, roomKey: Uint8Array): Promise<void> {
  try {
    const keyBytes = await deriveKeyBytes(roomKey, room.name);

    // LiveKit React Native E2EE setup
    // The @livekit/react-native SDK supports E2EE via room options
    const e2eeOptions: E2EEOptions = {
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      keyProvider: {
        setKey: async (_key: Uint8Array) => {
          // Key provider implementation
        },
        getKey: async () => keyBytes,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any,
    };

    // @ts-expect-error - setE2EEEnabled exists at runtime but may be missing from type defs
    await room.setE2EEEnabled(true, e2eeOptions);

    roomE2EEState.set(room.name, {
      isEnabled: true,
      state: 'enabled',
    });
  } catch (err) {
    console.warn('[callEncryption] Mobile E2EE setup failed:', err);
    roomE2EEState.set(room.name, {
      isEnabled: false,
      state: 'disabled',
    });
  }
}

/**
 * Rotate the E2EE key for a mobile room.
 *
 * @param room - Connected LiveKit Room instance
 * @param newKey - New raw 256-bit room key
 */
export async function rotateMobileKey(room: Room, newKey: Uint8Array): Promise<void> {
  try {
    const keyBytes = await deriveKeyBytes(newKey, room.name);
    // Re-setup E2EE with new key
    await setupMobileE2EE(room, keyBytes);
  } catch (err) {
    console.warn('[callEncryption] Mobile key rotation failed:', err);
  }
}

/**
 * Check if E2EE is currently active on a mobile room.
 */
export function isMobileEncrypted(room: Room): boolean {
  return roomE2EEState.get(room.name)?.isEnabled ?? false;
}

/**
 * Get the current E2EE state for a mobile room.
 */
export function getMobileE2EEState(room: Room): CallEncryptionState {
  return (
    roomE2EEState.get(room.name) ?? {
      isEnabled: false,
      state: 'disabled',
    }
  );
}

/**
 * Clean up E2EE resources for a mobile room.
 */
export function cleanupMobileE2EE(room: Room): void {
  roomE2EEState.delete(room.name);
}

/**
 * Decode a base64 room key string to Uint8Array.
 */
export function decodeRoomKey(base64Key: string): Uint8Array {
  // React Native compatible base64 decode
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let bufferLength = base64Key.length * 0.75;
  if (base64Key[base64Key.length - 1] === '=') bufferLength--;
  if (base64Key[base64Key.length - 2] === '=') bufferLength--;

  const bytes = new Uint8Array(bufferLength);
  let p = 0;

  for (let i = 0; i < base64Key.length; i += 4) {
    const encoded1 = chars.indexOf(base64Key[i]);
    const encoded2 = chars.indexOf(base64Key[i + 1]);
    const encoded3 = chars.indexOf(base64Key[i + 2]);
    const encoded4 = chars.indexOf(base64Key[i + 3]);

    bytes[p++] = (encoded1 << 2) | (encoded2 >> 4);
    bytes[p++] = ((encoded2 & 15) << 4) | (encoded3 >> 2);
    bytes[p++] = ((encoded3 & 3) << 6) | (encoded4 & 63);
  }

  return bytes;
}
