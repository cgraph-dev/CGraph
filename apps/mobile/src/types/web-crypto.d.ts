/**
 * Minimal Web Crypto API type declarations for React Native.
 *
 * The mobile tsconfig uses `"lib": ["ES2023"]` which excludes DOM/WebCrypto types.
 * These declarations cover only the subset actually used by:
 *   - src/lib/crypto/e2ee.ts
 *   - src/lib/crypto/group-e2ee.ts
 *   - packages/crypto/src/ (aes, utils, types, x3dh, pqxdh, doubleRatchet)
 *
 * At runtime, react-native-quick-crypto (or a polyfill) provides the implementation.
 */

declare type KeyUsage =
  | 'decrypt'
  | 'deriveBits'
  | 'deriveKey'
  | 'encrypt'
  | 'sign'
  | 'unwrapKey'
  | 'verify'
  | 'wrapKey';

declare type KeyType = 'private' | 'public' | 'secret';
declare type KeyFormat = 'jwk' | 'pkcs8' | 'raw' | 'spki';

declare interface CryptoKey {
  readonly algorithm: KeyAlgorithm;
  readonly extractable: boolean;
  readonly type: KeyType;
  readonly usages: KeyUsage[];
}

declare interface KeyAlgorithm {
  name: string;
}

declare interface CryptoKeyPair {
  privateKey: CryptoKey;
  publicKey: CryptoKey;
}

declare interface Algorithm {
  name: string;
}

declare interface AesKeyGenParams extends Algorithm {
  length: number;
}

declare interface AesGcmParams extends Algorithm {
  iv: BufferSource;
  additionalData?: BufferSource;
  tagLength?: number;
}

declare interface EcKeyGenParams extends Algorithm {
  namedCurve: string;
}

declare interface EcdhKeyDeriveParams extends Algorithm {
  public: CryptoKey;
}

declare interface HmacImportParams extends Algorithm {
  hash: string | Algorithm;
  length?: number;
}

declare interface HkdfParams extends Algorithm {
  hash: string | Algorithm;
  info: BufferSource;
  salt: BufferSource;
}

declare interface Pbkdf2Params extends Algorithm {
  hash: string | Algorithm;
  iterations: number;
  salt: BufferSource;
}

declare interface SubtleCrypto {
  decrypt(algorithm: Algorithm | AesGcmParams, key: CryptoKey, data: BufferSource): Promise<ArrayBuffer>;
  deriveBits(algorithm: Algorithm | EcdhKeyDeriveParams | HkdfParams | Pbkdf2Params, baseKey: CryptoKey, length: number): Promise<ArrayBuffer>;
  deriveKey(algorithm: Algorithm | EcdhKeyDeriveParams | HkdfParams | Pbkdf2Params, baseKey: CryptoKey, derivedKeyType: Algorithm | AesKeyGenParams | HmacImportParams, extractable: boolean, keyUsages: KeyUsage[]): Promise<CryptoKey>;
  digest(algorithm: Algorithm | string, data: BufferSource): Promise<ArrayBuffer>;
  encrypt(algorithm: Algorithm | AesGcmParams, key: CryptoKey, data: BufferSource): Promise<ArrayBuffer>;
  exportKey(format: 'jwk', key: CryptoKey): Promise<JsonWebKey>;
  exportKey(format: Exclude<KeyFormat, 'jwk'>, key: CryptoKey): Promise<ArrayBuffer>;
  generateKey(algorithm: EcKeyGenParams, extractable: boolean, keyUsages: KeyUsage[]): Promise<CryptoKeyPair>;
  generateKey(algorithm: AesKeyGenParams | HmacImportParams, extractable: boolean, keyUsages: KeyUsage[]): Promise<CryptoKey>;
  importKey(format: 'jwk', keyData: JsonWebKey, algorithm: Algorithm | EcKeyGenParams | HmacImportParams | AesKeyGenParams, extractable: boolean, keyUsages: KeyUsage[]): Promise<CryptoKey>;
  importKey(format: Exclude<KeyFormat, 'jwk'>, keyData: BufferSource, algorithm: Algorithm | EcKeyGenParams | HmacImportParams | AesKeyGenParams, extractable: boolean, keyUsages: KeyUsage[]): Promise<CryptoKey>;
  sign(algorithm: Algorithm | EcKeyGenParams, key: CryptoKey, data: BufferSource): Promise<ArrayBuffer>;
  verify(algorithm: Algorithm | EcKeyGenParams, key: CryptoKey, signature: BufferSource, data: BufferSource): Promise<boolean>;
}
