/**
 * Feature Flag Hook
 *
 * React hook for consuming feature flags in components.
 * Auto-fetches flags on mount with 5-minute cache via the store.
 *
 * @module hooks/useFeatureFlag
 *
 * @example
 * const { enabled, variant, loading } = useFeatureFlag('dark_mode_v2');
 * if (enabled) {
 *   return <NewDarkMode variant={variant} />;
 * }
 */

import { useEffect } from 'react';
import { useFeatureFlagStore } from '@/stores/featureFlagStore';

interface UseFeatureFlagResult {
  /** Whether the flag is enabled for this user */
  enabled: boolean;
  /** The variant assigned, if applicable */
  variant?: string;
  /** Whether flags are still being loaded */
  loading: boolean;
}

/**
 * Check if a feature flag is enabled.
 *
 * @param flagName - The feature flag name to check
 * @returns Object with enabled state, optional variant, and loading status
 */
export function useFeatureFlag(flagName: string): UseFeatureFlagResult {
  const flags = useFeatureFlagStore((s) => s.flags);
  const loading = useFeatureFlagStore((s) => s.loading);
  const fetchFlags = useFeatureFlagStore((s) => s.fetchFlags);

  useEffect(() => {
    fetchFlags();
  }, [fetchFlags]);

  const flag = flags[flagName];

  return {
    enabled: flag?.enabled ?? false,
    variant: flag?.variant,
    loading: loading && Object.keys(flags).length === 0,
  };
}

/**
 * Get all feature flags at once.
 *
 * Useful for admin panels or debugging views.
 */
export function useAllFeatureFlags() {
  const flags = useFeatureFlagStore((s) => s.flags);
  const loading = useFeatureFlagStore((s) => s.loading);
  const fetchFlags = useFeatureFlagStore((s) => s.fetchFlags);
  const refreshFlags = useFeatureFlagStore((s) => s.refreshFlags);
  const error = useFeatureFlagStore((s) => s.error);

  useEffect(() => {
    fetchFlags();
  }, [fetchFlags]);

  return {
    flags,
    loading,
    error,
    refresh: refreshFlags,
  };
}
