import { useEffect, useRef } from 'react';

/**
 * Prevents body scrolling while active.
 *
 * @param isLocked - Whether scrolling should be locked
 *
 * @example
 * ```tsx
 * const [isModalOpen, setIsModalOpen] = useState(false);
 *
 * useScrollLock(isModalOpen);
 *
 * return (
 *   <>
 *     <button onClick={() => setIsModalOpen(true)}>Open</button>
 *     {isModalOpen && <Modal />}
 *   </>
 * );
 * ```
 */
export function useScrollLock(isLocked: boolean): void {
  const originalOverflow = useRef<string>('');

  useEffect(() => {
    if (typeof document === 'undefined') return;

    if (isLocked) {
      originalOverflow.current = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = originalOverflow.current;
    }

    return () => {
      document.body.style.overflow = originalOverflow.current;
    };
  }, [isLocked]);
}
