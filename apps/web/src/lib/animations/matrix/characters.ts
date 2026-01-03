/**
 * Matrix Cipher Background Animation - Character Sets
 * 
 * @description Comprehensive character set definitions for the Matrix rain effect.
 * Includes multiple alphabets, symbols, and utility functions for character generation.
 * 
 * @version 1.0.0
 * @since v0.6.3
 * @author CGraph Development Team
 */

import type { CharacterSetType } from './types';

// =============================================================================
// CHARACTER SET DEFINITIONS
// =============================================================================

/**
 * Extended Latin characters (uppercase, lowercase, accented)
 */
export const LATIN_CHARS = 
  'ABCDEFGHIJKLMNOPQRSTUVWXYZ' +
  'abcdefghijklmnopqrstuvwxyz' +
  'ÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝ' +
  'àáâãäåæçèéêëìíîïðñòóôõöøùúûüý';

/**
 * Japanese Katakana characters (half-width and full-width)
 */
export const KATAKANA_CHARS = 
  'アイウエオカキクケコサシスセソタチツテトナニヌネノ' +
  'ハヒフヘホマミムメモヤユヨラリルレロワヲンガギグゲゴ' +
  'ザジズゼゾダヂヅデドバビブベボパピプペポ' +
  'ァィゥェォッャュョ' +
  'ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉ' +
  'ﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜｦﾝ';

/**
 * Cyrillic characters (Russian and extended Slavic)
 */
export const CYRILLIC_CHARS = 
  'АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ' +
  'абвгдеёжзийклмнопрстуфхцчшщъыьэюя' +
  'ЂЃЄЅІЇЈЉЊЋЌЎЏҐ' +
  'ђѓєѕіїјљњћќўџґ';

/**
 * Greek alphabet (uppercase and lowercase)
 */
export const GREEK_CHARS = 
  'ΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡΣΤΥΦΧΨΩ' +
  'αβγδεζηθικλμνξοπρστυφχψω' +
  'ςΆΈΉΊΌΎΏάέήίόύώ';

/**
 * Numeric characters with mathematical symbols
 */
export const NUMBER_CHARS = 
  '0123456789' +
  '⁰¹²³⁴⁵⁶⁷⁸⁹' +
  '₀₁₂₃₄₅₆₇₈₉' +
  '±×÷=≠≈∞∑∏∫√';

/**
 * Binary digits
 */
export const BINARY_CHARS = '01';

/**
 * Hexadecimal characters
 */
export const HEX_CHARS = '0123456789ABCDEF';

/**
 * Special symbols and punctuation
 */
export const SYMBOL_CHARS = 
  '!@#$%^&*()_+-=[]{}|;:\'",.<>?/\\~`' +
  '€£¥¢₹₿₽₩₪₺₴' +
  '©®™§¶†‡•◊' +
  '←→↑↓↔↕↖↗↘↙' +
  '★☆✦✧✶✹✺✻✼✽❋' +
  '♠♣♥♦♤♧♡♢' +
  '▀▄█▌▐░▒▓' +
  '◌◍○◎●◐◑◒◓◔◕◖◗' +
  '⌘⌥⌃⇧⏎⌫' +
  '⚡⚙⚠⚔⚒⚑⚐' +
  '☠☢☣☤☥☦☧☨☩☪☫☬☭☮☯';

/**
 * Code/programming related symbols
 */
export const CODE_CHARS = 
  '<>{}[]()' +
  '+=&|!~^%' +
  '?:;.,@#$' +
  '_-*/\\' +
  '0123456789' +
  'ABCDEF' +
  '0x' +
  '→←↔' +
  '⊕⊗⊖⊙' +
  '≤≥≡≢∧∨¬';

// =============================================================================
// CHARACTER SET UTILITIES
// =============================================================================

/**
 * Get character set by type
 * 
 * @param type - The character set type
 * @param customChars - Optional custom characters for 'custom' type
 * @param includeNumbers - Include number characters
 * @param includeSymbols - Include symbol characters
 * @returns Array of characters
 */
