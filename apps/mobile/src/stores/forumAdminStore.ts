/**
 * Forum Admin Store — Zustand store for forum administration state.
 *
 * Manages: moderation logs, forum creation/settings, loading states.
 * Uses manual AsyncStorage persistence.
 *
 * @module stores/forumAdminStore
 */

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../lib/api';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ModerationLog {
  id: string;
  action: string;
  target_type: string;
  target_id: string;
  moderator: { id: string; username: string };
  reason?: string;
  details?: Record<string, unknown>;
  created_at: string;
}

interface ForumSettings {
  theme?: string;
  require_identity_card?: boolean;
  allow_anonymous?: boolean;
  is_private?: boolean;
  is_nsfw?: boolean;
  [key: string]: unknown;
}

interface ForumAdminState {
  moderationLogs: ModerationLog[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchModerationLogs: (forumId: string) => Promise<void>;
  createForum: (data: {
    name: string;
    description?: string;
    theme?: string;
    settings?: ForumSettings;
  }) => Promise<{ id: string } | null>;
  updateForumSettings: (forumId: string, settings: ForumSettings) => Promise<boolean>;
  clearError: () => void;
}

// ---------------------------------------------------------------------------
// Storage keys
// ---------------------------------------------------------------------------

const STORAGE_KEY = '@cgraph/forum-admin';

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useForumAdminStore = create<ForumAdminState>((set, _get) => ({
  moderationLogs: [],
  isLoading: false,
  error: null,

  fetchModerationLogs: async (forumId: string) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.get(`/api/v1/forums/${forumId}/admin/moderation-logs`);
      const logs = res.data?.data || [];
      set({ moderationLogs: logs, isLoading: false });

      // Persist to AsyncStorage
      await AsyncStorage.setItem(
        `${STORAGE_KEY}:logs:${forumId}`,
        JSON.stringify(logs),
      ).catch(() => {});
    } catch (err) {
      console.error('[forumAdminStore] fetchModerationLogs error:', err);
      set({ isLoading: false, error: 'Failed to load moderation logs' });

      // Try loading from cache
      try {
        const cached = await AsyncStorage.getItem(`${STORAGE_KEY}:logs:${forumId}`);
        if (cached) {
          set({ moderationLogs: JSON.parse(cached) });
        }
      } catch {
        // ignore cache errors
      }
    }
  },

  createForum: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.post('/api/v1/forums', {
        name: data.name,
        description: data.description,
        theme: data.theme,
        settings: data.settings,
      });
      set({ isLoading: false });
      return res.data?.forum || res.data?.data || null;
    } catch (err) {
      console.error('[forumAdminStore] createForum error:', err);
      set({ isLoading: false, error: 'Failed to create forum' });
      return null;
    }
  },

  updateForumSettings: async (forumId: string, settings: ForumSettings) => {
    set({ isLoading: true, error: null });
    try {
      await api.put(`/api/v1/forums/${forumId}/settings`, { settings });
      set({ isLoading: false });
      return true;
    } catch (err) {
      console.error('[forumAdminStore] updateForumSettings error:', err);
      set({ isLoading: false, error: 'Failed to update settings' });
      return false;
    }
  },

  clearError: () => set({ error: null }),
}));

// Convenience hooks
export const useModerationLogs = () => useForumAdminStore((s) => s.moderationLogs);
export const useForumAdminLoading = () => useForumAdminStore((s) => s.isLoading);
