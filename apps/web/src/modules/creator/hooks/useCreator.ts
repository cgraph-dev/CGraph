/**
 * useCreator Hook
 *
 * Thin wrapper around the creator store for status, onboarding,
 * and creator identity checks.
 *
 * @module modules/creator/hooks/useCreator
 */

import { useCallback } from 'react';
import { useCreatorStore } from '../store';

export function useCreator() {
  const isCreator = useCreatorStore((s) => s.isCreator);
  const onboardingComplete = useCreatorStore((s) => s.onboardingComplete);
  const creatorStatus = useCreatorStore((s) => s.creatorStatus);
  const stripeAccountId = useCreatorStore((s) => s.stripeAccountId);
  const isLoading = useCreatorStore((s) => s.isLoading);
  const error = useCreatorStore((s) => s.error);

  const fetchStatus = useCreatorStore((s) => s.fetchStatus);
  const onboard = useCreatorStore((s) => s.onboard);
  const refreshOnboard = useCreatorStore((s) => s.refreshOnboard);

  const startOnboarding = useCallback(async () => {
    const result = await onboard();
    if (result?.url) {
      window.location.href = result.url;
    }
    return result;
  }, [onboard]);

  const continueOnboarding = useCallback(async () => {
    const result = await refreshOnboard();
    if (result?.url) {
      window.location.href = result.url;
    }
    return result;
  }, [refreshOnboard]);

  return {
    isCreator,
    onboardingComplete,
    creatorStatus,
    stripeAccountId,
    isLoading,
    error,
    fetchStatus,
    startOnboarding,
    continueOnboarding,
  };
}
