/**
 * @description TypingCursor — animated typing effect with cursor blink.
 * Replicates the hero typing animation from the landing page.
 * @module components/ui/typing-cursor
 */
import { useState, useEffect } from 'react';
import { useReducedMotion } from 'motion/react';

interface TypingCursorProps {
  phrases: string[];
  className?: string;
  cursorChar?: string;
  typingSpeed?: number;
  deleteSpeed?: number;
  pauseMs?: number;
}

/** Renders an animated typing effect that cycles through phrases with a blinking cursor. */
export function TypingCursor({
  phrases,
  className = '',
  cursorChar = '_',
  typingSpeed = 80,
  deleteSpeed = 40,
  pauseMs = 1800,
}: TypingCursorProps) {
  const [displayed, setDisplayed] = useState('');
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [cursorVisible, setCursorVisible] = useState(true);
  const prefersReduced = useReducedMotion();

  // Cursor blink
  useEffect(() => {
    if (prefersReduced) return;
    const id = setInterval(() => setCursorVisible((v) => !v), 530);
    return () => clearInterval(id);
  }, [prefersReduced]);

  // Typing machine
  useEffect(() => {
    if (prefersReduced) {
      setDisplayed(phrases[0] ?? '');
      return;
    }
    const target = phrases[phraseIndex] ?? '';
    let timeout: ReturnType<typeof setTimeout>;

    if (!isDeleting && displayed.length < target.length) {
      timeout = setTimeout(() => setDisplayed(target.slice(0, displayed.length + 1)), typingSpeed);
    } else if (!isDeleting && displayed.length === target.length) {
      timeout = setTimeout(() => setIsDeleting(true), pauseMs);
    } else if (isDeleting && displayed.length > 0) {
      timeout = setTimeout(() => setDisplayed(target.slice(0, displayed.length - 1)), deleteSpeed);
    } else if (isDeleting && displayed.length === 0) {
      setIsDeleting(false);
      setPhraseIndex((i) => (i + 1) % phrases.length);
    }

    return () => clearTimeout(timeout);
  }, [
    displayed,
    isDeleting,
    phraseIndex,
    phrases,
    typingSpeed,
    deleteSpeed,
    pauseMs,
    prefersReduced,
  ]);

  return (
    <span className={className}>
      {displayed}
      <span
        className="ml-0.5 inline-block font-thin"
        style={{ opacity: cursorVisible ? 1 : 0, transition: 'opacity 0.1s' }}
        aria-hidden="true"
      >
        {cursorChar}
      </span>
    </span>
  );
}
