/**
 * E2EE React Context and Hook for Mobile App (Legacy Wrapper)
 *
 * Now delegates to the Zustand-based e2eeStore for state management.
 * Auto-bootstraps E2EE on login: after checkStatus, if keys are not
 * found and user is authenticated, automatically calls setupE2EE().
 *
 * This file is kept for backward compatibility — new code should
 * import from `./store/e2eeStore` directly.
 */

import React, { type ReactNode, useCallback, useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { useE2EEStore, usePreKeyReplenishment as usePreKeyReplenishmentStore } from './store/e2eeStore';
import { useAuthStore } from '@/stores';
import type { EncryptedMessage } from './e2ee';
import { e2eeLogger as logger } from '../logger';

// Re-export the E2EEContextType for backward compatibility
interface E2EEContextType {
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;
  setupE2EE: () => Promise<void>;
  resetE2EE: () => Promise<void>;
  encryptMessage: (recipientId: string, plaintext: string) => Promise<EncryptedMessage>;
  decryptMessage: (senderId: string, encryptedMessage: EncryptedMessage) => Promise<string>;
  uploadMorePrekeys: (count?: number) => Promise<number>;
  getPrekeyCount: () => Promise<number>;
  handleKeyRevoked: (userId: string, keyId: string) => void;
  getSafetyNumber: (userId: string) => Promise<string>;
  getFingerprint: () => Promise<string | null>;
  getDevices: () => Promise<Array<{ device_id: string; created_at: string }>>;
  revokeDevice: (deviceId: string) => Promise<void>;
}

interface E2EEProviderProps {
  children: ReactNode;
}

/**
 * E2EEProvider — triggers store initialization and auto-bootstraps E2EE.
 *
 * After checkStatus(), if E2EE is not set up and the user is authenticated,
 * automatically calls setupE2EE() in the background. This makes key generation
 * invisible to the user — the chat UI renders immediately while keys are
 * generated behind the scenes.
 *
 * On failure, logs the error and sets setupError in the store. The app
 * continues to work (unencrypted) and retries on next app foreground.
 */
export function E2EEProvider({ children }: E2EEProviderProps) {
  const checkStatus = useE2EEStore((s) => s.checkStatus);
  const setupE2EE = useE2EEStore((s) => s.setupE2EE);
  const isInitialized = useE2EEStore((s) => s.isInitialized);
  const isInitializing = useE2EEStore((s) => s.isInitializing);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  // Prevent concurrent bootstrap attempts (mirrors useE2EE.ts setupPromiseRef pattern)
  const setupPromiseRef = useRef<Promise<void> | null>(null);
  const hasAttemptedRef = useRef(false);

  /**
   * Check E2EE status and auto-bootstrap if needed.
   * Runs as a background task — does not block render.
   */
  const checkAndBootstrap = useCallback(async () => {
    try {
      await checkStatus();

      // After checkStatus, read latest state directly from store
      const state = useE2EEStore.getState();

      if (!state.isInitialized && isAuthenticated && !state.isInitializing) {
        // Prevent concurrent setup calls
        if (setupPromiseRef.current) {
          logger.log('E2EE setup already in progress — skipping');
          return;
        }

        logger.log('E2EE not set up — auto-bootstrapping in background...');
        hasAttemptedRef.current = true;

        setupPromiseRef.current = setupE2EE()
          .then(() => {
            logger.log('E2EE auto-bootstrap complete');
          })
          .catch((err) => {
            // Do NOT crash the app — messaging works unencrypted until next attempt
            logger.error('E2EE auto-bootstrap failed (non-fatal):', err);
          })
          .finally(() => {
            setupPromiseRef.current = null;
          });
      }
    } catch (err) {
      logger.error('E2EE checkAndBootstrap error:', err);
    }
  }, [checkStatus, setupE2EE, isAuthenticated]);

  // Run on mount (after login) — auto-bootstrap E2EE
  useEffect(() => {
    if (isAuthenticated) {
      void checkAndBootstrap();
    }
  }, [isAuthenticated, checkAndBootstrap]);

  // Retry on app foreground if setup failed previously
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active' && isAuthenticated && !isInitialized && !isInitializing) {
        logger.log('App foregrounded — retrying E2EE bootstrap');
        void checkAndBootstrap();
      }
    });

    return () => subscription.remove();
  }, [isAuthenticated, isInitialized, isInitializing, checkAndBootstrap]);

  return <>{children}</>;
}

/**
 * Hook to use E2EE functionality.
 * Delegates entirely to the Zustand store.
 */
export function useE2EE(): E2EEContextType {
  const store = useE2EEStore();
  return store;
}

/**
 * Hook to use E2EE functionality with strict requirement.
 * Same as useE2EE since Zustand store is always available.
 */
export function useE2EEStrict(): E2EEContextType {
  return useE2EE();
}

/**
 * Hook for one-time prekey replenishment.
 * Delegates to the store-based implementation.
 */
export function usePreKeyReplenishment(threshold: number = 20) {
  return usePreKeyReplenishmentStore(threshold);
}

export default {
  E2EEProvider,
  useE2EE,
  useE2EEStrict,
  usePreKeyReplenishment,
};
