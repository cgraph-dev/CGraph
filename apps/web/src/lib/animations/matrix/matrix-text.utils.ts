/**
 * Matrix Text utilities — types, character sets, and helpers
 * @module lib/animations/matrix
 */

// =============================================================================
// TYPES
// =============================================================================

export interface MatrixTextProps {
  /** The text to display and animate */
  text: string;
  /** CSS class names */
  className?: string;
  /** Duration of encryption/decryption animation in ms */
  animationDuration?: number;
  /** Delay before animation starts in ms */
  startDelay?: number;
  /** Whether to loop the animation */
  loop?: boolean;
  /** Delay between loop cycles in ms */
  loopDelay?: number;
  /** Character set for encrypted text */
  charset?: 'katakana' | 'binary' | 'hex' | 'symbols' | 'mixed';
  /** Animation direction */
  direction?: 'encrypt' | 'decrypt' | 'both';
  /** Callback when animation completes */
  onComplete?: () => void;
  /** Glow color for text */
  glowColor?: string;
  /** Enable glow effect */
  enableGlow?: boolean;
}

// =============================================================================
// CHARACTER SETS
// =============================================================================

export const CHARSETS = {
  katakana:
    'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン',
  binary: '01',
  hex: '0123456789ABCDEF',
  symbols: '!@#$%^&*()[]{}|;:,.<>?/\\~`+-=_',
  mixed: 'アイウエオ01234567890ABCDEF!@#$%^&*',
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Get random character from charset
 */
export function getRandomChar(charset: string): string {
  return charset.charAt(Math.floor(Math.random() * charset.length));
}

/**
 * Generate encrypted version of text
 */
export function encryptText(text: string, charset: string): string {
  return text
    .split('')
    .map((char) => (char === ' ' ? ' ' : getRandomChar(charset)))
    .join('');
}
