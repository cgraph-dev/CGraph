import { memo, useState, useEffect } from 'react';
import { prefersReducedMotion, SCRAMBLE_CHARS } from './constants';
import type { TextScrambleProps } from './types';

/**
 * TextScramble Component
 *
 * Cyberpunk-style text reveal with character scrambling
 */
export const TextScramble = memo(function TextScramble({
  text,
  className = '',
  scrambleSpeed = 50,
  delay = 0,
}: TextScrambleProps) {
  // Start with scrambled characters visible immediately (not empty)
  const [displayText, setDisplayText] = useState(() => {
    if (prefersReducedMotion()) return text;
    return text
      .split('')
      .map((char) =>
        char === ' ' ? ' ' : SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)]
      )
      .join('');
  });

  useEffect(() => {
    if (prefersReducedMotion()) {
      setDisplayText(text);
      return;
    }

    let iteration = 0;
    let interval: ReturnType<typeof setInterval>;

    const timeout = setTimeout(() => {
      interval = setInterval(() => {
        setDisplayText(
          text
            .split('')
            .map((char, index) => {
              if (index < iteration) return char;
              return SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
            })
            .join('')
        );

        if (iteration >= text.length) {
          clearInterval(interval);
        }

        iteration += 1 / 4;
      }, scrambleSpeed);
    }, delay);

    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, [text, scrambleSpeed, delay]);

  return <span className={className}>{displayText}</span>;
});

export default TextScramble;
