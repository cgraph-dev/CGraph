/**
 * Tests for CryptoError system
 */
import { describe, it, expect } from 'vitest';
import {
  CryptoError,
  CryptoErrorCode,
  sessionNotInitialized,
  invalidKey,
  macVerificationFailed,
  tooManySkippedMessages,
  invalidProtocolVersion,
} from '../errors';

describe('CryptoError', () => {
  it('carries code and message', () => {
    const err = new CryptoError(CryptoErrorCode.INVALID_KEY, 'bad key');
    expect(err.code).toBe(CryptoErrorCode.INVALID_KEY);
    expect(err.message).toBe('bad key');
    expect(err.name).toBe('CryptoError');
  });

  it('preserves cause chain', () => {
    const cause = new Error('root cause');
    const err = new CryptoError(CryptoErrorCode.INTERNAL_ERROR, 'wrapper', cause);
    expect(err.cause).toBe(cause);
    expect(err.toString()).toContain('root cause');
  });

  it('serializes to JSON', () => {
    const err = new CryptoError(CryptoErrorCode.MAC_VERIFICATION_FAILED, 'bad mac');
    const json = err.toJSON();
    expect(json.code).toBe(CryptoErrorCode.MAC_VERIFICATION_FAILED);
    expect(json.message).toBe('bad mac');
    expect(json.cause).toBeUndefined();
  });

  it('is instance of Error', () => {
    const err = new CryptoError(CryptoErrorCode.INVALID_KEY, 'test');
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(CryptoError);
  });
});

describe('Error factories', () => {
  it('sessionNotInitialized', () => {
    const err = sessionNotInitialized();
    expect(err.code).toBe(CryptoErrorCode.SESSION_NOT_INITIALIZED);
  });

  it('invalidKey', () => {
    const err = invalidKey('too short');
    expect(err.code).toBe(CryptoErrorCode.INVALID_KEY);
    expect(err.message).toBe('too short');
  });

  it('macVerificationFailed', () => {
    const err = macVerificationFailed();
    expect(err.code).toBe(CryptoErrorCode.MAC_VERIFICATION_FAILED);
  });

  it('tooManySkippedMessages', () => {
    const err = tooManySkippedMessages(2000, 1000);
    expect(err.code).toBe(CryptoErrorCode.TOO_MANY_SKIPPED_MESSAGES);
    expect(err.message).toContain('2000');
  });

  it('invalidProtocolVersion', () => {
    const err = invalidProtocolVersion(2, 4);
    expect(err.code).toBe(CryptoErrorCode.INVALID_PROTOCOL_VERSION);
    expect(err.message).toContain('2');
  });
});
