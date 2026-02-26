/**
 * E2EE Utility Functions
 *
 * Encoding/decoding helpers and random byte generation.
 *
 * @module lib/crypto/e2ee/utils
 */

/**
 * Utility functions for encoding/decoding
 */
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i] ?? 0);
  }
  return btoa(binary);
}

/**
 * unknown for the crypto module.
 */
/**
 * base64 To Array Buffer for the crypto module.
 *
 * @param base64 - The base64.
 * @returns The result.
 */
export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * unknown for the crypto module.
 */
/**
 * array Buffer To Hex for the crypto module.
 *
 * @param buffer - The buffer.
 * @returns The result.
 */
export function arrayBufferToHex(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Generate cryptographically secure random bytes
 */
export function randomBytes(length: number): Uint8Array {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return bytes;
}

/**
 * Generate a random key ID
 */
export function generateKeyId(): string {
   
  return arrayBufferToHex(randomBytes(8).buffer as ArrayBuffer); // safe downcast – structural boundary
}

/**
 * Generate a device ID
 */
export function generateDeviceId(): string {
  const browserInfo = navigator.userAgent.substring(0, 20).replace(/[^a-zA-Z0-9]/g, '');
   
  const randomPart = arrayBufferToHex(randomBytes(4).buffer as ArrayBuffer); // safe downcast – structural boundary
  return `${browserInfo}_${randomPart}_${Date.now()}`;
}
