/**
 * usePrevious — returns the value from the previous render.
 *
 * @module @cgraph/hooks/use-previous
 */

import { useRef, useEffect } from 'react';

/**
 * Stores the value from the previous render cycle.
 * Returns `undefined` on the first render.
 *
 * @example
 * const prevCount = usePrevious(count);
 * if (prevCount !== undefined && prevCount !== count) { ... }
 */
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T | undefined>(undefined);

  useEffect(() => {
    ref.current = value;
  });

  return ref.current;
}
