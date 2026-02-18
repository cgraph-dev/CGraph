/**
 * Password Validation, Rate Limiting, CSP, and Session Security Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  checkPasswordStrength,
  isRateLimited,
  getRemainingAttempts,
  generateNonce,
  hasContentSecurityPolicy,
  getSessionFingerprint,
  validateSessionFingerprint,
  checkSecurityHeaders,
} from '../validation';

// ============================================================================
// Password Strength
// ============================================================================

describe('checkPasswordStrength', () => {
  it('should rate a weak password (short, no variety)', () => {
    const result = checkPasswordStrength('abc');
    expect(result.score).toBe(0);
    expect(result.label).toBe('weak');
    expect(result.suggestions.length).toBeGreaterThan(0);
  });

  it('should suggest minimum length for short passwords', () => {
    const result = checkPasswordStrength('short');
    expect(result.suggestions).toContain('Use at least 8 characters');
  });

  it('should reward length >= 8', () => {
    // Avoid 'abc'/'qwerty'/'password' prefix (common pattern penalty)
    const short = checkPasswordStrength('xyzqrst'); // 7 chars
    const long = checkPasswordStrength('xyzqrstv'); // 8 chars
    expect(long.score).toBeGreaterThan(short.score);
  });

  it('should reward mixed case', () => {
    const lower = checkPasswordStrength('abcdefgh');
    const mixed = checkPasswordStrength('abcDEFgh');
    expect(mixed.score).toBeGreaterThan(lower.score);
  });

  it('should reward digits', () => {
    const noDigit = checkPasswordStrength('abcDEFgh');
    const withDigit = checkPasswordStrength('abcDEF1h');
    expect(withDigit.score).toBeGreaterThan(noDigit.score);
  });

  it('should reward special characters', () => {
    const noSpecial = checkPasswordStrength('abcDEF1h');
    const withSpecial = checkPasswordStrength('abcDEF1!');
    expect(withSpecial.score).toBeGreaterThan(noSpecial.score);
  });

  it('should penalize repeated characters', () => {
    const noRepeat = checkPasswordStrength('abcDEF1!');
    const withRepeat = checkPasswordStrength('aaabcDEF1!');
    expect(withRepeat.score).toBeLessThanOrEqual(noRepeat.score);
  });

  it('should penalize common patterns', () => {
    const result = checkPasswordStrength('password123');
    expect(result.suggestions).toContain('Avoid common patterns');
  });

  it('should rate an excellent password', () => {
    const result = checkPasswordStrength('MyStr0ng!Pass#2024');
    expect(result.score).toBe(4);
    expect(result.label).toBe('excellent');
  });

  it('should clamp score between 0 and 4', () => {
    // Even with penalties, score should not go below 0
    const result = checkPasswordStrength('aaa');
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(4);
  });
});

// ============================================================================
// Rate Limiting (Client-side)
// ============================================================================

describe('isRateLimited', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should not rate limit first action', () => {
    expect(isRateLimited('test_action_1', 3, 60000)).toBe(false);
  });

  it('should allow actions up to the limit', () => {
    const key = 'test_action_2';
    expect(isRateLimited(key, 3, 60000)).toBe(false); // 1st
    expect(isRateLimited(key, 3, 60000)).toBe(false); // 2nd
    expect(isRateLimited(key, 3, 60000)).toBe(false); // 3rd (at limit)
  });

  it('should rate limit after exceeding limit', () => {
    const key = 'test_action_3';
    isRateLimited(key, 2, 60000); // 1st
    isRateLimited(key, 2, 60000); // 2nd (at limit)
    expect(isRateLimited(key, 2, 60000)).toBe(true); // 3rd (blocked)
  });

  it('should reset after window expires', () => {
    const key = 'test_action_4';
    isRateLimited(key, 1, 1000); // 1st (at limit)
    expect(isRateLimited(key, 1, 1000)).toBe(true); // blocked

    vi.advanceTimersByTime(1001);
    expect(isRateLimited(key, 1, 1000)).toBe(false); // reset
  });
});

describe('getRemainingAttempts', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return full limit for unknown key', () => {
    expect(getRemainingAttempts('unknown_key', 5)).toBe(5);
  });

  it('should decrement after actions', () => {
    const key = 'remaining_test';
    isRateLimited(key, 5, 60000); // 1 used
    expect(getRemainingAttempts(key, 5)).toBe(4);
  });

  it('should reset after window expires', () => {
    const key = 'remaining_expire';
    isRateLimited(key, 3, 1000);
    isRateLimited(key, 3, 1000);

    vi.advanceTimersByTime(1001);
    expect(getRemainingAttempts(key, 3)).toBe(3);
  });
});

// ============================================================================
// CSP
// ============================================================================

describe('generateNonce', () => {
  it('should return a base64 string', () => {
    const nonce = generateNonce();
    expect(typeof nonce).toBe('string');
    expect(nonce.length).toBeGreaterThan(0);
  });

  it('should generate unique nonces', () => {
    const a = generateNonce();
    const b = generateNonce();
    expect(a).not.toBe(b);
  });
});

describe('hasContentSecurityPolicy', () => {
  afterEach(() => {
    document
      .querySelectorAll('meta[http-equiv="Content-Security-Policy"]')
      .forEach((el) => el.remove());
  });

  it('should return false when no CSP meta tag', () => {
    expect(hasContentSecurityPolicy()).toBe(false);
  });

  it('should return true when CSP meta tag exists', () => {
    const meta = document.createElement('meta');
    meta.setAttribute('http-equiv', 'Content-Security-Policy');
    meta.setAttribute('content', "default-src 'self'");
    document.head.appendChild(meta);

    expect(hasContentSecurityPolicy()).toBe(true);
  });
});

// ============================================================================
// Session Security
// ============================================================================

describe('getSessionFingerprint / validateSessionFingerprint', () => {
  it('should return a non-empty string', () => {
    const fp = getSessionFingerprint();
    expect(typeof fp).toBe('string');
    expect(fp.length).toBeGreaterThan(0);
  });

  it('should be deterministic (same environment = same fingerprint)', () => {
    const fp1 = getSessionFingerprint();
    const fp2 = getSessionFingerprint();
    expect(fp1).toBe(fp2);
  });

  it('should validate matching fingerprint', () => {
    const fp = getSessionFingerprint();
    expect(validateSessionFingerprint(fp)).toBe(true);
  });

  it('should reject mismatched fingerprint', () => {
    expect(validateSessionFingerprint('wrong-fingerprint')).toBe(false);
  });
});

// ============================================================================
// Security Headers Check
// ============================================================================

describe('checkSecurityHeaders', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('should report all headers present', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      headers: new Headers({
        'Strict-Transport-Security': 'max-age=31536000',
        'Content-Security-Policy': "default-src 'self'",
        'X-Frame-Options': 'DENY',
        'X-Content-Type-Options': 'nosniff',
      }),
    });

    const result = await checkSecurityHeaders('https://example.com');
    expect(result.hasHSTS).toBe(true);
    expect(result.hasCSP).toBe(true);
    expect(result.hasXFrameOptions).toBe(true);
    expect(result.hasXContentTypeOptions).toBe(true);
    expect(result.recommendations).toHaveLength(0);
  });

  it('should recommend missing headers', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      headers: new Headers({}),
    });

    const result = await checkSecurityHeaders('https://example.com');
    expect(result.hasHSTS).toBe(false);
    expect(result.hasXFrameOptions).toBe(false);
    expect(result.recommendations.length).toBeGreaterThan(0);
  });

  it('should handle fetch errors gracefully', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network'));

    const result = await checkSecurityHeaders('https://example.com');
    expect(result.hasHSTS).toBe(false);
    expect(result.recommendations).toContain('Unable to check headers');
  });
});
