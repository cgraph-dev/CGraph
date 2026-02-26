/**
 * CGraph Crypto Error System
 *
 * Typed error hierarchy matching Signal's SignalProtocolError pattern.
 * Every error carries a machine-readable code and human-readable message.
 *
 * @module @cgraph/crypto/errors
 */

// =============================================================================
// ERROR CODES — exhaustive enum for programmatic handling
// =============================================================================

export enum CryptoErrorCode {
  // Session errors
  SESSION_NOT_INITIALIZED = 'SESSION_NOT_INITIALIZED',
  SESSION_NOT_FOUND = 'SESSION_NOT_FOUND',
  SESSION_CORRUPTED = 'SESSION_CORRUPTED',
  SESSION_EXPIRED = 'SESSION_EXPIRED',

  // Key errors
  INVALID_KEY = 'INVALID_KEY',
  INVALID_KEY_LENGTH = 'INVALID_KEY_LENGTH',
  INVALID_KEY_TYPE = 'INVALID_KEY_TYPE',
  KEY_NOT_FOUND = 'KEY_NOT_FOUND',
  KEY_ALREADY_EXISTS = 'KEY_ALREADY_EXISTS',
  KEY_GENERATION_FAILED = 'KEY_GENERATION_FAILED',

  // Signature errors
  INVALID_SIGNATURE = 'INVALID_SIGNATURE',
  SIGNATURE_VERIFICATION_FAILED = 'SIGNATURE_VERIFICATION_FAILED',

  // Protocol errors
  INVALID_MESSAGE = 'INVALID_MESSAGE',
  INVALID_HEADER = 'INVALID_HEADER',
  INVALID_PROTOCOL_VERSION = 'INVALID_PROTOCOL_VERSION',
  UNSUPPORTED_PROTOCOL_VERSION = 'UNSUPPORTED_PROTOCOL_VERSION',
  DUPLICATE_MESSAGE = 'DUPLICATE_MESSAGE',
  MESSAGE_TOO_OLD = 'MESSAGE_TOO_OLD',

  // Ratchet errors
  TOO_MANY_SKIPPED_MESSAGES = 'TOO_MANY_SKIPPED_MESSAGES',
  NO_SENDING_CHAIN = 'NO_SENDING_CHAIN',
  NO_RECEIVING_CHAIN = 'NO_RECEIVING_CHAIN',
  DH_RATCHET_FAILED = 'DH_RATCHET_FAILED',

  // Encryption errors
  ENCRYPTION_FAILED = 'ENCRYPTION_FAILED',
  DECRYPTION_FAILED = 'DECRYPTION_FAILED',
  MAC_VERIFICATION_FAILED = 'MAC_VERIFICATION_FAILED',

  // KEM errors
  KEM_ENCAPSULATION_FAILED = 'KEM_ENCAPSULATION_FAILED',
  KEM_DECAPSULATION_FAILED = 'KEM_DECAPSULATION_FAILED',
  INVALID_KEM_CIPHERTEXT = 'INVALID_KEM_CIPHERTEXT',
  INVALID_KEM_KEY = 'INVALID_KEM_KEY',

  // PQXDH errors
  PQXDH_FAILED = 'PQXDH_FAILED',
  MISSING_ONE_TIME_PREKEY = 'MISSING_ONE_TIME_PREKEY',
  MISSING_KEM_PREKEY = 'MISSING_KEM_PREKEY',

  // SPQR / Triple Ratchet errors
  SPQR_EPOCH_ERROR = 'SPQR_EPOCH_ERROR',
  SPQR_CHAIN_EXHAUSTED = 'SPQR_CHAIN_EXHAUSTED',
  TRIPLE_RATCHET_DESYNC = 'TRIPLE_RATCHET_DESYNC',

  // Store errors
  STORE_ERROR = 'STORE_ERROR',
  SERIALIZATION_ERROR = 'SERIALIZATION_ERROR',
  DESERIALIZATION_ERROR = 'DESERIALIZATION_ERROR',

  // General
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  NOT_IMPLEMENTED = 'NOT_IMPLEMENTED',
}

// =============================================================================
// CRYPTO ERROR CLASS
// =============================================================================

/**
 * Structured error with machine-readable code.
 *
 * ```ts
 * try {
 *   await engine.decrypt(msg);
 * } catch (e) {
 *   if (e instanceof CryptoError && e.code === CryptoErrorCode.MAC_VERIFICATION_FAILED) {
 *     // handle tampered message
 *   }
 * }
 * ```
 */
export class CryptoError extends Error {
  readonly code: CryptoErrorCode;
  readonly cause?: Error;

  constructor(code: CryptoErrorCode, message: string, cause?: Error) {
    super(message);
    this.name = 'CryptoError';
    this.code = code;
    this.cause = cause;

    // Maintain proper stack trace in V8
    if ('captureStackTrace' in Error) {
      (
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions, @typescript-eslint/no-unsafe-function-type
        Error as { captureStackTrace?: (target: Error, constructor: Function) => void }
      ).captureStackTrace?.(this, CryptoError);
    }
  }

  /** Human-readable representation */
  toString(): string {
    const base = `CryptoError[${this.code}]: ${this.message}`;
    return this.cause ? `${base} (caused by: ${this.cause.message})` : base;
  }

  /** JSON-safe serialization */
  toJSON(): { code: CryptoErrorCode; message: string; cause?: string } {
    return {
      code: this.code,
      message: this.message,
      ...(this.cause ? { cause: this.cause.message } : {}),
    };
  }
}

// =============================================================================
// CONVENIENCE FACTORIES
// =============================================================================

/** Creates a CryptoError indicating the session has not been initialized. */
export function sessionNotInitialized(detail?: string): CryptoError {
  return new CryptoError(
    CryptoErrorCode.SESSION_NOT_INITIALIZED,
    detail ?? 'Session not initialized — call initialize() first'
  );
}

/** Creates a CryptoError for an invalid cryptographic key. */
export function invalidKey(detail: string): CryptoError {
  return new CryptoError(CryptoErrorCode.INVALID_KEY, detail);
}

/** Creates a CryptoError for a failed message authentication code verification. */
export function macVerificationFailed(): CryptoError {
  return new CryptoError(
    CryptoErrorCode.MAC_VERIFICATION_FAILED,
    'Message authentication code verification failed'
  );
}

/** Creates a CryptoError when the skipped message limit is exceeded. */
export function tooManySkippedMessages(count: number, max: number): CryptoError {
  return new CryptoError(
    CryptoErrorCode.TOO_MANY_SKIPPED_MESSAGES,
    `Cannot skip ${count} messages (max ${max})`
  );
}

/** Creates a CryptoError for an unsupported protocol version. */
export function invalidProtocolVersion(got: number, expected: number): CryptoError {
  return new CryptoError(
    CryptoErrorCode.INVALID_PROTOCOL_VERSION,
    `Protocol version ${got} not supported, expected ${expected}`
  );
}
