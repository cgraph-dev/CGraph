/**
 * E2EE React Context and Hook for Mobile App (Legacy Wrapper)
 *
 * Now delegates to the Zustand-based e2eeStore for state management.
 * This file is kept for backward compatibility — new code should
 * import from `./store/e2eeStore` directly.
 */

import React, { type ReactNode, useEffect } from 'react';
import { useE2EEStore, usePreKeyReplenishment as usePreKeyReplenishmentStore } from './store/e2eeStore';
import type { EncryptedMessage } from './e2ee';

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
 * E2EEProvider — now a thin wrapper that triggers store initialization.
 * The actual state lives in useE2EEStore (Zustand).
 */
export function E2EEProvider({ children }: E2EEProviderProps) {
  const checkStatus = useE2EEStore((s) => s.checkStatus);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

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
