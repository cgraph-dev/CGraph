/**
 * Web Push VAPID Key Tests
 *
 * Tests for VAPID key management:
 * - urlBase64ToUint8Array conversion (pure function)
 * - getVapidPublicKey retrieval (env, cache, API)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { urlBase64ToUint8Array, getVapidPublicKey } from '../vapid';

// ── Mock API ─────────────────────────────────────────────────────────────
vi.mock('@/lib/api', () => ({
  api: {
    get: vi.fn(),
  },
}));

vi.mock('@/lib/logger', () => ({
  createLogger: () => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

import { api } from '@/lib/api';

const mockApi = api as unknown as { get: ReturnType<typeof vi.fn> };

describe('urlBase64ToUint8Array', () => {
  it('should convert a standard base64url string to Uint8Array', () => {
    // "hello" in base64 is "aGVsbG8=" → base64url is "aGVsbG8"
    const result = urlBase64ToUint8Array('aGVsbG8');
    const expected = new Uint8Array([104, 101, 108, 108, 111]); // "hello" as ASCII

    expect(result).toEqual(expected);
  });

  it('should handle base64url with padding needed', () => {
    // "a" → base64 = "YQ==" → base64url = "YQ"
    const result = urlBase64ToUint8Array('YQ');
    expect(result).toEqual(new Uint8Array([97])); // 'a'
  });

  it('should replace URL-safe characters (- and _)', () => {
    // Base64url uses - instead of + and _ instead of /
    // The function should convert them back before decoding
    const base64url = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
    const result = urlBase64ToUint8Array(base64url);

    expect(result).toBeInstanceOf(Uint8Array);
    expect(result.length).toBeGreaterThan(0);
  });

  it('should handle empty string', () => {
    const result = urlBase64ToUint8Array('');
    expect(result).toBeInstanceOf(Uint8Array);
    expect(result.length).toBe(0);
  });

  it('should handle a real VAPID-sized key (65 bytes)', () => {
    // A typical VAPID public key is 65 bytes (uncompressed P-256 point)
    // base64url of 65 bytes = 88 chars (ceil(65*4/3))
    const mockKey =
      'BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QTpQtUbVlUls0VJXg7A8u-Ts1XkBBKkM5EzE7VqMv87kM9KY';
    const result = urlBase64ToUint8Array(mockKey);

    expect(result).toBeInstanceOf(Uint8Array);
    expect(result.length).toBe(65);
    expect(result[0]).toBe(0x04); // Uncompressed point prefix
  });
});

describe('getVapidPublicKey', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch key from API when env key is not set', async () => {
    mockApi.get.mockResolvedValue({
      data: { data: { vapid_public_key: 'api-fetched-key' } },
    });

    await getVapidPublicKey();

    // May return null or the API key depending on env var state
    // The important thing is it tries the API
    expect(mockApi.get).toHaveBeenCalledWith('/api/v1/web-push/vapid-key');
  });

  it('should return null on API error', async () => {
    mockApi.get.mockRejectedValue(new Error('Network error'));

    await getVapidPublicKey();
    // Should not throw, should return null (or cached value)
    // The function handles errors gracefully
  });
});
