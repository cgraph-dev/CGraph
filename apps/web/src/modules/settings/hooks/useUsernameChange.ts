import { useState, useEffect, useCallback, useRef } from 'react';
import { useDebounce } from '@/shared/hooks';
import { createLogger } from '@/lib/logger';

const logger = createLogger('useUsernameChange');

export interface UsernameHistory {
  id: string;
  oldUsername: string;
  newUsername: string;
  changedAt: Date;
  changedByAdmin: boolean;
}

export interface CheckResult {
  available: boolean;
  message?: string;
}

export const COOLDOWN_DAYS_STANDARD = 30;
export const COOLDOWN_DAYS_PREMIUM = 7;

const isValidFormat = (username: string): boolean => {
  return /^[a-zA-Z0-9_-]{3,32}$/.test(username);
};

interface UseUsernameChangeOptions {
  currentUsername: string;
  lastChangeDate?: Date | null;
  isPremium?: boolean;
  onSuccess?: (newUsername: string) => void;
  onClose: () => void;
}

export function useUsernameChange({
  currentUsername,
  lastChangeDate,
  isPremium = false,
  onSuccess,
  onClose,
}: UseUsernameChangeOptions) {
  const [newUsername, setNewUsername] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkResult, setCheckResult] = useState<CheckResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<UsernameHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const availabilityAbortRef = useRef<AbortController | null>(null);
  const historyAbortRef = useRef<AbortController | null>(null);

  const debouncedUsername = useDebounce(newUsername, 500);
  const cooldownDays = isPremium ? COOLDOWN_DAYS_PREMIUM : COOLDOWN_DAYS_STANDARD;

  // Calculate remaining cooldown days
  const getRemainingDays = useCallback((): number => {
    if (!lastChangeDate) return 0;
    const now = new Date();
    const daysSinceChange = Math.floor(
      (now.getTime() - lastChangeDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    return Math.max(0, cooldownDays - daysSinceChange);
  }, [lastChangeDate, cooldownDays]);

  const remainingDays = getRemainingDays();
  const canChange = remainingDays === 0;

  // Check username availability
  useEffect(() => {
    if (!debouncedUsername || debouncedUsername === currentUsername) {
      setCheckResult(null);
      return;
    }

    if (!isValidFormat(debouncedUsername)) {
      setCheckResult({
        available: false,
        message:
          'Username must be 3-32 characters and contain only letters, numbers, underscores, and hyphens',
      });
      return;
    }

    availabilityAbortRef.current?.abort();
    availabilityAbortRef.current = new AbortController();
    const signal = availabilityAbortRef.current.signal;

    const checkAvailability = async () => {
      setIsChecking(true);
      try {
        const response = await fetch(
          `/api/users/check-username?username=${encodeURIComponent(debouncedUsername)}`,
          { signal }
        );
        const data = await response.json();
        if (!signal.aborted) {
          setCheckResult({
            available: data.available,
            message: data.available
              ? 'Username is available!'
              : data.reason || 'Username is not available',
          });
        }
      } catch (error) {
        if (error instanceof Error && error.name !== 'AbortError') {
          setCheckResult({
            available: false,
            message: 'Unable to check availability',
          });
        }
      } finally {
        if (!signal.aborted) {
          setIsChecking(false);
        }
      }
    };

    checkAvailability();

    return () => {
      availabilityAbortRef.current?.abort();
    };
  }, [debouncedUsername, currentUsername]);

  // Load history
  const loadHistory = useCallback(async () => {
    historyAbortRef.current?.abort();
    historyAbortRef.current = new AbortController();
    const signal = historyAbortRef.current.signal;

    setLoadingHistory(true);
    try {
      const response = await fetch('/api/users/me/username-history', { signal });
      const data = await response.json();
      if (!signal.aborted) {
        setHistory(data.history || []);
      }
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        logger.error('Failed to load username history');
      }
    } finally {
      if (!signal.aborted) {
        setLoadingHistory(false);
      }
    }
  }, []);

  useEffect(() => {
    if (showHistory && history.length === 0) {
      loadHistory();
    }

    return () => {
      historyAbortRef.current?.abort();
    };
  }, [showHistory, history.length, loadHistory]);

  // Handle submit
  const handleSubmit = async () => {
    if (!canChange || !checkResult?.available) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/users/me/change-username', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: newUsername }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to change username');
      }

      onSuccess?.(newUsername);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleHistory = () => setShowHistory((prev) => !prev);

  return {
    newUsername,
    setNewUsername,
    isChecking,
    isSubmitting,
    checkResult,
    error,
    showHistory,
    toggleHistory,
    history,
    loadingHistory,
    remainingDays,
    canChange,
    cooldownDays,
    handleSubmit,
  };
}
