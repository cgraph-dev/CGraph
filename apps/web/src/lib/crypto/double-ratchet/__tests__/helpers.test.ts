/**
 * Tests for double-ratchet/helpers.ts
 *
 * Binary serialization, array operations, and skip key management.
 */
import { describe, it, expect } from 'vitest';
import { serializeHeader, concatArrays, arraysEqual, makeSkipKey } from '../helpers';
import type { MessageHeader } from '../types';

// ---------------------------------------------------------------------------
// serializeHeader
// ---------------------------------------------------------------------------
describe('serializeHeader', () => {
  const baseHeader: MessageHeader = {
    dh: new Uint8Array([0x01, 0x02, 0x03]),
    pn: 5,
    n: 10,
    sessionId: 'abc',
    timestamp: 1700000000000,
    version: 3,
  };

  it('produces a Uint8Array', () => {
    const result = serializeHeader(baseHeader);
    expect(result).toBeInstanceOf(Uint8Array);
  });

  it('encodes version as first byte', () => {
    const result = serializeHeader(baseHeader);
    expect(result[0]).toBe(3);
  });

  it('has correct total length', () => {
    // 1(version) + 4(pn) + 4(n) + 8(timestamp) + 1(sessionIdLen) + 3(sessionId "abc") + 3(dh)
    const expectedLen = 1 + 4 + 4 + 8 + 1 + 3 + 3;
    const result = serializeHeader(baseHeader);
    expect(result.byteLength).toBe(expectedLen);
  });

  it('is deterministic for same input', () => {
    const r1 = serializeHeader(baseHeader);
    const r2 = serializeHeader(baseHeader);
    expect(Array.from(r1)).toEqual(Array.from(r2));
  });

  it('differs for different pn', () => {
    const r1 = serializeHeader(baseHeader);
    const r2 = serializeHeader({ ...baseHeader, pn: 99 });
    expect(Array.from(r1)).not.toEqual(Array.from(r2));
  });

  it('differs for different n', () => {
    const r1 = serializeHeader(baseHeader);
    const r2 = serializeHeader({ ...baseHeader, n: 999 });
    expect(Array.from(r1)).not.toEqual(Array.from(r2));
  });

  it('handles empty sessionId', () => {
    const header = { ...baseHeader, sessionId: '' };
    const result = serializeHeader(header);
    // sessionId length byte should be 0
    expect(result[1 + 4 + 4 + 8]).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// concatArrays
// ---------------------------------------------------------------------------
describe('concatArrays', () => {
  it('concatenates two arrays', () => {
    const a = new Uint8Array([1, 2]);
    const b = new Uint8Array([3, 4, 5]);
    const result = concatArrays(a, b);
    expect(Array.from(result)).toEqual([1, 2, 3, 4, 5]);
  });

  it('concatenates three arrays', () => {
    const result = concatArrays(new Uint8Array([1]), new Uint8Array([2]), new Uint8Array([3]));
    expect(Array.from(result)).toEqual([1, 2, 3]);
  });

  it('handles empty arrays', () => {
    const result = concatArrays(new Uint8Array([]), new Uint8Array([1]));
    expect(Array.from(result)).toEqual([1]);
  });

  it('returns empty for no input', () => {
    const result = concatArrays();
    expect(result.byteLength).toBe(0);
  });

  it('preserves total length', () => {
    const a = new Uint8Array(10);
    const b = new Uint8Array(20);
    expect(concatArrays(a, b).byteLength).toBe(30);
  });
});

// ---------------------------------------------------------------------------
// arraysEqual
// ---------------------------------------------------------------------------
describe('arraysEqual', () => {
  it('returns true for identical arrays', () => {
    const a = new Uint8Array([1, 2, 3]);
    expect(arraysEqual(a, a)).toBe(true);
  });

  it('returns true for equal but different references', () => {
    const a = new Uint8Array([10, 20, 30]);
    const b = new Uint8Array([10, 20, 30]);
    expect(arraysEqual(a, b)).toBe(true);
  });

  it('returns false for different contents', () => {
    const a = new Uint8Array([1, 2, 3]);
    const b = new Uint8Array([1, 2, 4]);
    expect(arraysEqual(a, b)).toBe(false);
  });

  it('returns false for different lengths', () => {
    const a = new Uint8Array([1, 2]);
    const b = new Uint8Array([1, 2, 3]);
    expect(arraysEqual(a, b)).toBe(false);
  });

  it('returns true for two empty arrays', () => {
    expect(arraysEqual(new Uint8Array([]), new Uint8Array([]))).toBe(true);
  });

  it('handles single-byte difference', () => {
    const a = new Uint8Array([0xff]);
    const b = new Uint8Array([0x00]);
    expect(arraysEqual(a, b)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// makeSkipKey
// ---------------------------------------------------------------------------
describe('makeSkipKey', () => {
  it('produces a string with hex prefix and message number', () => {
    const dh = new Uint8Array([0xab, 0xcd, 0xef, 0x12, 0x34, 0x56, 0x78, 0x9a, 0xff]);
    const key = makeSkipKey(dh, 42);
    expect(key).toBe('abcdef123456789a:42');
  });

  it('uses only first 8 bytes of DH key', () => {
    const dh = new Uint8Array(65).fill(0x01);
    const key = makeSkipKey(dh, 0);
    expect(key).toBe('0101010101010101:0');
  });

  it('pads hex values to 2 digits', () => {
    const dh = new Uint8Array([0x0a, 0x00, 0x01, 0x0f, 0x10, 0x20, 0x30, 0x40]);
    const key = makeSkipKey(dh, 1);
    expect(key).toBe('0a00010f10203040:1');
  });

  it('produces different keys for different message numbers', () => {
    const dh = new Uint8Array(8).fill(0xaa);
    expect(makeSkipKey(dh, 0)).not.toBe(makeSkipKey(dh, 1));
  });
});
