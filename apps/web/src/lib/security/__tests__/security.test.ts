/**
 * Security Library Tests
 *
 * Tests for XSS sanitization, CSS sanitization, URL validation,
 * input validation, password strength, and rate limiting.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  escapeHtml,
  sanitizeInput,
  sanitizeUrl,
  isTrustedDomain,
  secureStore,
  secureRetrieve,
  secureRemove,
  secureClear,
  checkPasswordStrength,
  isRateLimited,
  getRemainingAttempts,
  generateNonce,
  sanitizeCss,
  isSafeCss,
} from '../index';

// ---------------------------------------------------------------------------
// XSS Prevention
// ---------------------------------------------------------------------------

describe('escapeHtml', () => {
  it('escapes all HTML special characters', () => {
    expect(escapeHtml('&<>"\'`=/')).toBe('&amp;&lt;&gt;&quot;&#x27;&#x60;&#x3D;&#x2F;');
  });

  it('returns plain text unchanged', () => {
    expect(escapeHtml('hello world')).toBe('hello world');
  });

  it('escapes a script tag', () => {
    const result = escapeHtml('<script>alert("xss")</script>');
    expect(result).not.toContain('<script>');
    expect(result).toContain('&lt;script&gt;');
  });

  it('escapes event handler attributes', () => {
    const result = escapeHtml('<img onerror="alert(1)">');
    expect(result).not.toContain('<img');
    expect(result).toContain('&lt;img');
  });
});

describe('sanitizeInput', () => {
  it('trims whitespace and escapes HTML', () => {
    expect(sanitizeInput('  <b>bold</b>  ')).toBe('&lt;b&gt;bold&lt;&#x2F;b&gt;');
  });

  it('handles empty string after trim', () => {
    expect(sanitizeInput('   ')).toBe('');
  });
});

// ---------------------------------------------------------------------------
// URL Sanitization
// ---------------------------------------------------------------------------

describe('sanitizeUrl', () => {
  it('allows http URLs', () => {
    expect(sanitizeUrl('http://example.com')).toBe('http://example.com');
  });

  it('allows https URLs', () => {
    expect(sanitizeUrl('https://example.com')).toBe('https://example.com');
  });

  it('allows mailto: URLs', () => {
    expect(sanitizeUrl('mailto:user@example.com')).toBe('mailto:user@example.com');
  });

  it('allows relative paths', () => {
    expect(sanitizeUrl('/path/to/page')).toBe('/path/to/page');
  });

  it('blocks javascript: protocol', () => {
    expect(sanitizeUrl('javascript:alert(1)')).toBe('#');
  });

  it('blocks javascript: with whitespace padding', () => {
    expect(sanitizeUrl('  javascript:alert(1)  ')).toBe('#');
  });

  it('blocks data: protocol', () => {
    expect(sanitizeUrl('data:text/html,<script>alert(1)</script>')).toBe('#');
  });

  it('blocks vbscript: protocol', () => {
    expect(sanitizeUrl('vbscript:MsgBox("xss")')).toBe('#');
  });

  it('blocks unknown protocols', () => {
    expect(sanitizeUrl('custom:something')).toBe('#');
  });

  it('allows URLs without any protocol', () => {
    expect(sanitizeUrl('example.com/path')).toBe('example.com/path');
  });
});

// ---------------------------------------------------------------------------
// Trusted Domain Check
// ---------------------------------------------------------------------------

describe('isTrustedDomain', () => {
  const trusted = ['example.com', 'cgraph.org'];

  it('returns true for exact domain match', () => {
    expect(isTrustedDomain('https://example.com/path', trusted)).toBe(true);
  });

  it('returns true for subdomain match', () => {
    expect(isTrustedDomain('https://api.cgraph.org/v1', trusted)).toBe(true);
  });

  it('returns false for untrusted domain', () => {
    expect(isTrustedDomain('https://evil.com', trusted)).toBe(false);
  });

  it('returns false for invalid URL', () => {
    expect(isTrustedDomain('not-a-url', trusted)).toBe(false);
  });

  it('returns false when domain is substring but not subdomain', () => {
    expect(isTrustedDomain('https://notexample.com', trusted)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// CSS Sanitization
// ---------------------------------------------------------------------------

describe('sanitizeCss', () => {
  it('returns empty string for falsy input', () => {
    expect(sanitizeCss('')).toBe('');
    expect(sanitizeCss(null as unknown as string)).toBe('');
    expect(sanitizeCss(undefined as unknown as string)).toBe('');
  });

  it('keeps safe CSS unchanged', () => {
    const css = 'color: red; font-size: 16px;';
    expect(sanitizeCss(css)).toBe(css);
  });

  it('blocks expression() in CSS', () => {
    const css = 'width: expression(document.body.clientWidth)';
    expect(sanitizeCss(css)).toContain('/* blocked */');
  });

  it('blocks javascript: in CSS', () => {
    const css = 'background: url(javascript:alert(1))';
    expect(sanitizeCss(css)).toContain('/* blocked */');
  });

  it('blocks @import directives', () => {
    const css = '@import url("https://evil.com/spy.css");';
    expect(sanitizeCss(css)).toContain('/* blocked */');
  });

  it('blocks embedded script tags', () => {
    const css = '</style><script>alert(1)</script><style>';
    const result = sanitizeCss(css);
    expect(result).not.toContain('<script>');
  });

  it('removes control characters', () => {
    const css = 'color: red;\x00\x01\x07';
    const result = sanitizeCss(css);
    // eslint-disable-next-line no-control-regex
    expect(result).not.toMatch(/[\x00-\x08]/);
  });
});

