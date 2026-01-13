import { useState, useCallback, useRef, useEffect } from 'react';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';

interface CopyState {
  copied: boolean;
  error: Error | null;
}

interface UseCopyToClipboardOptions {
  /** Time in ms before copied state resets (default: 2000) */
  resetDelay?: number;
  /** Enable haptic feedback on copy (default: true) */
  hapticFeedback?: boolean;
}

/**
 * Hook for copying text to clipboard with haptic feedback.
 * 
 * React Native version using expo-clipboard and expo-haptics.
 * 
 * @param options - configuration options
 * @returns tuple of [copyToClipboard, { copied, error }]
 * 
 * @example
 * const [copy, { copied }] = useCopyToClipboard();
 * 
 * return (
 *   <Pressable onPress={() => copy(text)}>
 *     <Text>{copied ? 'Copied!' : 'Copy'}</Text>
 *   </Pressable>
 * );
 */
export function useCopyToClipboard(
  options: UseCopyToClipboardOptions = {}
): [(text: string) => Promise<boolean>, CopyState] {
  const { resetDelay = 2000, hapticFeedback = true } = options;
  
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

  const copyToClipboard = useCallback(async (text: string): Promise<boolean> => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    try {
      await Clipboard.setStringAsync(text);
      
      // Haptic feedback on success
      if (hapticFeedback) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      
      setState({ copied: true, error: null });

      // Reset after delay
      timeoutRef.current = setTimeout(() => {
        setState(prev => ({ ...prev, copied: false }));
      }, resetDelay);

      return true;
    } catch (error) {
      // Haptic feedback on error
      if (hapticFeedback) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      
      setState({ copied: false, error: error as Error });
      return false;
    }
  }, [resetDelay, hapticFeedback]);

  return [copyToClipboard, state];
}

/**
 * Hook for reading text from clipboard.
 * 
 * @returns function to read clipboard content
 */
export function useClipboardRead(): () => Promise<string> {
  return useCallback(async () => {
    const text = await Clipboard.getStringAsync();
    return text;
  }, []);
}

export default useCopyToClipboard;
