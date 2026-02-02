import { useState, useEffect } from 'react';

/**
 * Detects when a specific key is pressed.
 *
 * @param targetKey - The key to watch for
 * @returns Boolean indicating if the key is currently pressed
 *
 * @example
 * ```tsx
 * const escPressed = useKeyPress('Escape');
 *
 * useEffect(() => {
 *   if (escPressed) {
 *     closeModal();
 *   }
 * }, [escPressed]);
 * ```
 */
export function useKeyPress(targetKey: string): boolean {
  const [keyPressed, setKeyPressed] = useState(false);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === targetKey) {
        setKeyPressed(true);
      }
    }

    function handleKeyUp(event: KeyboardEvent) {
      if (event.key === targetKey) {
        setKeyPressed(false);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [targetKey]);

  return keyPressed;
}
