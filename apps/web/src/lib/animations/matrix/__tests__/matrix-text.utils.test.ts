import { describe, it, expect } from 'vitest';
import { CHARSETS, getRandomChar, encryptText } from '../matrix-text.utils';

describe('matrix-text.utils', () => {
  describe('CHARSETS', () => {
    it('exports all expected charsets', () => {
      expect(CHARSETS).toHaveProperty('katakana');
      expect(CHARSETS).toHaveProperty('binary');
      expect(CHARSETS).toHaveProperty('hex');
      expect(CHARSETS).toHaveProperty('symbols');
      expect(CHARSETS).toHaveProperty('mixed');
    });

    it('binary charset contains only 0 and 1', () => {
      expect(CHARSETS.binary).toBe('01');
    });

    it('hex charset has 16 chars', () => {
      expect(CHARSETS.hex).toHaveLength(16);
    });
  });

  describe('getRandomChar', () => {
    it('returns a single character from the charset', () => {
      const charset = 'abc';
      const result = getRandomChar(charset);
      expect(result).toHaveLength(1);
      expect(charset).toContain(result);
    });

    it('works with all charsets', () => {
      for (const key of Object.keys(CHARSETS) as (keyof typeof CHARSETS)[]) {
        const result = getRandomChar(CHARSETS[key]);
        expect(result).toHaveLength(1);
      }
    });
  });

  describe('encryptText', () => {
    it('produces output of same length as input', () => {
      const text = 'Hello World';
      const result = encryptText(text, CHARSETS.binary);
      expect(result).toHaveLength(text.length);
    });

    it('preserves spaces', () => {
      const text = 'A B C';
      const result = encryptText(text, CHARSETS.hex);
      expect(result[1]).toBe(' ');
      expect(result[3]).toBe(' ');
    });

    it('replaces non-space chars with charset characters', () => {
      const text = 'ABC';
      const charset = 'XYZ';
      const result = encryptText(text, charset);
      for (const char of result) {
        expect(charset).toContain(char);
      }
    });
  });
});
