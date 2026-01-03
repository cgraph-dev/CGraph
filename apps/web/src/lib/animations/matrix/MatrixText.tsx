/**
 * Matrix Text Encryption Animation
 * 
 * @description Animated text component that transforms between encrypted
 * cipher text and readable text with a Matrix-style decryption effect.
 * 
 * @version 1.0.0
 * @since v0.6.5
 * @author CGraph Development Team
 * 
 * @example
 * ```tsx
 * <MatrixText 
 *   text="CGraph" 
 *   className="text-4xl font-bold"
 *   animationDuration={2000}
 *   loop
 * />
 * ```
 */

import { memo, useEffect, useState, useCallback, useRef } from 'react';

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

const CHARSETS = {
  katakana: 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン',
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
function getRandomChar(charset: string): string {
  return charset.charAt(Math.floor(Math.random() * charset.length));
}

/**
 * Generate encrypted version of text
 */
function encryptText(text: string, charset: string): string {
  return text
    .split('')
    .map(char => (char === ' ' ? ' ' : getRandomChar(charset)))
    .join('');
}

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * Matrix-style text encryption/decryption animation
 * 
 * Displays text that morphs between encrypted cipher characters
 * and readable text with a cascading reveal effect.
 */
export const MatrixText = memo(function MatrixText({
  text,
  className = '',
  animationDuration = 2000,
  startDelay = 0,
  loop = false,
  loopDelay = 3000,
  charset = 'katakana',
  direction = 'both',
  onComplete,
  glowColor = '#39ff14',
  enableGlow = true,
}: MatrixTextProps) {
  const [displayText, setDisplayText] = useState<string[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [phase, setPhase] = useState<'idle' | 'encrypting' | 'encrypted' | 'decrypting' | 'decrypted'>('idle');
  const animationRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const frameRef = useRef<ReturnType<typeof requestAnimationFrame> | null>(null);
  
  const charsetString = CHARSETS[charset] || CHARSETS.katakana;
  
  // Initialize display text
  useEffect(() => {
    if (direction === 'encrypt') {
      setDisplayText(text.split(''));
      setPhase('idle');
    } else {
      setDisplayText(encryptText(text, charsetString).split(''));
      setPhase('encrypted');
    }
  }, [text, direction, charsetString]);
  
  /**
   * Animate decryption - reveal characters one by one with scramble effect
   */
  const animateDecrypt = useCallback(() => {
    const chars = text.split('');
    const totalChars = chars.length;
    const perCharDuration = animationDuration / totalChars;
    const scrambleIterations = 5;
    
    setIsAnimating(true);
    setPhase('decrypting');
    
    let currentIndex = 0;
    
    const revealNext = () => {
      if (currentIndex >= totalChars) {
        setIsAnimating(false);
        setPhase('decrypted');
        onComplete?.();
        
        if (loop) {
          animationRef.current = setTimeout(() => {
            if (direction === 'both') {
              animateEncrypt();
            } else {
              // Reset and decrypt again
              setDisplayText(encryptText(text, charsetString).split(''));
              setPhase('encrypted');
              animationRef.current = setTimeout(animateDecrypt, loopDelay);
            }
          }, loopDelay);
        }
        return;
      }
      
      // Scramble current character a few times before revealing
      let scrambleCount = 0;
      const scramble = () => {
        if (scrambleCount >= scrambleIterations) {
          // Reveal actual character
          setDisplayText(prev => {
            const newText = [...prev];
            newText[currentIndex] = chars[currentIndex] ?? '';
            return newText;
          });
          currentIndex++;
          animationRef.current = setTimeout(revealNext, perCharDuration * 0.3);
          return;
        }
        
        // Show random character
        setDisplayText(prev => {
          const newText = [...prev];
          if (chars[currentIndex] !== ' ') {
            newText[currentIndex] = getRandomChar(charsetString);
          }
          return newText;
        });
        
        scrambleCount++;
        animationRef.current = setTimeout(scramble, perCharDuration * 0.7 / scrambleIterations);
      };
      
      scramble();
    };
    
    animationRef.current = setTimeout(revealNext, startDelay);
  }, [text, animationDuration, startDelay, loop, loopDelay, direction, charsetString, onComplete]);
  
  /**
   * Animate encryption - scramble characters one by one
   */
  const animateEncrypt = useCallback(() => {
    const chars = text.split('');
    const totalChars = chars.length;
    const perCharDuration = animationDuration / totalChars;
    
    setIsAnimating(true);
    setPhase('encrypting');
    
    let currentIndex = 0;
    
    const encryptNext = () => {
      if (currentIndex >= totalChars) {
        setIsAnimating(false);
        setPhase('encrypted');
        
        if (loop && direction === 'both') {
          animationRef.current = setTimeout(animateDecrypt, loopDelay);
        }
        return;
      }
      
      // Encrypt current character
      if (chars[currentIndex] !== ' ') {
        setDisplayText(prev => {
          const newText = [...prev];
          newText[currentIndex] = getRandomChar(charsetString);
          return newText;
        });
      }
      
      currentIndex++;
      animationRef.current = setTimeout(encryptNext, perCharDuration * 0.5);
    };
    
    animationRef.current = setTimeout(encryptNext, 0);
  }, [text, animationDuration, loop, loopDelay, direction, charsetString, animateDecrypt]);
  
  // Start animation on mount
  useEffect(() => {
    animationRef.current = setTimeout(() => {
      if (direction === 'encrypt') {
        animateEncrypt();
      } else {
        animateDecrypt();
      }
    }, startDelay);
    
    return () => {
      if (animationRef.current) {
        clearTimeout(animationRef.current);
      }
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [direction, animateDecrypt, animateEncrypt, startDelay]);
  
  // Glow style
  const glowStyle = enableGlow ? {
    textShadow: `
      0 0 5px ${glowColor},
      0 0 10px ${glowColor},
      0 0 20px ${glowColor},
      0 0 40px ${glowColor}88
    `,
  } : {};
  
  return (
    <span 
      className={`inline-block font-mono ${className}`}
      style={glowStyle}
      aria-label={text}
      data-phase={phase}
      data-animating={isAnimating}
    >
      {displayText.map((char, index) => (
        <span
          key={index}
          className="inline-block transition-transform duration-75"
          style={{
            opacity: phase === 'decrypting' && char !== text[index] ? 0.8 : 1,
            transform: phase === 'decrypting' && char !== text[index] ? 'scale(1.1)' : 'scale(1)',
          }}
        >
          {char}
        </span>
      ))}
    </span>
  );
});

// =============================================================================
// PRESET VARIANTS
// =============================================================================

/**
 * Logo text with Matrix decryption effect
 */
export const MatrixLogo = memo(function MatrixLogo({
  text = 'CGraph',
  className = 'text-4xl font-bold text-green-400',
  ...props
}: Partial<MatrixTextProps>) {
  return (
    <MatrixText
      text={text}
      className={className}
      animationDuration={2500}
      startDelay={500}
      loop
      loopDelay={5000}
      direction="both"
      charset="katakana"
      enableGlow
      glowColor="#39ff14"
      {...props}
    />
  );
});

/**
 * Subtle text encryption for headings
 */
export const MatrixHeading = memo(function MatrixHeading({
  text,
  className = 'text-2xl font-semibold text-green-300',
  ...props
}: MatrixTextProps) {
  return (
    <MatrixText
      text={text}
      className={className}
      animationDuration={1500}
      startDelay={200}
      loop={false}
      direction="decrypt"
      charset="mixed"
      enableGlow
      glowColor="#00ff41"
      {...props}
    />
  );
});

export default MatrixText;
