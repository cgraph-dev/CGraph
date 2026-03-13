/**
 * Secret Chat Store
 *
 * Zustand store managing secret chat state: sessions, ghost mode,
 * theme selection, and panic wipe. Follows the per-feature slice pattern
 * established in the chat module.
 *
 * @module modules/secret-chat/store/secretChatStore
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { SecretChatState, SecretChatSession, SecretThemeId } from './types';

/** Initial ghost mode state */
const initialGhostMode = {
  isActive: false,
  activatedAt: null,
  isToggling: false,
} as const;

/**
 * Secret Chat Zustand store.
 *
 * Manages:
 * - Active session lifecycle
 * - Ghost mode toggling
 * - Theme selection
 * - Panic wipe (full session destruction)
 */
export const useSecretChatStore = create<SecretChatState>()(
  devtools(
    (set) => ({
      // ── Initial State ──────────────────────────────────────────────
      session: null,
      ghostMode: { ...initialGhostMode },
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      selectedThemeId: 'void' as SecretThemeId,
      isPanicWiping: false,

      // ── Actions ────────────────────────────────────────────────────

      setSession: (session: SecretChatSession | null) => set({ session }, false, 'setSession'),

      setTheme: (themeId: SecretThemeId) => set({ selectedThemeId: themeId }, false, 'setTheme'),

      toggleGhostMode: () =>
        set(
          (state) => ({
            ghostMode: {
              ...state.ghostMode,
              isActive: !state.ghostMode.isActive,
              activatedAt: !state.ghostMode.isActive ? new Date().toISOString() : null,
            },
          }),
          false,
          'toggleGhostMode'
        ),

      setGhostToggling: (isToggling: boolean) =>
        set(
          (state) => ({
            ghostMode: { ...state.ghostMode, isToggling },
          }),
          false,
          'setGhostToggling'
        ),

      setGhostActive: (isActive: boolean) =>
        set(
          (state) => ({
            ghostMode: {
              ...state.ghostMode,
              isActive,
              activatedAt: isActive ? new Date().toISOString() : null,
            },
          }),
          false,
          'setGhostActive'
        ),

      setExpiresAt: (expiresAt: string) =>
        set(
          (state) => ({
            session: state.session ? { ...state.session, expiresAt } : null,
          }),
          false,
          'setExpiresAt'
        ),

      setAlias: (alias: string) =>
        set(
          (state) => ({
            session: state.session ? { ...state.session, alias } : null,
          }),
          false,
          'setAlias'
        ),

      panicWipe: () =>
        set(
          {
            session: null,
            ghostMode: { ...initialGhostMode },
            isPanicWiping: true,
          },
          false,
          'panicWipe'
        ),

      reset: () =>
        set(
          {
            session: null,
            ghostMode: { ...initialGhostMode },
            // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
            selectedThemeId: 'void' as SecretThemeId,
            isPanicWiping: false,
          },
          false,
          'reset'
        ),
    }),
    { name: 'SecretChatStore' }
  )
);
