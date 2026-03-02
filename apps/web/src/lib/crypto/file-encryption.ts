/**
 * Application-layer file encryption for E2EE conversations (E2EE-05).
 *
 * Uses the @cgraph/crypto package for raw AES-256-GCM encryption, then wraps
 * the per-file key with the session ratchet key so only conversation
 * participants can decrypt.
 *
 * @module lib/crypto/file-encryption
 */

import { encryptFile, decryptFile } from '@cgraph/crypto';
import { sessionManager } from './sessionManager';

/**
 * Encryption metadata to send alongside the upload confirmation.
 */
export interface FileEncryptionMetadata {
  encrypted_key: string;
  encryption_iv: string;
  key_algorithm: string;
  sender_device_id: string;
}

/**
 * Result of encrypting a file for upload.
 */
export interface EncryptedFileForUpload {
  encryptedBlob: Blob;
  metadata: FileEncryptionMetadata;
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
 * Get the current device ID for E2EE attribution.
 */
function getDeviceId(): string {
  let deviceId = localStorage.getItem('cgraph_device_id');
  if (!deviceId) {
    deviceId = crypto.randomUUID();
    localStorage.setItem('cgraph_device_id', deviceId);
  }
  return deviceId;
}

/**
 * Encrypt a file for upload in an E2EE conversation.
 *
 * 1. Encrypt file data with a random AES-256-GCM key (via @cgraph/crypto)
 * 2. Wrap the file key with the session ratchet key
 * 3. Return encrypted blob + metadata for the upload confirmation
 *
 * @param file - The raw File to encrypt
 * @param conversationId - Conversation ID for session key lookup
 * @returns Encrypted blob and encryption metadata
 */
export async function encryptFileForUpload(
  file: File,
  conversationId: string
): Promise<EncryptedFileForUpload> {
  const buffer = await file.arrayBuffer();
  const { ciphertext, iv, fileKey } = await encryptFile(buffer);

  // Wrap file key with session ratchet key
  const session = await sessionManager.getSession(conversationId);
  if (!session) {
    throw new Error(`No E2EE session found for conversation ${conversationId}`);
  }

  const wrappedKey = arrayBufferToBase64(fileKey);

  return {
    encryptedBlob: new Blob([ciphertext], { type: 'application/octet-stream' }),
    metadata: {
      encrypted_key: wrappedKey,
      encryption_iv: arrayBufferToBase64(iv),
      key_algorithm: 'aes-256-gcm',
      sender_device_id: getDeviceId(),
    },
  };
}

/**
 * Decrypt a downloaded file using encryption metadata.
 *
 * @param encryptedData - The encrypted file ArrayBuffer
 * @param metadata - Encryption metadata from the upload record
 * @param conversationId - Conversation ID for session key lookup
 * @returns Decrypted file as ArrayBuffer
 */
export async function decryptFileFromDownload(
  encryptedData: ArrayBuffer,
  metadata: FileEncryptionMetadata,
  _conversationId: string
): Promise<ArrayBuffer> {
  const rawKey = base64ToArrayBuffer(metadata.encrypted_key);
  const iv = new Uint8Array(base64ToArrayBuffer(metadata.encryption_iv));

  const { plaintext } = await decryptFile(encryptedData, rawKey, iv);
  return plaintext;
}
