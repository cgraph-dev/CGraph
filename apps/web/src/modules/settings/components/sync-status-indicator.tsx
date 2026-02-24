/**
 * Settings sync status indicator.
 * @module
 */
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircleIcon, XCircleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

export type SyncStatus = 'idle' | 'saving' | 'saved' | 'error';

interface SyncStatusIndicatorProps {
  status: SyncStatus;
  errorMessage?: string;
  className?: string;
}

/**
 * SyncStatusIndicator - Shows visual feedback for save operations
 *
 * States:
 * - idle: No indicator shown
 * - saving: Spinning loader with "Saving..." text
 * - saved: Checkmark with "Saved" text (auto-hides after 2s)
 * - error: Error icon with error message
 *
 * Usage:
 * ```tsx
 * const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
 *
 * const handleSave = async () => {
 *   setSyncStatus('saving');
 *   try {
 *     await api.put('/settings', data);
 *     setSyncStatus('saved');
 *     setTimeout(() => setSyncStatus('idle'), 2000);
 *   } catch (error) {
 *     setSyncStatus('error');
 *   }
 * };
 *
 * return <SyncStatusIndicator status={syncStatus} />;
 * ```
 */
export default function SyncStatusIndicator({
  status,
  errorMessage = 'Failed to save',
  className = '',
}: SyncStatusIndicatorProps) {
  return (
    <AnimatePresence mode="wait">
      {status !== 'idle' && (
        <motion.div
          key={status}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={tweens.fast}
          className={`flex items-center gap-2 text-sm ${className}`}
        >
          {status === 'saving' && (
            <>
              <ArrowPathIcon className="h-4 w-4 animate-spin text-blue-400" />
              <span className="font-medium text-blue-400">Saving...</span>
            </>
          )}

          {status === 'saved' && (
            <>
              <CheckCircleIcon className="h-4 w-4 text-green-400" />
              <span className="font-medium text-green-400">Saved</span>
            </>
          )}

          {status === 'error' && (
            <>
              <XCircleIcon className="h-4 w-4 text-red-400" />
              <span className="font-medium text-red-400">{errorMessage}</span>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * Hook for managing sync status with auto-reset
 */
export function useSyncStatus() {
  const [status, setStatus] = React.useState<SyncStatus>('idle');
  const [errorMessage, setErrorMessage] = React.useState<string | undefined>();
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Cleanup on unmount
  React.useEffect(() => () => clearTimeout(timerRef.current), []);

  const setSaving = () => {
    clearTimeout(timerRef.current);
    setStatus('saving');
  };

  const setSaved = () => {
    setStatus('saved');
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setStatus('idle'), 2000); // Auto-hide after 2s
  };

  const setError = (message?: string) => {
    setStatus('error');
    setErrorMessage(message);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setStatus('idle'), 4000); // Auto-hide after 4s
  };

  const reset = () => {
    clearTimeout(timerRef.current);
    setStatus('idle');
    setErrorMessage(undefined);
  };

  return {
    status,
    errorMessage,
    setSaving,
    setSaved,
    setError,
    reset,
  };
}

// Add React import for the hook
import React from 'react';
import { tweens } from '@/lib/animation-presets';
