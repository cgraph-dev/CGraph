/**
 * useSecretChat Hook
 *
 * Combines the secret chat Zustand store with API calls and
 * E2E encryption operations. This is the primary hook for
 * interacting with secret chat functionality.
 *
 * @module modules/secret-chat/hooks/useSecretChat
 */

import { useCallback } from 'react';
import { api } from '@/lib/api';
import { useSecretChatStore } from '../store';
import type { SecretChatSession, SecretThemeId } from '../store/types';

/**
 * Return type for the useSecretChat hook
 */
export interface UseSecretChatReturn {
  /** Current active session */
  session: SecretChatSession | null;
  /** Whether ghost mode is active */
  ghostModeActive: boolean;
  /** Whether ghost mode toggle is in progress */
  ghostModeToggling: boolean;
  /** Currently selected theme */
  selectedThemeId: SecretThemeId;
  /** Whether panic wipe is in progress */
  isPanicWiping: boolean;
  /** Toggle ghost mode on/off via API */
  toggleGhostMode: () => Promise<void>;
  /** Set the active session */
  setSession: (session: SecretChatSession | null) => void;
  /** Change the secret chat theme */
  setTheme: (themeId: SecretThemeId) => void;
  /** Set the user alias */
  setAlias: (alias: string) => void;
  /** Trigger a panic wipe */
  panicWipe: () => Promise<void>;
  /** Reset all secret chat state */
  reset: () => void;
}

/**
 * Primary hook for secret chat functionality.
 *
 * Combines Zustand store state with API integration for:
 * - Ghost mode toggling
 * - Session management
 * - Panic wipe
 * - Theme selection
 */
export function useSecretChat(): UseSecretChatReturn {
  const store = useSecretChatStore();

  const toggleGhostMode = useCallback(async () => {
    const { ghostMode, setGhostToggling, setGhostActive } = useSecretChatStore.getState();
    setGhostToggling(true);

    try {
      await api.post('/api/v1/secret-chats/ghost', {
        enabled: !ghostMode.isActive,
      });
      setGhostActive(!ghostMode.isActive);
    } finally {
      setGhostToggling(false);
    }
  }, []);

  const panicWipe = useCallback(async () => {
    const { session, panicWipe: doPanicWipe } = useSecretChatStore.getState();

    if (!session) return;

    try {
      await api.post(`/api/v1/secret-chats/${session.id}/panic-wipe`);
    } finally {
      doPanicWipe();
    }
  }, []);

  return {
    session: store.session,
    ghostModeActive: store.ghostMode.isActive,
    ghostModeToggling: store.ghostMode.isToggling,
    selectedThemeId: store.selectedThemeId,
    isPanicWiping: store.isPanicWiping,
    toggleGhostMode,
    setSession: store.setSession,
    setTheme: store.setTheme,
    setAlias: store.setAlias,
    panicWipe,
    reset: store.reset,
  };
}
