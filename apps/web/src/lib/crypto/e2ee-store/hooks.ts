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

/**
 * Hook for one-time prekey replenishment.
 *
 * Periodically checks the prekey count and uploads more
 * when it drops below the given threshold.
 */
export function usePreKeyReplenishment(threshold: number = 20) {
  const { isInitialized, getPrekeyCount, uploadMorePrekeys } = useE2EEStore();

  React.useEffect(() => {
    if (!isInitialized) return;

    const checkAndReplenish = async () => {
      try {
        const count = await getPrekeyCount();
        if (count < threshold) {
          const toUpload = 100 - count;
          await uploadMorePrekeys(toUpload);
          logger.log(`Replenished ${toUpload} one-time prekeys`);
        }
      } catch (err) {
        logger.error('Error replenishing prekeys:', err);
      }
    };

    checkAndReplenish();
    const interval = setInterval(checkAndReplenish, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [isInitialized, threshold, getPrekeyCount, uploadMorePrekeys]);
}
