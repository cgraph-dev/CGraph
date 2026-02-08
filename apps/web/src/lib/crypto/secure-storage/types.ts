/**
 * Secure Storage Types and Constants
 *
 * @module lib/crypto/secure-storage/types
 * @security CRITICAL - DO NOT MODIFY WITHOUT SECURITY REVIEW
 */

export const DB_NAME = 'cgraph_secure';
export const DB_VERSION = 2;
export const STORE_NAME = 'encrypted_data';
export const SALT_STORE = 'salt_store';

// PBKDF2 iterations - 600,000 as recommended by OWASP 2024
export const PBKDF2_ITERATIONS = 600_000;

/**
 * Encrypted item stored in IndexedDB
 */
export interface EncryptedItem {
  id: string;
  ciphertext: ArrayBuffer;
  iv: ArrayBuffer;
  salt: ArrayBuffer;
  createdAt: number;
  expiresAt?: number;
}

/**
 * Encryption metadata
 */
export interface EncryptionMetadata {
  algorithm: 'AES-GCM';
  keyDerivation: 'PBKDF2';
  iterations: number;
  ivLength: number;
  saltLength: number;
  version: number;
}
