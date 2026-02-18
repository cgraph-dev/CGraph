/**
 * XSS Prevention, CSRF Protection, and Secure Storage Tests
 *
 * Tests for HTML escaping, URL sanitization, trusted domain checks,
 * CSRF token management, and encrypted storage utilities.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  escapeHtml,
  sanitizeInput,
  sanitizeUrl,
  isTrustedDomain,
  safeRedirect,
  getCsrfToken,
  addCsrfHeader,
  secureFetch,
  secureStore,
  secureRetrieve,
  secureRemove,
  secureClear,
} from '../xss-csrf';

// ── Helpers ──────────────────────────────────────────────────────────────

beforeEach(() => {
  localStorage.clear();
  document.cookie = '';
});

// ============================================================================
// XSS Prevention
// ============================================================================

describe('escapeHtml', () => {
  it('should escape ampersands', () => {
    expect(escapeHtml('foo & bar')).toBe('foo &amp; bar');
  });

  it('should escape angle brackets', () => {
    expect(escapeHtml('<script>alert("xss")</script>')).toBe(
      '&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;'
    );
  });

  it('should escape all special characters', () => {
    expect(escapeHtml('`=\'"<>&/')).toBe('&#x60;&#x3D;&#x27;&quot;&lt;&gt;&amp;&#x2F;');
  });

  it('should return empty string unchanged', () => {
    expect(escapeHtml('')).toBe('');
  });

  it('should not escape safe characters', () => {
    expect(escapeHtml('Hello World 123')).toBe('Hello World 123');
  });
});

describe('sanitizeInput', () => {
  it('should trim whitespace and escape HTML', () => {
    expect(sanitizeInput('  <b>bold</b>  ')).toBe('&lt;b&gt;bold&lt;&#x2F;b&gt;');
  });

  it('should handle empty input', () => {
    expect(sanitizeInput('   ')).toBe('');
  });
});

describe('sanitizeUrl', () => {
  it('should allow http URLs', () => {
    expect(sanitizeUrl('http://example.com')).toBe('http://example.com');
  });

  it('should allow https URLs', () => {
    expect(sanitizeUrl('https://example.com/path')).toBe('https://example.com/path');
  });

  it('should allow relative paths', () => {
    expect(sanitizeUrl('/dashboard')).toBe('/dashboard');
  });

  it('should allow mailto links', () => {
    expect(sanitizeUrl('mailto:user@example.com')).toBe('mailto:user@example.com');
  });

  it('should allow tel links', () => {
    expect(sanitizeUrl('tel:+1234567890')).toBe('tel:+1234567890');
  });

  it('should block javascript: protocol', () => {
    expect(sanitizeUrl('javascript:alert(1)')).toBe('#');
  });

  it('should block javascript: with mixed case', () => {
    expect(sanitizeUrl('JavaScript:alert(1)')).toBe('#');
  });

  it('should block data: protocol', () => {
    expect(sanitizeUrl('data:text/html,<script>alert(1)</script>')).toBe('#');
  });

  it('should block vbscript: protocol', () => {
    expect(sanitizeUrl('vbscript:MsgBox("XSS")')).toBe('#');
  });

  it('should block unknown protocols', () => {
    expect(sanitizeUrl('ftp://evil.com/exploit')).toBe('#');
  });

  it('should handle URLs with leading whitespace', () => {
    expect(sanitizeUrl('  javascript:alert(1)  ')).toBe('#');
  });

  it('should allow plain text without colons', () => {
    expect(sanitizeUrl('just-some-text')).toBe('just-some-text');
  });
});

describe('isTrustedDomain', () => {
  const trusted = ['example.com', 'cgraph.org'];

  it('should accept exact domain match', () => {
    expect(isTrustedDomain('https://example.com/path', trusted)).toBe(true);
  });

  it('should accept subdomain match', () => {
    expect(isTrustedDomain('https://sub.example.com/path', trusted)).toBe(true);
  });

  it('should reject untrusted domain', () => {
    expect(isTrustedDomain('https://evil.com/path', trusted)).toBe(false);
  });

  it('should reject domain suffix attack (notexample.com)', () => {
    expect(isTrustedDomain('https://notexample.com', trusted)).toBe(false);
  });

  it('should return false for invalid URLs', () => {
    expect(isTrustedDomain('not-a-url', trusted)).toBe(false);
  });

  it('should return false for empty trusted list', () => {
    expect(isTrustedDomain('https://example.com', [])).toBe(false);
  });
});

describe('safeRedirect', () => {
  const originalHref = window.location.href;

  afterEach(() => {
    // Reset location
    Object.defineProperty(window, 'location', {
      value: { href: originalHref },
      writable: true,
    });
  });

  it('should throw for untrusted domain', () => {
    expect(() => safeRedirect('https://evil.com/phishing')).toThrow(
      /Redirect blocked.*untrusted domain/
    );
  });

  it('should allow trusted Stripe redirect', () => {
    Object.defineProperty(window, 'location', {
      value: { href: '' },
      writable: true,
    });
    safeRedirect('https://checkout.stripe.com/session/123');
    expect(window.location.href).toBe('https://checkout.stripe.com/session/123');
  });

  it('should allow trusted cgraph domain', () => {
    Object.defineProperty(window, 'location', {
      value: { href: '' },
      writable: true,
    });
    safeRedirect('https://cgraph.org/callback');
    expect(window.location.href).toBe('https://cgraph.org/callback');
  });
});

// ============================================================================
// CSRF Protection
// ============================================================================

describe('getCsrfToken', () => {
  afterEach(() => {
    document.querySelectorAll('meta[name="csrf-token"]').forEach((el) => el.remove());
  });

  it('should return token from meta tag', () => {
    const meta = document.createElement('meta');
    meta.setAttribute('name', 'csrf-token');
    meta.setAttribute('content', 'test-token-123');
    document.head.appendChild(meta);

    expect(getCsrfToken()).toBe('test-token-123');
  });

  it('should return token from cookie', () => {
    Object.defineProperty(document, 'cookie', {
      value: 'cgraph_csrf_token=cookie-token-456',
      writable: true,
      configurable: true,
    });

    expect(getCsrfToken()).toBe('cookie-token-456');

    // Cleanup
    Object.defineProperty(document, 'cookie', {
      value: '',
      writable: true,
      configurable: true,
    });
  });

  it('should return null when no token exists', () => {
    expect(getCsrfToken()).toBeNull();
  });
});

describe('addCsrfHeader', () => {
  afterEach(() => {
    document.querySelectorAll('meta[name="csrf-token"]').forEach((el) => el.remove());
  });

  it('should add CSRF token to Headers object', () => {
    const meta = document.createElement('meta');
    meta.setAttribute('name', 'csrf-token');
    meta.setAttribute('content', 'token-for-headers');
    document.head.appendChild(meta);

    const headers = new Headers();
    addCsrfHeader(headers);
    expect(headers.get('X-CSRF-Token')).toBe('token-for-headers');
  });

  it('should add CSRF token to plain object', () => {
    const meta = document.createElement('meta');
    meta.setAttribute('name', 'csrf-token');
    meta.setAttribute('content', 'token-for-obj');
    document.head.appendChild(meta);

    const headers: Record<string, string> = {};
    addCsrfHeader(headers);
    expect(headers['X-CSRF-Token']).toBe('token-for-obj');
  });

  it('should do nothing when no token exists', () => {
    const headers = new Headers();
    addCsrfHeader(headers);
    expect(headers.has('X-CSRF-Token')).toBe(false);
  });
});

describe('secureFetch', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
    document.querySelectorAll('meta[name="csrf-token"]').forEach((el) => el.remove());
  });

  it('should not add CSRF token for GET requests', async () => {
    const mockFetch = vi.fn().mockResolvedValue(new Response());
    globalThis.fetch = mockFetch;

    await secureFetch('/api/data', { method: 'GET' });

    const passedHeaders = mockFetch.mock.calls[0][1].headers as Headers;
    expect(passedHeaders.has('X-CSRF-Token')).toBe(false);
  });

  it('should add CSRF token for POST requests', async () => {
    const meta = document.createElement('meta');
    meta.setAttribute('name', 'csrf-token');
    meta.setAttribute('content', 'csrf-post-token');
    document.head.appendChild(meta);

    const mockFetch = vi.fn().mockResolvedValue(new Response());
    globalThis.fetch = mockFetch;

    await secureFetch('/api/data', { method: 'POST' });

    const passedHeaders = mockFetch.mock.calls[0][1].headers as Headers;
    expect(passedHeaders.get('X-CSRF-Token')).toBe('csrf-post-token');
  });

  it('should set credentials to same-origin', async () => {
    const mockFetch = vi.fn().mockResolvedValue(new Response());
    globalThis.fetch = mockFetch;

    await secureFetch('/api/data');

    expect(mockFetch.mock.calls[0][1].credentials).toBe('same-origin');
  });
});

// ============================================================================
// Secure Storage
// ============================================================================

describe('secureStore / secureRetrieve', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should store and retrieve a value', () => {
    secureStore('test_key', { data: 'hello' });
    expect(secureRetrieve('test_key')).toEqual({ data: 'hello' });
  });

  it('should store with cgraph_ prefix', () => {
    secureStore('mykey', 42);
    expect(localStorage.getItem('cgraph_mykey')).toBeTruthy();
  });

  it('should return null for non-existent keys', () => {
    expect(secureRetrieve('nonexistent')).toBeNull();
  });

  it('should expire items after TTL', () => {
    vi.useFakeTimers();
    secureStore('expiring', 'value', { expires: 1000 });

    expect(secureRetrieve('expiring')).toBe('value');

    vi.advanceTimersByTime(1001);
    expect(secureRetrieve('expiring')).toBeNull();

    vi.useRealTimers();
  });

  it('should handle corrupted storage gracefully', () => {
    localStorage.setItem('cgraph_corrupt', 'not-valid-json{{{');
    expect(secureRetrieve('corrupt')).toBeNull();
  });
});

describe('secureRemove', () => {
  it('should remove a stored item', () => {
    secureStore('to_remove', 'data');
    expect(secureRetrieve('to_remove')).toBe('data');

    secureRemove('to_remove');
    expect(secureRetrieve('to_remove')).toBeNull();
  });
});

describe('secureClear', () => {
  it('should remove all cgraph_ prefixed items', () => {
    secureStore('a', 1);
    secureStore('b', 2);
    localStorage.setItem('other_key', 'should_remain');

    secureClear();

    expect(secureRetrieve('a')).toBeNull();
    expect(secureRetrieve('b')).toBeNull();
    expect(localStorage.getItem('other_key')).toBe('should_remain');
  });
});
