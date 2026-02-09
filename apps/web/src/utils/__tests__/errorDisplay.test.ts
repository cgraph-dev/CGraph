import { describe, it, expect, vi } from 'vitest';
import {
  getDisplayError,
  isRenderableError,
  toErrorString,
  createErrorHandler,
} from '../errorDisplay';

// ═══════════════════════════════════════════════════════════════════
// getDisplayError
// ═══════════════════════════════════════════════════════════════════

describe('getDisplayError', () => {
  // ── String inputs ────────────────────────────────────────────────
  it('returns a string error as-is', () => {
    expect(getDisplayError('Something went wrong')).toBe('Something went wrong');
  });

  it('returns an empty string as-is', () => {
    expect(getDisplayError('')).toBe('');
  });

  it('returns a whitespace-only string as-is', () => {
    expect(getDisplayError('   ')).toBe('   ');
  });

  // ── Error instances ──────────────────────────────────────────────
  it('extracts message from Error instance', () => {
    expect(getDisplayError(new Error('Network failure'))).toBe('Network failure');
  });

  it('extracts message from TypeError instance', () => {
    expect(getDisplayError(new TypeError('null is not an object'))).toBe('null is not an object');
  });

  it('returns fallback for Error with empty message', () => {
    expect(getDisplayError(new Error(''))).toBe('An unexpected error occurred');
  });

  it('uses custom fallback for Error with empty message', () => {
    expect(getDisplayError(new Error(''), 'Custom fallback')).toBe('Custom fallback');
  });

  // ── API error objects ────────────────────────────────────────────
  it('extracts message field from error object', () => {
    expect(getDisplayError({ message: 'Invalid email' })).toBe('Invalid email');
  });

  it('extracts error field from error object', () => {
    expect(getDisplayError({ error: 'Unauthorized' })).toBe('Unauthorized');
  });

  it('extracts detail field from error object', () => {
    expect(getDisplayError({ detail: 'Rate limited' })).toBe('Rate limited');
  });

  it('uses code field when other fields missing', () => {
    expect(getDisplayError({ code: 'E429' })).toBe('Error: E429');
  });

  it('prefers message over error and detail', () => {
    expect(getDisplayError({ message: 'Primary', error: 'Secondary', detail: 'Tertiary' })).toBe(
      'Primary'
    );
  });

  it('prefers error over detail when message is absent', () => {
    expect(getDisplayError({ error: 'Secondary', detail: 'Tertiary' })).toBe('Secondary');
  });

  it('returns fallback for empty error object', () => {
    expect(getDisplayError({})).toBe('An unexpected error occurred');
  });

  it('returns fallback for object with only unrelated fields', () => {
    expect(getDisplayError({ status: 500, headers: {} })).toBe('An unexpected error occurred');
  });

  // ── Nullish and primitive inputs ─────────────────────────────────
  it('returns fallback for null', () => {
    expect(getDisplayError(null)).toBe('An unexpected error occurred');
  });

  it('returns fallback for undefined', () => {
    expect(getDisplayError(undefined)).toBe('An unexpected error occurred');
  });

  it('returns fallback for number', () => {
    expect(getDisplayError(42)).toBe('An unexpected error occurred');
  });

  it('returns fallback for boolean', () => {
    expect(getDisplayError(false)).toBe('An unexpected error occurred');
  });

  it('returns fallback for symbol', () => {
    expect(getDisplayError(Symbol('err'))).toBe('An unexpected error occurred');
  });

  // ── Custom fallback ──────────────────────────────────────────────
  it('uses custom fallback for null', () => {
    expect(getDisplayError(null, 'Login failed')).toBe('Login failed');
  });

  it('uses custom fallback for unknown object', () => {
    expect(getDisplayError({}, 'Signup failed')).toBe('Signup failed');
  });

  // ── Edge cases ───────────────────────────────────────────────────
  it('handles array input (object branch, no message)', () => {
    expect(getDisplayError([1, 2, 3])).toBe('An unexpected error occurred');
  });

  it('handles object with message set to empty string', () => {
    // Empty string is falsy → falls to error, then detail, then code, then fallback
    expect(getDisplayError({ message: '', error: 'Fallback error' })).toBe('Fallback error');
  });
});

