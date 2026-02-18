/**
 * PII Stripping & Sanitization Tests
 *
 * Verifies that personally identifiable information is properly
 * redacted from error payloads before transmission.
 *
 * Categories tested:
 * - Email addresses
 * - Phone numbers
 * - IP addresses
 * - JWT tokens
 * - Sensitive key names (password, token, apikey, etc.)
 * - Recursive object traversal
 * - Depth limiting
 */

import { describe, it, expect } from 'vitest';
import { stripPiiFromString, stripPii } from '../pii';

describe('stripPiiFromString', () => {
  it('should redact email addresses', () => {
    expect(stripPiiFromString('Contact user@example.com for help')).toBe(
      'Contact [EMAIL] for help'
    );
  });

  it('should redact multiple emails', () => {
    expect(stripPiiFromString('From a@b.com to c@d.org')).toBe('From [EMAIL] to [EMAIL]');
  });

  it('should redact phone numbers', () => {
    expect(stripPiiFromString('Call +1-555-123-4567')).toBe('Call [PHONE]');
  });

  it('should redact phone with parentheses', () => {
    expect(stripPiiFromString('Phone: (555) 123-4567')).toBe('Phone: [PHONE]');
  });

  it('should redact IP addresses', () => {
    expect(stripPiiFromString('Client IP: 192.168.1.1')).toBe('Client IP: [IP]');
  });

  it('should redact JWT tokens', () => {
    const jwt = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.abc123_def-456';
    expect(stripPiiFromString(`Bearer ${jwt}`)).toBe('Bearer [JWT]');
  });

  it('should leave clean strings unchanged', () => {
    expect(stripPiiFromString('No PII here just text')).toBe('No PII here just text');
  });

  it('should handle empty string', () => {
    expect(stripPiiFromString('')).toBe('');
  });

  it('should redact multiple PII types in one string', () => {
    const input = 'User user@test.com from 10.0.0.1 called (555) 123-4567';
    const result = stripPiiFromString(input);
    expect(result).toContain('[EMAIL]');
    expect(result).toContain('[IP]');
    expect(result).toContain('[PHONE]');
    expect(result).not.toContain('user@test.com');
    expect(result).not.toContain('10.0.0.1');
  });
});

describe('stripPii', () => {
  it('should return null/undefined unchanged', () => {
    expect(stripPii(null)).toBeNull();
    expect(stripPii(undefined)).toBeUndefined();
  });

  it('should return numbers unchanged', () => {
    expect(stripPii(42)).toBe(42);
  });

  it('should return booleans unchanged', () => {
    expect(stripPii(true)).toBe(true);
  });

  it('should strip PII from string values', () => {
    expect(stripPii('user@test.com')).toBe('[EMAIL]');
  });

  it('should redact sensitive keys', () => {
    const input = { password: 'secret123', username: 'john' };
    const result = stripPii(input) as Record<string, unknown>;
    expect(result.password).toBe('[REDACTED]');
    expect(result.username).toBe('john');
  });

  it('should redact token keys', () => {
    const input = { access_token: 'abc123', data: 'safe' };
    const result = stripPii(input) as Record<string, unknown>;
    expect(result.access_token).toBe('[REDACTED]');
    expect(result.data).toBe('safe');
  });

  it('should redact api_key and apikey', () => {
    const input = { api_key: 'key1', apikey: 'key2', name: 'test' };
    const result = stripPii(input) as Record<string, unknown>;
    expect(result.api_key).toBe('[REDACTED]');
    expect(result.apikey).toBe('[REDACTED]');
    expect(result.name).toBe('test');
  });

  it('should redact authorization headers', () => {
    const input = { authorization: 'Bearer xyz', url: '/api/test' };
    const result = stripPii(input) as Record<string, unknown>;
    expect(result.authorization).toBe('[REDACTED]');
  });

  it('should redact cookie and session', () => {
    const input = { cookie: 'sid=abc', session: 'data', label: 'ok' };
    const result = stripPii(input) as Record<string, unknown>;
    expect(result.cookie).toBe('[REDACTED]');
    expect(result.session).toBe('[REDACTED]');
    expect(result.label).toBe('ok');
  });

  it('should redact credit_card, ssn, private_key', () => {
    const input = {
      credit_card: '4111-1111-1111-1111',
      ssn: '123-45-6789',
      private_key: 'MIIEvg...',
    };
    const result = stripPii(input) as Record<string, unknown>;
    expect(result.credit_card).toBe('[REDACTED]');
    expect(result.ssn).toBe('[REDACTED]');
    expect(result.private_key).toBe('[REDACTED]');
  });

  it('should strip PII from nested objects recursively', () => {
    const input = {
      user: {
        email: 'user@test.com',
        password: 'secret',
        profile: { bio: 'Contact me at alice@example.com' },
      },
    };
    const result = stripPii(input) as Record<string, unknown>;
    const user = result.user as Record<string, unknown>;
    expect(user.email).toBe('[EMAIL]');
    expect(user.password).toBe('[REDACTED]');
    const profile = user.profile as Record<string, unknown>;
    expect(profile.bio).toBe('Contact me at [EMAIL]');
  });

  it('should strip PII from arrays', () => {
    const input = ['user@test.com', 'safe text', '192.168.0.1'];
    const result = stripPii(input) as string[];
    expect(result[0]).toBe('[EMAIL]');
    expect(result[1]).toBe('safe text');
    expect(result[2]).toBe('[IP]');
  });

  it('should stop at max depth (10) and return [MAX_DEPTH]', () => {
    // Build a deeply nested object (> 10 levels)
    let obj: Record<string, unknown> = { value: 'deep@email.com' };
    for (let i = 0; i < 12; i++) {
      obj = { nested: obj };
    }
    const result = stripPii(obj) as Record<string, unknown>;

    // Walk down to depth 10
    let current: unknown = result;
    for (let i = 0; i < 11; i++) {
      current = (current as Record<string, unknown>).nested;
    }
    expect(current).toBe('[MAX_DEPTH]');
  });

  it('should handle case-insensitive key matching', () => {
    const input = { Password: 'secret', API_KEY: 'key123' };
    const result = stripPii(input) as Record<string, unknown>;
    expect(result.Password).toBe('[REDACTED]');
    expect(result.API_KEY).toBe('[REDACTED]');
  });
});
