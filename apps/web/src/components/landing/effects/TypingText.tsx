/**
 * TypingText Component
 * Typewriter text animation
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { DEFAULT_TYPING_SPEED } from './constants';
import type { TypingTextProps } from './types';

export function TypingText({
  text,
  className = '',
  speed = DEFAULT_TYPING_SPEED,
  delay = 0,
  cursor = true,
}: TypingTextProps) {
  const [displayText, setDisplayText] = useState('');
  const [_isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    let charIndex = 0;

    const startTyping = () => {
      const interval = setInterval(() => {
        if (charIndex <= text.length) {
          setDisplayText(text.slice(0, charIndex));
          charIndex++;
        } else {
          clearInterval(interval);
          setIsComplete(true);
        }
      }, speed);

      return interval;
    };

    const timeout = setTimeout(() => {
      const interval = startTyping();
      return () => clearInterval(interval);
    }, delay);

    return () => clearTimeout(timeout);
  }, [text, speed, delay]);

  return (
    <span className={className}>
      {displayText}
      {cursor && (
        <motion.span
          className="inline-block w-[2px] bg-current"
          animate={{ opacity: [1, 0, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
        >
          |
        </motion.span>
      )}
    </span>
  );
}
