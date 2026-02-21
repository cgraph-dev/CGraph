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
import { CHARSETS, getRandomChar, encryptText } from './MatrixText.utils';
import type { MatrixTextProps } from './MatrixText.utils';

// Re-export types and presets for barrel consumers
export type { MatrixTextProps } from './MatrixText.utils';
export { MatrixLogo, MatrixHeading, MatrixCipherText } from './MatrixTextPresets';

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * Matrix-style text encryption/decryption animation
 * 
 * Displays text that morphs between encrypted cipher characters
 * and readable text with a cascading reveal effect.
 * Now with continuous cipher morphing for ambient effect.
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
  const ambientMorphRef = useRef<ReturnType<typeof setInterval> | null>(null);
  
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
          setDisplayText((prev: string[]) => {
            const newText = [...prev];
            newText[currentIndex] = chars[currentIndex] ?? '';
            return newText;
          });
          currentIndex++;
          animationRef.current = setTimeout(revealNext, perCharDuration * 0.3);
          return;
        }
        
        // Show random character
        setDisplayText((prev: string[]) => {
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
        setDisplayText((prev: string[]) => {
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
      if (ambientMorphRef.current) {
        clearInterval(ambientMorphRef.current);
      }
    };
  }, [direction, animateDecrypt, animateEncrypt, startDelay]);
  
  // Continuous ambient cipher morph when decrypted (subtle effect)
  useEffect(() => {
    if (phase === 'decrypted' && !loop) {
      // Start ambient morphing - occasional character flickers
      let morphIndex = 0;
      
      ambientMorphRef.current = setInterval(() => {
        setDisplayText((prev: string[]) => {
          const newText = [...prev];
          const idx = morphIndex % text.length;
          
          if (text[idx] !== ' ') {
            // Briefly show cipher character then restore
            const originalChar = text[idx];
            newText[idx] = getRandomChar(charsetString);
            
            // Restore after brief delay
            setTimeout(() => {
              setDisplayText((current: string[]) => {
                const restored = [...current];
                restored[idx] = originalChar ?? '';
                return restored;
              });
            }, 80);
          }
          
          morphIndex++;
          return newText;
        });
      }, 800 + Math.random() * 400);
      
      return () => {
        if (ambientMorphRef.current) {
          clearInterval(ambientMorphRef.current);
        }
      };
    }
    
    return undefined;
  }, [phase, loop, text, charsetString]);
  
  // Glow style with enhanced animation
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
      {displayText.map((char: string, index: number) => {
        const isOriginal = char === text[index];
        const isMorphing = !isOriginal && phase !== 'encrypted';
        
        return (
          <span
            key={index}
            className="inline-block"
            style={{
              opacity: isMorphing ? 0.85 : 1,
              transform: isMorphing ? 'scale(1.08)' : 'scale(1)',
              transition: 'transform 60ms ease-out, opacity 60ms ease-out',
              textShadow: isMorphing ? `0 0 8px ${glowColor}` : undefined,
            }}
          >
            {char}
          </span>
        );
      })}
    </span>
  );
});

export default MatrixText;
