/**
 * useDebounce — delays updating a value until after a specified period of
 * inactivity, reducing re-renders from rapid changes.
 *
 * @module @cgraph/hooks/use-debounce
 */

import { useState, useEffect } from 'react';

/**
 * Returns a debounced copy of `value` that only updates once
 * the caller stops changing it for `delayMs` milliseconds.
 *
 * @example
 * const debouncedQuery = useDebounce(searchInput, 300);
 * useEffect(() => { search(debouncedQuery); }, [debouncedQuery]);
 */
export function useDebounce<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(id);
  }, [value, delayMs]);

  return debounced;
}
