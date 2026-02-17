/**
 * Toast notification hook
 *
 * Bridges to the Zustand-based toast system in @/components/ui/Toast.
 * Provides a simple interface for showing toast notifications.
 */

import { useCallback } from 'react';
import { toast as toastActions } from '@/components/ui/Toast';

export interface ToastOptions {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}

export interface UseToastReturn {
  showToast: (options: ToastOptions) => void;
}

/**
 * Hook for showing toast notifications.
 * Delegates to the Zustand-powered toast store (components/ui/Toast).
 *
 * @example
 * ```tsx
 * const { showToast } = useToast();
 * showToast({ type: 'success', message: 'Operation completed!' });
 * ```
 */
export function useToast(): UseToastReturn {
  const showToast = useCallback((options: ToastOptions) => {
    toastActions[options.type](options.message);
  }, []);

  return { showToast };
}

export default useToast;
