/**
 * Mobile Feature Flag Hook
 *
 * React Native hook for consuming feature flags.
 * Auto-fetches flags on mount with 5-minute cache via the store.
 * Loads cached flags from AsyncStorage on first mount.
 *
 * @module hooks/useFeatureFlag
 *
 * @example
 * const { enabled, variant, loading } = useFeatureFlag('voice_messages_v2');
 * if (enabled) {
 *   return <VoiceMessageButton />;
 * }
 */

import { useEffect } from 'react';
import { useFeatureFlagStore } from '../stores/featureFlagStore';

interface UseFeatureFlagResult {
  enabled: boolean;
  variant?: string;
  loading: boolean;
}

/**
 * Check if a feature flag is enabled.
 */
export function useFeatureFlag(flagName: string): UseFeatureFlagResult {
  const flags = useFeatureFlagStore((s) => s.flags);
  const loading = useFeatureFlagStore((s) => s.loading);
  const fetchFlags = useFeatureFlagStore((s) => s.fetchFlags);
  const loadCachedFlags = useFeatureFlagStore((s) => s.loadCachedFlags);

  useEffect(() => {
    // Load cached flags first for instant display, then fetch fresh
    loadCachedFlags().then(() => fetchFlags());
  }, [fetchFlags, loadCachedFlags]);

  const flag = flags[flagName];

  return {
    enabled: flag?.enabled ?? false,
    variant: flag?.variant,
    loading: loading && Object.keys(flags).length === 0,
  };
}

/**
 * Get all feature flags. Useful for debug screens.
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

  return { flags, loading, error, refresh: refreshFlags };
}
