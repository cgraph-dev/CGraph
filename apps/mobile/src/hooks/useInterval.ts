/**
 * React hook for running a callback on a configurable interval with pause support.
 * @module hooks/useInterval
 */
import { useRef, useEffect, useCallback } from 'react';

/**
 * Hook that runs a callback on an interval.
 * 
 * @param callback - function to run on each interval
 * @param delay - interval delay in ms (null to pause)
 * 
 * @example
 * useInterval(() => {
 *   setCount(c => c + 1);
 * }, isRunning ? 1000 : null);
 */
export function useInterval(callback: () => void, delay: number | null) {
  const savedCallback = useRef(callback);

  // Remember the latest callback
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Set up the interval
  useEffect(() => {
    if (delay === null) {
      return;
    }

    const id = setInterval(() => {
      savedCallback.current();
    }, delay);

    return () => clearInterval(id);
  }, [delay]);
}

/**
 * Hook that runs a callback after a timeout.
 * 
 * @param callback - function to run after timeout
 * @param delay - timeout delay in ms (null to cancel)
 * 
 * @example
 * useTimeout(() => {
 *   setVisible(false);
 * }, isVisible ? 3000 : null);
 */
export function useTimeout(callback: () => void, delay: number | null) {
  const savedCallback = useRef(callback);

  // Remember the latest callback
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Set up the timeout
  useEffect(() => {
    if (delay === null) {
      return;
    }

    const id = setTimeout(() => {
      savedCallback.current();
    }, delay);

    return () => clearTimeout(id);
  }, [delay]);
}

/**
 * Hook that returns whether the component is mounted.
 * Useful for avoiding state updates after unmount.
 */
export function useIsMounted(): () => boolean {
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return useCallback(() => isMountedRef.current, []);
}

/**
 * Hook that tracks the previous value of a variable.
 */
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T | undefined>(undefined);
  
  useEffect(() => {
    ref.current = value;
  }, [value]);
  
  return ref.current;
}

export { useInterval as default };
