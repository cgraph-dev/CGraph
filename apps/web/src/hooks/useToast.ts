/**
 * Toast notification hook
 *
 * Provides a simple interface for showing toast notifications.
 * This is a stub that can be connected to any toast library.
 */

import { useCallback } from 'react';

export interface ToastOptions {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}

export interface UseToastReturn {
  showToast: (options: ToastOptions) => void;
}

/**
 * Hook for showing toast notifications
 *
 * @example
 * ```tsx
 * const { showToast } = useToast();
 * showToast({ type: 'success', message: 'Operation completed!' });
 * ```
 */
export function useToast(): UseToastReturn {
  const showToast = useCallback((options: ToastOptions) => {
    // This is a simple implementation that uses the browser's alert
    // In production, replace with your toast library (react-hot-toast, sonner, etc.)

    // For now, log to console with styling
    const styles = {
      success: 'color: green; font-weight: bold;',
      error: 'color: red; font-weight: bold;',
      warning: 'color: orange; font-weight: bold;',
      info: 'color: blue; font-weight: bold;',
    };

    console.log(`%c[${options.type.toUpperCase()}] ${options.message}`, styles[options.type]);

    // If there's a toast container in the DOM, dispatch a custom event
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('cgraph-toast', { detail: options }));
    }
  }, []);

  return { showToast };
}

export default useToast;
