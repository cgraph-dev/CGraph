import { useEffect, RefObject } from 'react';

/**
 * Triggers a callback when user clicks outside the referenced element.
 *
 * @param ref - Ref to the element to watch
 * @param callback - Function to call on outside click
 *
 * @example
 * ```tsx
 * const ref = useRef<HTMLDivElement>(null);
 *
 * useClickOutside(ref, () => {
 *   setIsOpen(false);
 * });
 *
 * return <div ref={ref}>Dropdown content</div>;
 * ```
 */
export function useClickOutside<T extends HTMLElement>(
  ref: RefObject<T>,
  callback: (event: MouseEvent | TouchEvent) => void
): void {
  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        callback(event);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [ref, callback]);
}
