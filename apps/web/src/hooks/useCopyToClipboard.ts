import { useState, useCallback, useRef, useEffect } from 'react';

interface CopyState {
  copied: boolean;
  error: Error | null;
}

/**
 * Hook for copying text to clipboard.
 * 
 * Returns the copy function and state indicating success/failure.
 * The copied state automatically resets after a timeout.
 * 
 * @param resetDelay - time in ms before copied state resets (default: 2000)
 * @returns tuple of [copyToClipboard, { copied, error }]
 * 
 * @example
 * const [copy, { copied }] = useCopyToClipboard();
 * 
 * return (
 *   <button onClick={() => copy(text)}>
 *     {copied ? 'Copied!' : 'Copy'}
 *   </button>
 * );
 */
export function useCopyToClipboard(
  resetDelay: number = 2000
): [(text: string) => Promise<boolean>, CopyState] {
  const [state, setState] = useState<CopyState>({
    copied: false,
    error: null,
  });
  
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const copy = useCallback(async (text: string): Promise<boolean> => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Check for clipboard API support
    if (!navigator?.clipboard) {
      const error = new Error('Clipboard API not available');
      setState({ copied: false, error });
      return false;
    }

    try {
      await navigator.clipboard.writeText(text);
      setState({ copied: true, error: null });

      // Reset after delay
      timeoutRef.current = setTimeout(() => {
        setState({ copied: false, error: null });
      }, resetDelay);

      return true;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to copy');
      setState({ copied: false, error });
      return false;
    }
  }, [resetDelay]);

  return [copy, state];
}

/**
 * Hook for reading text from clipboard.
 * 
 * @returns function that reads clipboard content
 * 
 * @example
 * const readClipboard = useReadClipboard();
 * 
 * const handlePaste = async () => {
 *   const text = await readClipboard();
 *   if (text) setInput(text);
 * };
 */
export function useReadClipboard(): () => Promise<string | null> {
  return useCallback(async (): Promise<string | null> => {
    if (!navigator?.clipboard) {
      console.warn('Clipboard API not available');
      return null;
    }

    try {
      return await navigator.clipboard.readText();
    } catch (err) {
      console.warn('Failed to read clipboard:', err);
      return null;
    }
  }, []);
}
