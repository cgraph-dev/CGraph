/**
 * Secure Storage - Re-export Barrel
 *
 * This file re-exports the SecureStorage API from the secure-storage/ submodules
 * to maintain backward compatibility with existing imports.
 *
 * @module lib/crypto/secureStorage
 // eslint-disable-next-line jsdoc/check-tag-names
 * @security CRITICAL - DO NOT MODIFY WITHOUT SECURITY REVIEW
 */

export { default } from './secure-storage';
export type { EncryptedItem, EncryptionMetadata } from './secure-storage';
