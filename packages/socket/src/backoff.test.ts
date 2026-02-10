/**
 * Tests for exponential backoff with equal jitter.
 *
 * Validates that the backoff function produces correct delay ranges,
 * respects maximum caps, and adds sufficient randomness to prevent
 * thundering herd reconnect storms at 10M+ user scale.
 *
 * @module backoff.test
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { exponentialBackoffWithJitter } from './backoff';

describe('exponentialBackoffWithJitter', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns a function', () => {
    const backoff = exponentialBackoffWithJitter();
    expect(typeof backoff).toBe('function');
  });

  it('uses default base of 1000ms', () => {
    // With Math.random = 0, delay = exponential/2 (minimum possible)
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const backoff = exponentialBackoffWithJitter();

    // try 1: base * 2^0 = 1000, half = 500
    expect(backoff(1)).toBe(500);
  });

  it('increases exponentially with each try', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const backoff = exponentialBackoffWithJitter();

    // try 1: 1000 * 2^0 = 1000 → min 500
    // try 2: 1000 * 2^1 = 2000 → min 1000
    // try 3: 1000 * 2^2 = 4000 → min 2000
    // try 4: 1000 * 2^3 = 8000 → min 4000
    expect(backoff(1)).toBe(500);
    expect(backoff(2)).toBe(1000);
    expect(backoff(3)).toBe(2000);
    expect(backoff(4)).toBe(4000);
  });

  it('respects the maximum delay cap', () => {
    vi.spyOn(Math, 'random').mockReturnValue(1); // max jitter
    const backoff = exponentialBackoffWithJitter({ maxMs: 30000 });

    // At high try counts, should never exceed maxMs
    // try 20: 1000 * 2^19 = 524_288_000, capped to 30000
    // With random=1: 30000/2 + 30000/2 = 30000
    expect(backoff(20)).toBeLessThanOrEqual(30000);
  });

  it('uses custom baseMs', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const backoff = exponentialBackoffWithJitter({ baseMs: 500 });

    // try 1: 500 * 2^0 = 500 → min 250
    expect(backoff(1)).toBe(250);
    // try 2: 500 * 2^1 = 1000 → min 500
    expect(backoff(2)).toBe(500);
  });

  it('uses custom maxMs', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const backoff = exponentialBackoffWithJitter({ baseMs: 1000, maxMs: 5000 });

    // try 4: 1000 * 2^3 = 8000, capped to 5000 → min 2500
    expect(backoff(4)).toBe(2500);
  });

  describe('equal jitter properties', () => {
    it('minimum delay is half the exponential value (random=0)', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0);
      const backoff = exponentialBackoffWithJitter({ baseMs: 1000 });

      // Exponential for try 3 = 4000, minimum = 2000
      expect(backoff(3)).toBe(2000);
    });

    it('maximum delay equals the full exponential value (random=1)', () => {
      vi.spyOn(Math, 'random').mockReturnValue(1);
      const backoff = exponentialBackoffWithJitter({ baseMs: 1000 });

      // Exponential for try 3 = 4000, max = 4000/2 + 4000/2 = 4000
      // But Math.floor could make it 3999.
      expect(backoff(3)).toBeGreaterThanOrEqual(3999);
      expect(backoff(3)).toBeLessThanOrEqual(4000);
    });

    it('adds randomness — different calls with real Math.random vary', () => {
      vi.restoreAllMocks(); // Use real Math.random
      const backoff = exponentialBackoffWithJitter({ baseMs: 1000 });

      // Run 100 samples at try 5 (exponential = 16000)
      const samples = Array.from({ length: 100 }, () => backoff(5));
      const unique = new Set(samples);

      // With real randomness, we should get many unique values
      expect(unique.size).toBeGreaterThan(50);

      // All should be in valid range: [8000, 16000]
      for (const s of samples) {
        expect(s).toBeGreaterThanOrEqual(8000);
        expect(s).toBeLessThanOrEqual(16000);
      }
    });
  });

  describe('scale validation (thundering herd prevention)', () => {
    it('first retry delay is at most 1 second', () => {
      vi.spyOn(Math, 'random').mockReturnValue(1);
      const backoff = exponentialBackoffWithJitter();

      // try 1: max = 1000ms
      expect(backoff(1)).toBeLessThanOrEqual(1000);
    });

    it('reaches max delay within reasonable tries', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0);
      const backoff = exponentialBackoffWithJitter({ maxMs: 30000 });

      // Min delay at try 5 = 16000/2 = 8000, at try 6 = 30000/2 = 15000
      // So by try 6 we're at the cap
      expect(backoff(6)).toBe(15000);
    });

    it('all delays are non-negative integers', () => {
      vi.restoreAllMocks();
      const backoff = exponentialBackoffWithJitter();

      for (let tries = 1; tries <= 20; tries++) {
        const delay = backoff(tries);
        expect(delay).toBeGreaterThanOrEqual(0);
        expect(Number.isInteger(delay)).toBe(true);
      }
    });
  });
});
