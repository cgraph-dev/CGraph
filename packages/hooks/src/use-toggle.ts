/**
 * useToggle — a boolean state hook with toggle/set helpers.
 *
 * @module @cgraph/hooks/use-toggle
 */

import { useState, useCallback } from 'react';

/**
 * Returns `[value, toggle, setValue]` — a boolean state with a memoized toggle function.
 *
 * @example
 * const [isOpen, toggleOpen, setOpen] = useToggle(false);
 * <button onClick={toggleOpen}>Toggle</button>
 * <button onClick={() => setOpen(true)}>Force Open</button>
 */
export function useToggle(initial = false): [boolean, () => void, (value: boolean) => void] {
  const [value, setValue] = useState(initial);
  const toggle = useCallback(() => setValue((v) => !v), []);
  return [value, toggle, setValue];
}