// ═══════════════════════════════════════════════════════════════════
// isRenderableError
// ═══════════════════════════════════════════════════════════════════

describe('isRenderableError', () => {
  it('returns true for null', () => {
    expect(isRenderableError(null)).toBe(true);
  });

  it('returns true for a string', () => {
    expect(isRenderableError('Error message')).toBe(true);
  });

  it('returns true for empty string', () => {
    expect(isRenderableError('')).toBe(true);
  });

  it('returns false for undefined', () => {
    expect(isRenderableError(undefined)).toBe(false);
  });

  it('returns false for Error instance', () => {
    expect(isRenderableError(new Error('oops'))).toBe(false);
  });

  it('returns false for object', () => {
    expect(isRenderableError({ message: 'error' })).toBe(false);
  });

  it('returns false for number', () => {
    expect(isRenderableError(0)).toBe(false);
  });

  it('returns false for boolean', () => {
    expect(isRenderableError(true)).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════
// toErrorString
// ═══════════════════════════════════════════════════════════════════

describe('toErrorString', () => {
  it('returns null for null', () => {
    expect(toErrorString(null)).toBeNull();
  });

  it('returns null for undefined', () => {
    expect(toErrorString(undefined)).toBeNull();
  });

  it('returns null for empty string (falsy)', () => {
    expect(toErrorString('')).toBeNull();
  });

  it('returns null for 0 (falsy)', () => {
    expect(toErrorString(0)).toBeNull();
  });

  it('returns null for false (falsy)', () => {
    expect(toErrorString(false)).toBeNull();
  });

  it('returns string for a truthy string', () => {
    expect(toErrorString('Network error')).toBe('Network error');
  });

  it('returns message for Error instance', () => {
    expect(toErrorString(new Error('Failed'))).toBe('Failed');
  });

  it('returns message for API error object', () => {
    expect(toErrorString({ message: 'Bad request' })).toBe('Bad request');
  });

  it('delegates to getDisplayError for complex objects', () => {
    expect(toErrorString({ code: 'ERR_500' })).toBe('Error: ERR_500');
  });
});

// ═══════════════════════════════════════════════════════════════════
// createErrorHandler
// ═══════════════════════════════════════════════════════════════════

describe('createErrorHandler', () => {
  it('returns a function', () => {
    const handler = createErrorHandler(vi.fn());
    expect(typeof handler).toBe('function');
  });

  it('calls setError with extracted string message', () => {
    const setError = vi.fn();
    const handler = createErrorHandler(setError);
    handler(new Error('Oops'));
    expect(setError).toHaveBeenCalledWith('Oops');
  });

  it('calls setError with string error directly', () => {
    const setError = vi.fn();
    const handler = createErrorHandler(setError);
    handler('Direct error');
    expect(setError).toHaveBeenCalledWith('Direct error');
  });

  it('calls setError with API error message', () => {
    const setError = vi.fn();
    const handler = createErrorHandler(setError);
    handler({ message: 'Forbidden' });
    expect(setError).toHaveBeenCalledWith('Forbidden');
  });

  it('uses default fallback for unknown error types', () => {
    const setError = vi.fn();
    const handler = createErrorHandler(setError);
    handler(null);
    expect(setError).toHaveBeenCalledWith('An error occurred');
  });

  it('uses custom fallback', () => {
    const setError = vi.fn();
    const handler = createErrorHandler(setError, 'Upload failed');
    handler(undefined);
    expect(setError).toHaveBeenCalledWith('Upload failed');
  });

  it('handles multiple calls', () => {
    const setError = vi.fn();
    const handler = createErrorHandler(setError);
    handler('Error 1');
    handler('Error 2');
    expect(setError).toHaveBeenCalledTimes(2);
    expect(setError).toHaveBeenNthCalledWith(1, 'Error 1');
    expect(setError).toHaveBeenNthCalledWith(2, 'Error 2');
  });

  it('extracts code when only code present in object', () => {
    const setError = vi.fn();
    const handler = createErrorHandler(setError);
    handler({ code: 'AUTH_EXPIRED' });
    expect(setError).toHaveBeenCalledWith('Error: AUTH_EXPIRED');
  });
});
