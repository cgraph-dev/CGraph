import { useState, useCallback } from 'react';

// ============================================================================
// Hook for managing E2EE error states and pending messages
// ============================================================================

interface PendingMessage {
  content: string;
  replyToId?: string;
  options?: { type?: string; metadata?: Record<string, unknown> };
}

interface UseE2EEErrorReturn {
  showE2EEError: boolean;
  e2eeErrorMessage: string;
  pendingMessage: PendingMessage | null;

  // Actions
  showError: (message: string, pending?: PendingMessage) => void;
  hideError: () => void;
  retryPendingMessage: () => PendingMessage | null;
  clearPendingMessage: () => void;
}

export function useE2EEError(): UseE2EEErrorReturn {
  const [showE2EEError, setShowE2EEError] = useState(false);
  const [e2eeErrorMessage, setE2EEErrorMessage] = useState('');
  const [pendingMessage, setPendingMessage] = useState<PendingMessage | null>(null);

  const showError = useCallback((message: string, pending?: PendingMessage) => {
    setE2EEErrorMessage(message);
    setShowE2EEError(true);
    if (pending) {
      setPendingMessage(pending);
    }
  }, []);

  const hideError = useCallback(() => {
    setShowE2EEError(false);
    setE2EEErrorMessage('');
  }, []);

  const retryPendingMessage = useCallback((): PendingMessage | null => {
    const message = pendingMessage;
    setPendingMessage(null);
    setShowE2EEError(false);
    setE2EEErrorMessage('');
    return message;
  }, [pendingMessage]);

  const clearPendingMessage = useCallback(() => {
    setPendingMessage(null);
  }, []);

  return {
    showE2EEError,
    e2eeErrorMessage,
    pendingMessage,
    showError,
    hideError,
    retryPendingMessage,
    clearPendingMessage,
  };
}