describe('isSafeCss', () => {
  it('returns true for empty string', () => {
    expect(isSafeCss('')).toBe(true);
  });

  it('returns true for safe CSS', () => {
    expect(isSafeCss('color: blue;')).toBe(true);
  });

  it('returns false for CSS with expression()', () => {
    expect(isSafeCss('width: expression(1+1)')).toBe(false);
  });

  it('returns false for CSS with javascript:', () => {
    expect(isSafeCss('background: url(javascript:void(0))')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Password Strength
// ---------------------------------------------------------------------------

describe('checkPasswordStrength', () => {
  it('rates short passwords as weak', () => {
    const result = checkPasswordStrength('abc');
    expect(result.score).toBeLessThanOrEqual(1);
    expect(result.suggestions).toContain('Use at least 8 characters');
  });

  it('rates common patterns as weak', () => {
    const result = checkPasswordStrength('password');
    expect(result.suggestions).toContain('Avoid common patterns');
  });

  it('rates mixed-case long passwords with numbers and symbols as strong', () => {
    const result = checkPasswordStrength('MyP@ssw0rd!123');
    expect(result.score).toBeGreaterThanOrEqual(3);
    expect(result.label).toMatch(/strong|excellent/);
  });

  it('penalizes repeated characters', () => {
    const result = checkPasswordStrength('aaabbbccc1A!');
    expect(result.suggestions).toContain('Avoid repeated characters');
  });

  it('suggests uppercase and lowercase when missing', () => {
    const result = checkPasswordStrength('alllowercase');
    expect(result.suggestions).toContain('Use both uppercase and lowercase letters');
  });

  it('score is always clamped between 0 and 4', () => {
    const weak = checkPasswordStrength('123');
    expect(weak.score).toBeGreaterThanOrEqual(0);
    expect(weak.score).toBeLessThanOrEqual(4);
  });
});

// ---------------------------------------------------------------------------
// Rate Limiting
// ---------------------------------------------------------------------------

describe('isRateLimited', () => {
  it('allows first request within window', () => {
    const key = `test-rate-${Date.now()}`;
    expect(isRateLimited(key, 3, 60_000)).toBe(false);
  });

  it('limits after exceeding threshold', () => {
    const key = `test-exceed-${Date.now()}`;
    isRateLimited(key, 2, 60_000); // count = 1
    isRateLimited(key, 2, 60_000); // count = 2
    expect(isRateLimited(key, 2, 60_000)).toBe(true); // exceeded
  });
});

describe('getRemainingAttempts', () => {
  it('returns full limit for unknown key', () => {
    const key = `remaining-unknown-${Date.now()}`;
    expect(getRemainingAttempts(key, 5)).toBe(5);
  });

  it('returns decremented count after usage', () => {
    const key = `remaining-used-${Date.now()}`;
    isRateLimited(key, 5, 60_000); // use 1
    expect(getRemainingAttempts(key, 5)).toBe(4);
  });
});

// ---------------------------------------------------------------------------
// Secure Storage
// ---------------------------------------------------------------------------

describe('secureStore / secureRetrieve', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('stores and retrieves a value', () => {
    secureStore('test-key', { foo: 'bar' });
    expect(secureRetrieve('test-key')).toEqual({ foo: 'bar' });
  });

  it('returns null for missing key', () => {
    expect(secureRetrieve('nonexistent')).toBeNull();
  });

  it('returns null for expired items', () => {
    // Store with an already-expired TTL by manually setting timestamp
    const prefixedKey = 'cgraph_expired-key';
    localStorage.setItem(prefixedKey, JSON.stringify({ value: 'old', timestamp: 0, expires: 1 }));
    expect(secureRetrieve('expired-key')).toBeNull();
  });

  it('removes item via secureRemove', () => {
    secureStore('remove-me', 'data');
    secureRemove('remove-me');
    expect(secureRetrieve('remove-me')).toBeNull();
  });

  it('clears all cgraph_ items via secureClear', () => {
    secureStore('a', 1);
    secureStore('b', 2);
    localStorage.setItem('other_key', 'keep');
    secureClear();
    expect(secureRetrieve('a')).toBeNull();
    expect(secureRetrieve('b')).toBeNull();
    expect(localStorage.getItem('other_key')).toBe('keep');
  });
});

// ---------------------------------------------------------------------------
// Nonce Generation
// ---------------------------------------------------------------------------

describe('generateNonce', () => {
  it('returns a non-empty base64 string', () => {
    const nonce = generateNonce();
    expect(nonce.length).toBeGreaterThan(0);
    // Valid base64 characters
    expect(nonce).toMatch(/^[A-Za-z0-9+/=]+$/);
  });

  it('generates unique nonces', () => {
    const a = generateNonce();
    const b = generateNonce();
    expect(a).not.toBe(b);
  });
});
