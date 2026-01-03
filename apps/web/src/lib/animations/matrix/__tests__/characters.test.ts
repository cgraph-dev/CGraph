/**
 * Matrix Animation Characters Tests
 * Tests character sets and utility functions
 */

import { describe, it, expect } from 'vitest';
import {
  LATIN_CHARS,
  KATAKANA_CHARS,
  CYRILLIC_CHARS,
  GREEK_CHARS,
  NUMBER_CHARS,
  BINARY_CHARS,
  HEX_CHARS,
  SYMBOL_CHARS,
  CODE_CHARS,
  getCharacterSet,
  getRandomChar,
  getRandomChars,
  createWeightedGenerator,
  getCharWidth,
  CHARACTER_PRESETS,
  getPresetCharacters,
} from '../characters';

describe('Matrix Characters', () => {
  describe('Character Set Constants', () => {
    it('LATIN_CHARS should contain uppercase and lowercase letters', () => {
      expect(LATIN_CHARS).toContain('A');
      expect(LATIN_CHARS).toContain('Z');
      expect(LATIN_CHARS).toContain('a');
      expect(LATIN_CHARS).toContain('z');
      expect(LATIN_CHARS.length).toBeGreaterThan(50);
    });

    it('KATAKANA_CHARS should contain Japanese characters', () => {
      expect(KATAKANA_CHARS).toContain('ア');
      expect(KATAKANA_CHARS).toContain('イ');
      expect(KATAKANA_CHARS.length).toBeGreaterThan(80);
    });

    it('CYRILLIC_CHARS should contain Russian alphabet', () => {
      expect(CYRILLIC_CHARS).toContain('А');
      expect(CYRILLIC_CHARS).toContain('Я');
      expect(CYRILLIC_CHARS).toContain('а');
      expect(CYRILLIC_CHARS).toContain('я');
      expect(CYRILLIC_CHARS.length).toBeGreaterThan(60);
    });

    it('GREEK_CHARS should contain Greek alphabet', () => {
      expect(GREEK_CHARS).toContain('Α');
      expect(GREEK_CHARS).toContain('Ω');
      expect(GREEK_CHARS).toContain('α');
      expect(GREEK_CHARS).toContain('ω');
      expect(GREEK_CHARS.length).toBeGreaterThan(40);
    });

    it('NUMBER_CHARS should contain digits and math symbols', () => {
      expect(NUMBER_CHARS).toContain('0');
      expect(NUMBER_CHARS).toContain('9');
      expect(NUMBER_CHARS).toContain('±');
      expect(NUMBER_CHARS).toContain('∞');
    });

    it('BINARY_CHARS should only contain 0 and 1', () => {
      expect(BINARY_CHARS).toBe('01');
      expect(BINARY_CHARS.length).toBe(2);
    });

    it('HEX_CHARS should contain hex digits', () => {
      expect(HEX_CHARS).toBe('0123456789ABCDEF');
      expect(HEX_CHARS.length).toBe(16);
    });

    it('SYMBOL_CHARS should contain various symbols', () => {
      expect(SYMBOL_CHARS).toContain('!');
      expect(SYMBOL_CHARS).toContain('@');
      expect(SYMBOL_CHARS).toContain('#');
      expect(SYMBOL_CHARS.length).toBeGreaterThan(100);
    });

    it('CODE_CHARS should contain programming symbols', () => {
      expect(CODE_CHARS).toContain('<');
      expect(CODE_CHARS).toContain('>');
      expect(CODE_CHARS).toContain('{');
      expect(CODE_CHARS).toContain('}');
    });
  });

  describe('getCharacterSet', () => {
    it('should return latin characters', () => {
      const chars = getCharacterSet('latin');
      expect(chars).toContain('A');
      expect(chars).toContain('z');
      expect(Array.isArray(chars)).toBe(true);
    });

    it('should return katakana characters', () => {
      const chars = getCharacterSet('katakana');
      expect(chars).toContain('ア');
      expect(Array.isArray(chars)).toBe(true);
    });

    it('should return cyrillic characters', () => {
      const chars = getCharacterSet('cyrillic');
      expect(chars).toContain('А');
    });

    it('should return greek characters', () => {
      const chars = getCharacterSet('greek');
      expect(chars).toContain('Α');
    });

    it('should return number characters', () => {
      const chars = getCharacterSet('numbers');
      expect(chars).toContain('0');
      expect(chars).toContain('9');
    });

    it('should return binary characters', () => {
      const chars = getCharacterSet('binary');
      expect(chars).toContain('0');
      expect(chars).toContain('1');
      expect(chars.length).toBe(2);
    });

    it('should return hex characters', () => {
      const chars = getCharacterSet('hex');
      expect(chars).toContain('A');
      expect(chars).toContain('F');
      expect(chars).toContain('0');
    });

    it('should return symbol characters', () => {
      const chars = getCharacterSet('symbols');
      expect(chars).toContain('!');
    });

    it('should return mixed characters', () => {
      const chars = getCharacterSet('mixed');
      expect(chars.length).toBeGreaterThan(200);
    });

    it('should return custom characters when provided', () => {
      const chars = getCharacterSet('custom', 'ABC123');
      expect(chars).toContain('A');
      expect(chars).toContain('1');
    });

    it('should include numbers when requested', () => {
      const charsWithNumbers = getCharacterSet('latin', undefined, true, false);
      const charsWithoutNumbers = getCharacterSet('latin', undefined, false, false);
      expect(charsWithNumbers.length).toBeGreaterThan(charsWithoutNumbers.length);
    });

    it('should include symbols when requested', () => {
      const charsWithSymbols = getCharacterSet('latin', undefined, false, true);
      const charsWithoutSymbols = getCharacterSet('latin', undefined, false, false);
      expect(charsWithSymbols.length).toBeGreaterThan(charsWithoutSymbols.length);
    });

    it('should return unique characters only', () => {
      const chars = getCharacterSet('latin');
      const unique = [...new Set(chars)];
      expect(chars.length).toBe(unique.length);
    });
  });

  describe('getRandomChar', () => {
    it('should return a character from the provided array', () => {
      const chars = ['A', 'B', 'C'];
      const result = getRandomChar(chars);
      expect(chars).toContain(result);
    });

    it('should return space for empty array', () => {
      const result = getRandomChar([]);
      expect(result).toBe(' ');
    });

    it('should return different characters over multiple calls', () => {
      const chars = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
      const results = new Set<string>();
      for (let i = 0; i < 100; i++) {
        results.add(getRandomChar(chars));
      }
      // Should have gotten multiple different characters
      expect(results.size).toBeGreaterThan(1);
    });
  });

  describe('getRandomChars', () => {
    it('should return requested number of characters', () => {
      const chars = ['A', 'B', 'C'];
      const result = getRandomChars(chars, 5);
      expect(result.length).toBe(5);
    });

    it('should return empty array when count is 0', () => {
      const chars = ['A', 'B', 'C'];
      const result = getRandomChars(chars, 0);
      expect(result.length).toBe(0);
    });

    it('should return characters from provided set', () => {
      const chars = ['X', 'Y', 'Z'];
      const result = getRandomChars(chars, 10);
      for (const char of result) {
        expect(chars).toContain(char);
      }
    });
  });

  describe('createWeightedGenerator', () => {
    it('should create a generator function', () => {
      const chars = ['A', 'B', 'C'];
      const generator = createWeightedGenerator(chars);
      expect(typeof generator).toBe('function');
    });

    it('should return valid characters', () => {
      const chars = ['A', 'B', 'C'];
      const generator = createWeightedGenerator(chars);
      for (let i = 0; i < 50; i++) {
        const result = generator();
        expect(chars).toContain(result);
      }
    });

    it('should work without weights', () => {
      const chars = ['X', 'Y', 'Z'];
      const generator = createWeightedGenerator(chars);
      const result = generator();
      expect(chars).toContain(result);
    });

    it('should use uniform distribution when weights length does not match', () => {
      const chars = ['A', 'B', 'C'];
      const weights = [1]; // Wrong length
      const generator = createWeightedGenerator(chars, weights);
      const result = generator();
      expect(chars).toContain(result);
    });

    it('should favor higher weighted characters', () => {
      const chars = ['A', 'B'];
      const weights = [100, 1]; // A should appear much more often
      const generator = createWeightedGenerator(chars, weights);
      
      let aCount = 0;
      const iterations = 1000;
      for (let i = 0; i < iterations; i++) {
        if (generator() === 'A') aCount++;
      }
      
      // A should appear at least 80% of the time
      expect(aCount / iterations).toBeGreaterThan(0.8);
    });
  });

  describe('getCharWidth', () => {
    it('should return 1 for narrow Latin characters', () => {
      expect(getCharWidth('A')).toBe(1);
      expect(getCharWidth('z')).toBe(1);
      expect(getCharWidth('1')).toBe(1);
    });

    it('should return wider width for CJK characters', () => {
      expect(getCharWidth('ア')).toBe(1.5);
      expect(getCharWidth('カ')).toBe(1.5);
    });
  });

  describe('CHARACTER_PRESETS', () => {
    it('should have classic preset', () => {
      expect(CHARACTER_PRESETS.classic).toBeDefined();
      expect(typeof CHARACTER_PRESETS.classic).toBe('function');
      const chars = CHARACTER_PRESETS.classic();
      expect(Array.isArray(chars)).toBe(true);
      expect(chars.length).toBeGreaterThan(0);
    });

    it('should have cyberpunk preset', () => {
      expect(CHARACTER_PRESETS.cyberpunk).toBeDefined();
      const chars = CHARACTER_PRESETS.cyberpunk();
      expect(Array.isArray(chars)).toBe(true);
    });

    it('should have hacker preset', () => {
      expect(CHARACTER_PRESETS.hacker).toBeDefined();
      const chars = CHARACTER_PRESETS.hacker();
      expect(Array.isArray(chars)).toBe(true);
    });

    it('should have binary preset', () => {
      expect(CHARACTER_PRESETS.binary).toBeDefined();
      const chars = CHARACTER_PRESETS.binary();
      expect(chars).toEqual(['0', '1']);
    });

    it('should have minimal preset', () => {
      expect(CHARACTER_PRESETS.minimal).toBeDefined();
      const chars = CHARACTER_PRESETS.minimal();
      expect(chars.length).toBe(26);
    });

    it('should have mathematical preset', () => {
      expect(CHARACTER_PRESETS.mathematical).toBeDefined();
      const chars = CHARACTER_PRESETS.mathematical();
      expect(chars).toContain('0');
    });

    it('should have slavic preset', () => {
      expect(CHARACTER_PRESETS.slavic).toBeDefined();
      const chars = CHARACTER_PRESETS.slavic();
      expect(Array.isArray(chars)).toBe(true);
    });

    it('should have ancient preset', () => {
      expect(CHARACTER_PRESETS.ancient).toBeDefined();
      const chars = CHARACTER_PRESETS.ancient();
      expect(Array.isArray(chars)).toBe(true);
    });
  });

  describe('getPresetCharacters', () => {
    it('should return characters for classic preset', () => {
      const chars = getPresetCharacters('classic');
      expect(Array.isArray(chars)).toBe(true);
      expect(chars.length).toBeGreaterThan(0);
    });

    it('should return characters for binary preset', () => {
      const chars = getPresetCharacters('binary');
      expect(chars).toEqual(['0', '1']);
    });

    it('should return characters for all valid presets', () => {
      const presets = ['classic', 'cyberpunk', 'hacker', 'binary', 'minimal', 'mathematical', 'slavic', 'ancient'] as const;
      for (const preset of presets) {
        const chars = getPresetCharacters(preset);
        expect(Array.isArray(chars)).toBe(true);
        expect(chars.length).toBeGreaterThan(0);
      }
    });
  });
});
