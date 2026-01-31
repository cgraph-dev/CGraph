/**
 * Toast notification hook
 *
 * Provides a simple interface for showing toast notifications.
 * This is a stub that can be connected to any toast library.
 */

import { useCallback } from 'react';
import { createLogger } from '@/lib/logger';

const logger = createLogger('useToast');

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

    logger.debug(`[${options.type.toUpperCase()}] ${options.message}`);

    // If there's a toast container in the DOM, dispatch a custom event
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('cgraph-toast', { detail: options }));
    }
  }, []);

  return { showToast };
}

export default useToast;
