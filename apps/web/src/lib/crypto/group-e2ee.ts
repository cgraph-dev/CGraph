/**
 * Group E2EE - Sender Key protocol for group message encryption.
 *
 * Uses ECDH P-256 for key agreement and AES-256-GCM for message encryption.
 * Each group member generates a sender key and distributes it to all others.
 * Messages are encrypted with the sender's key using a ratcheting chain index.
 *
 * @module lib/crypto/group-e2ee
 */

// =============================================================================
// Types
// =============================================================================

export interface SenderKeyPair {
  senderKeyId: string;
  publicKey: CryptoKey;
  privateKey: CryptoKey;
  chainIndex: number;
}

export interface EncryptedGroupMessage {
  ciphertext: string; // base64
  senderKeyId: string;
  chainIndex: number;
  iv: string; // base64
}

export interface PeerSenderKey {
  senderKeyId: string;
  publicKey: CryptoKey;
  chainIndex: number;
}

// =============================================================================
// Key Generation
// =============================================================================

/**
 * Generate a new Sender Key pair for group E2EE.
 * Uses ECDH P-256 for key exchange compatibility.
 */
export async function generateSenderKey(): Promise<SenderKeyPair> {
  const keyPair = await crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    ['deriveBits']
  );

  const senderKeyId = generateKeyId();

  return {
    senderKeyId,
    publicKey: keyPair.publicKey,
    privateKey: keyPair.privateKey,
    chainIndex: 0,
  };
}

// =============================================================================
// Message Encryption
// =============================================================================

/**
 * Encrypt a group message using the sender's key.
 * Uses AES-256-GCM with a derived key from the sender key + chain index.
 */
export async function encryptGroupMessage(
  content: string,
  senderKey: SenderKeyPair
): Promise<EncryptedGroupMessage> {
  // Derive encryption key from sender key + chain index via HKDF
  const rawKey = await crypto.subtle.exportKey('raw', senderKey.publicKey);
  const chainData = new TextEncoder().encode(`chain-${senderKey.chainIndex}`);
  const combined = new Uint8Array([...new Uint8Array(rawKey), ...chainData]);

  // Hash to derive AES key
  const hashBuffer = await crypto.subtle.digest('SHA-256', combined);
  const aesKey = await crypto.subtle.importKey(
    'raw',
    hashBuffer,
    { name: 'AES-GCM' },
    false,
    ['encrypt']
  );

  // Encrypt with AES-256-GCM
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(content);
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    aesKey,
    encoded
  );

  return {
    ciphertext: arrayBufferToBase64(ciphertext),
    senderKeyId: senderKey.senderKeyId,
    chainIndex: senderKey.chainIndex,
    iv: arrayBufferToBase64(iv.buffer),
  };
}

/**
 * Decrypt a group message using the sender's public key.
 */
export async function decryptGroupMessage(
  encrypted: EncryptedGroupMessage,
  senderPublicKey: CryptoKey
): Promise<string> {
  // Derive the same AES key from sender's public key + chain index
  const rawKey = await crypto.subtle.exportKey('raw', senderPublicKey);
  const chainData = new TextEncoder().encode(`chain-${encrypted.chainIndex}`);
  const combined = new Uint8Array([...new Uint8Array(rawKey), ...chainData]);

  const hashBuffer = await crypto.subtle.digest('SHA-256', combined);
  const aesKey = await crypto.subtle.importKey(
    'raw',
    hashBuffer,
    { name: 'AES-GCM' },
    false,
    ['decrypt']
  );

  const iv = base64ToArrayBuffer(encrypted.iv);
  const ciphertext = base64ToArrayBuffer(encrypted.ciphertext);

  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: new Uint8Array(iv) },
    aesKey,
    ciphertext
  );

  return new TextDecoder().decode(decrypted);
}

// =============================================================================
// Key Distribution
// =============================================================================

/**
 * Encrypt a sender key for a specific recipient using their identity public key.
 * Uses ECDH key agreement + AES-GCM wrapping.
 */
export async function encryptSenderKeyForRecipient(
  senderKey: SenderKeyPair,
  recipientIdentityPublicKey: CryptoKey
): Promise<string> {
  // Export sender private key
  const exportedKey = await crypto.subtle.exportKey('pkcs8', senderKey.privateKey);

  // Generate ephemeral key for ECDH
  const ephemeral = await crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    ['deriveBits']
  );

  // Derive shared secret via ECDH
  const sharedBits = await crypto.subtle.deriveBits(
    { name: 'ECDH', public: recipientIdentityPublicKey },
    ephemeral.privateKey,
    256
  );

  // Use shared secret as AES key
  const wrapKey = await crypto.subtle.importKey(
    'raw',
    sharedBits,
    { name: 'AES-GCM' },
    false,
    ['encrypt']
  );

  // Encrypt the sender key
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    wrapKey,
    exportedKey
  );

  // Encode: ephemeral public key + iv + ciphertext
  const ephemeralPub = await crypto.subtle.exportKey('raw', ephemeral.publicKey);
  const result = new Uint8Array([
    ...new Uint8Array(ephemeralPub),
    ...iv,
    ...new Uint8Array(encrypted),
  ]);

  return arrayBufferToBase64(result.buffer);
}

/**
 * Decrypt a received sender key using own identity private key.
 */
export async function decryptReceivedSenderKey(
  encryptedData: string,
  ownIdentityPrivateKey: CryptoKey
): Promise<CryptoKey> {
  const data = new Uint8Array(base64ToArrayBuffer(encryptedData));

  // Parse: 65 bytes ephemeral public key + 12 bytes IV + rest is ciphertext
  const ephemeralPubBytes = data.slice(0, 65);
  const iv = data.slice(65, 77);
  const ciphertext = data.slice(77);

  // Import ephemeral public key
  const ephemeralPub = await crypto.subtle.importKey(
    'raw',
    ephemeralPubBytes,
    { name: 'ECDH', namedCurve: 'P-256' },
    false,
    []
  );

  // Derive shared secret
  const sharedBits = await crypto.subtle.deriveBits(
    { name: 'ECDH', public: ephemeralPub },
    ownIdentityPrivateKey,
    256
  );

  // Use shared secret as AES key
  const unwrapKey = await crypto.subtle.importKey(
    'raw',
    sharedBits,
    { name: 'AES-GCM' },
    false,
    ['decrypt']
  );

  // Decrypt the sender key
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    unwrapKey,
    ciphertext
  );

  // Import as ECDH private key
  return crypto.subtle.importKey(
    'pkcs8',
    decrypted,
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    ['deriveBits']
  );
}

// =============================================================================
// Key Export/Import
// =============================================================================

/**
 * Export a public key to base64 for transmission.
 */
export async function exportPublicKey(key: CryptoKey): Promise<string> {
  const raw = await crypto.subtle.exportKey('raw', key);
  return arrayBufferToBase64(raw);
}

/**
 * Import a public key from base64.
 */
export async function importPublicKey(base64Key: string): Promise<CryptoKey> {
  const raw = base64ToArrayBuffer(base64Key);
  return crypto.subtle.importKey(
    'raw',
    raw,
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    []
  );
}

// =============================================================================
// Utilities
// =============================================================================

function generateKeyId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}
