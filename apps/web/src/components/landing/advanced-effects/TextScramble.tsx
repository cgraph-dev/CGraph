/**
 * TextScramble Component
 * Text scramble animation effect
 */

import { useState, useEffect } from 'react';
import { SCRAMBLE_DEFAULT_SPEED, SCRAMBLE_DEFAULT_CHARS } from './constants';
import type { TextScrambleProps } from './types';

export function TextScramble({
  text,
  className = '',
  speed = SCRAMBLE_DEFAULT_SPEED,
  trigger = true,
  scrambleChars = SCRAMBLE_DEFAULT_CHARS,
}: TextScrambleProps) {
  const [displayText, setDisplayText] = useState(text);
  const [isScrambling, setIsScrambling] = useState(false);

  useEffect(() => {
    if (!trigger || isScrambling) return;

    setIsScrambling(true);
    let iteration = 0;
    const maxIterations = text.length * 3;

    const interval = setInterval(() => {
      setDisplayText(
        text
          .split('')
          .map((_char, index) => {
            if (index < iteration / 3) {
              return text[index];
            }
            return scrambleChars[Math.floor(Math.random() * scrambleChars.length)];
          })
          .join('')
      );

      iteration++;

      if (iteration > maxIterations) {
        clearInterval(interval);
        setDisplayText(text);
        setIsScrambling(false);
      }
    }, speed);

    return () => clearInterval(interval);
  }, [trigger, text, speed, scrambleChars, isScrambling]);

  return <span className={className}>{displayText}</span>;
}
