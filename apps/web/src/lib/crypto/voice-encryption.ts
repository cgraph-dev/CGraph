/**
 * Voice message metadata encryption (E2EE-06).
 *
 * Encrypts waveform array and duration before sending to backend.
 * The audio blob itself is encrypted via the file encryption path (E2EE-05).
 * This module handles the metadata fields specifically.
 *
 * @module voice-encryption
 */

import { encryptAES, decryptAES, generateAESKey } from '@cgraph/crypto';

/**
 * Encrypted voice metadata ready for backend transport.
 */
export interface EncryptedVoiceMetadata {
  encrypted_waveform: string;
  encrypted_duration: string;
  waveform_iv: string;
  duration_iv: string;
  metadata_encrypted_key: string;
  is_metadata_encrypted: boolean;
}

/**
 * Decrypted voice metadata from backend.
 */
export interface DecryptedVoiceMetadata {
  waveform: number[];
  duration: number;
}

/**
 * ArrayBuffer to base64 string helper.
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary);
}

/**
 * Base64 string to ArrayBuffer helper.
 */
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Encrypt voice message waveform and duration metadata.
 *
 * Generates a per-metadata AES key, encrypts both waveform (as JSON)
 * and duration (as string), then wraps the metadata key with the
 * session ratchet key.
 *
 * @param waveform - Array of waveform amplitude values
 * @param duration - Voice message duration in seconds
 * @param sessionKey - Session ratchet key for key wrapping
 * @returns Encrypted metadata ready for backend POST
 */
export async function encryptVoiceMetadata(
  waveform: number[],
  duration: number,
  sessionKey: CryptoKey
): Promise<EncryptedVoiceMetadata> {
  const metadataKey = await generateAESKey();
  const waveformData = JSON.stringify(waveform);
  const durationData = String(duration);

  const encWaveform = await encryptAES(waveformData, metadataKey);
  const encDuration = await encryptAES(durationData, metadataKey);

  // Wrap metadata key with session ratchet key
  const rawKey = await crypto.subtle.exportKey('raw', metadataKey);
  const keyAsBase64 = arrayBufferToBase64(rawKey);
  const wrappedKey = await encryptAES(keyAsBase64, sessionKey);

  return {
    encrypted_waveform: arrayBufferToBase64(encWaveform.ciphertext),
    encrypted_duration: arrayBufferToBase64(encDuration.ciphertext),
    waveform_iv: arrayBufferToBase64(encWaveform.nonce),
    duration_iv: arrayBufferToBase64(encDuration.nonce),
    metadata_encrypted_key: arrayBufferToBase64(wrappedKey.ciphertext),
    is_metadata_encrypted: true,
  };
}

/**
 * Decrypt voice message metadata from backend.
 *
 * @param encrypted - Encrypted metadata from GET /voice-messages/:id/waveform
 * @param sessionKey - Session ratchet key for key unwrapping
 * @returns Decrypted waveform array and duration
 */
export async function decryptVoiceMetadata(
  encrypted: {
    encrypted_waveform: string;
    encrypted_duration: string;
    waveform_iv: string;
    duration_iv: string;
    metadata_encrypted_key: string;
  },
  sessionKey: CryptoKey
): Promise<DecryptedVoiceMetadata> {
  // Unwrap the metadata key
  const wrappedKeyBuffer = base64ToArrayBuffer(encrypted.metadata_encrypted_key);
  // Use same nonce as waveform for key unwrapping (matching encrypt pattern)
  const waveformIv = base64ToArrayBuffer(encrypted.waveform_iv);
  const keyAsBase64 = await decryptAES(wrappedKeyBuffer, waveformIv, sessionKey);
  const rawKey = base64ToArrayBuffer(keyAsBase64);

  // Decrypt waveform
  const waveformBuffer = base64ToArrayBuffer(encrypted.encrypted_waveform);
  const waveformIvBytes = base64ToArrayBuffer(encrypted.waveform_iv);
  const waveformJson = await decryptAES(waveformBuffer, waveformIvBytes, rawKey);
  const waveform: number[] = JSON.parse(waveformJson);

  // Decrypt duration
  const durationBuffer = base64ToArrayBuffer(encrypted.encrypted_duration);
  const durationIv = base64ToArrayBuffer(encrypted.duration_iv);
  const durationStr = await decryptAES(durationBuffer, durationIv, rawKey);
  const duration = parseFloat(durationStr);

  return { waveform, duration };
}