export function getCharacterSet(
  type: CharacterSetType,
  customChars?: string,
  includeNumbers = false,
  includeSymbols = false
): string[] {
  let baseChars = '';
  
  switch (type) {
    case 'latin':
      baseChars = LATIN_CHARS;
      break;
    case 'katakana':
      baseChars = KATAKANA_CHARS;
      break;
    case 'cyrillic':
      baseChars = CYRILLIC_CHARS;
      break;
    case 'greek':
      baseChars = GREEK_CHARS;
      break;
    case 'numbers':
      baseChars = NUMBER_CHARS;
      break;
    case 'binary':
      baseChars = BINARY_CHARS;
      break;
    case 'hex':
      baseChars = HEX_CHARS;
      break;
    case 'symbols':
      baseChars = SYMBOL_CHARS;
      break;
    case 'mixed':
      baseChars = LATIN_CHARS + KATAKANA_CHARS + NUMBER_CHARS + SYMBOL_CHARS;
      break;
    case 'custom':
      baseChars = customChars || LATIN_CHARS;
      break;
    default:
      baseChars = KATAKANA_CHARS; // Default to classic Matrix style
  }
  
  // Add additional character sets if requested
  if (includeNumbers && type !== 'numbers' && type !== 'mixed') {
    baseChars += NUMBER_CHARS;
  }
  
  if (includeSymbols && type !== 'symbols' && type !== 'mixed') {
    baseChars += SYMBOL_CHARS;
  }
  
  // Convert string to unique character array
  return [...new Set(baseChars.split(''))];
}

/**
 * Get a random character from a character set
 * 
 * @param chars - Array of characters to choose from
 * @returns Random character
 */
export function getRandomChar(chars: string[]): string {
  if (chars.length === 0) return ' ';
  return chars[Math.floor(Math.random() * chars.length)] ?? chars[0] ?? ' ';
}

/**
 * Get multiple random characters
 * 
 * @param chars - Array of characters to choose from
 * @param count - Number of characters to get
 * @returns Array of random characters
 */
export function getRandomChars(chars: string[], count: number): string[] {
  return Array.from({ length: count }, () => getRandomChar(chars));
}

/**
 * Create a weighted character generator that favors certain characters
 * 
 * @param chars - Array of characters
 * @param weights - Weight for each character (higher = more frequent)
 * @returns Function that returns weighted random character
 */
export function createWeightedGenerator(
  chars: string[],
  weights?: number[]
): () => string {
  // If no weights provided or empty array, use uniform distribution
  if (!weights || weights.length !== chars.length || chars.length === 0) {
    return () => getRandomChar(chars);
  }
  
  // Build cumulative weight array
  const cumulativeWeights: number[] = [];
  let totalWeight = 0;
  
  for (const weight of weights) {
    totalWeight += weight;
    cumulativeWeights.push(totalWeight);
  }
  
  return (): string => {
    const random = Math.random() * totalWeight;
    const index = cumulativeWeights.findIndex(w => random <= w);
    const result = chars[index >= 0 ? index : 0];
    return result ?? chars[0] ?? ' ';
  };
}

/**
 * Get character display width (handles CJK characters being wider)
 * 
 * @param char - Character to measure
 * @returns Width multiplier (1 for narrow, 2 for wide)
 */
export function getCharWidth(char: string): number {
  const code = char.charCodeAt(0);
  
  // CJK characters (Chinese, Japanese, Korean) are typically double-width
  if (
    (code >= 0x3000 && code <= 0x303F) ||  // CJK Punctuation
    (code >= 0x30A0 && code <= 0x30FF) ||  // Katakana
    (code >= 0x3040 && code <= 0x309F) ||  // Hiragana
    (code >= 0x4E00 && code <= 0x9FFF) ||  // CJK Unified Ideographs
    (code >= 0xFF00 && code <= 0xFFEF)     // Halfwidth/Fullwidth Forms
  ) {
    return 1.5; // Slightly wider but not full double
  }
  
  return 1;
}

/**
 * Get preset character combinations for specific visual styles
 */
export const CHARACTER_PRESETS = {
  /** Classic Matrix movie style (Katakana + numbers + symbols) */
  classic: () => getCharacterSet('katakana', undefined, true, false).concat(
    ...SYMBOL_CHARS.slice(0, 20).split('')
  ),
  
  /** Cyberpunk style (mixed with emphasis on symbols) */
  cyberpunk: () => getCharacterSet('mixed'),
  
  /** Hacker style (code symbols and hex) */
  hacker: () => [...CODE_CHARS.split(''), ...HEX_CHARS.split('')],
  
  /** Binary style (just 0s and 1s) */
  binary: () => ['0', '1'],
  
  /** Minimal Latin (uppercase only) */
  minimal: () => LATIN_CHARS.slice(0, 26).split(''),
  
  /** Mathematical (numbers and math symbols) */
  mathematical: () => NUMBER_CHARS.split(''),
  
  /** Eastern European (Cyrillic) */
  slavic: () => getCharacterSet('cyrillic', undefined, true, false),
  
  /** Ancient (Greek) */
  ancient: () => getCharacterSet('greek', undefined, true, false),
} as const;

export type CharacterPreset = keyof typeof CHARACTER_PRESETS;

/**
 * Get characters from a preset name
 * 
 * @param preset - Preset name
 * @returns Array of characters
 */
export function getPresetCharacters(preset: CharacterPreset): string[] {
  return CHARACTER_PRESETS[preset]?.() || CHARACTER_PRESETS.classic();
}
