/**
 * E2EE Store — React Hooks
 *
 * React hooks that consume the E2EE store.
 *
 * @module lib/crypto/e2ee-store/hooks
 */

import React from 'react';
import { e2eeLogger as logger } from '../../logger';
import { useE2EEStore } from './store';
import { useAdaptiveInterval } from '@/hooks/useAdaptiveInterval';

/**
 * Hook for one-time prekey replenishment.
 *
 * Periodically checks the prekey count and uploads more
 * when it drops below the given threshold.
 */
export function usePreKeyReplenishment(threshold: number = 20) {
  const { isInitialized, getPrekeyCount, uploadMorePrekeys } = useE2EEStore();
  const failCountRef = React.useRef(0);

  const checkAndReplenish = React.useCallback(async () => {
    if (!isInitialized) return;
    // Back off after repeated failures (backend may not support E2EE endpoints)
    if (failCountRef.current >= 2) return;
    try {
      const count = await getPrekeyCount();
      if (count < threshold) {
        const toUpload = 100 - count;
        await uploadMorePrekeys(toUpload);
        logger.log(`Replenished ${toUpload} one-time prekeys`);
      }
      failCountRef.current = 0;
    } catch {
      failCountRef.current++;
      if (failCountRef.current < 2) {
        logger.warn('Prekey replenishment failed, will retry once');
      }
    }
  }, [isInitialized, threshold, getPrekeyCount, uploadMorePrekeys]);

  // Check immediately on init, then every 5 min (20 min when tab hidden)
  useAdaptiveInterval(checkAndReplenish, 5 * 60 * 1000, {
    enabled: isInitialized,
    immediate: true,
  });
}
