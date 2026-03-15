/**
 * Forum RSS Store Slice
 *
 * Zustand store for managing RSS feed configuration per board.
 *
 * @module store/forumStore.rss
 */

import { create } from 'zustand';
import { createLogger } from '@/lib/logger';
import { api } from '@/lib/api';

const logger = createLogger('ForumStore:RSS');

// ─── Types ───────────────────────────────────────────────────────────────────

export interface BoardRssConfig {
  boardId: string;
  boardName: string;
  rssEnabled: boolean;
  feedUrl: string;
  atomUrl: string;
}

export interface RssConfig {
  globalEnabled: boolean;
  boards: BoardRssConfig[];
  feedFormat: 'rss' | 'atom';
  itemsPerFeed: number;
}

interface RssStoreState {
  config: RssConfig | null;
  loading: boolean;
  error: string | null;

  // Actions
  fetchRssConfig: (forumId: string) => Promise<void>;
  updateBoardRss: (forumId: string, boardId: string, enabled: boolean) => Promise<void>;
  toggleGlobalRss: (forumId: string, enabled: boolean) => Promise<void>;
  setFeedFormat: (format: 'rss' | 'atom') => void;
  setItemsPerFeed: (count: number) => void;
}

// ─── Store ───────────────────────────────────────────────────────────────────

export const useRssConfigStore = create<RssStoreState>((set, get) => ({
  config: null,
  loading: false,
  error: null,

  fetchRssConfig: async (forumId: string) => {
    set({ loading: true, error: null });
    try {
      const res = await api.get(`/api/v1/forums/${forumId}/rss/config`);
       
      const data = res.data as Record<string, unknown>;
      const boards = Array.isArray(data.boards)
        ?  
          (data.boards as Record<string, unknown>[]).map((b) => ({
             
            boardId: b.board_id as string,
             
            boardName: b.board_name as string,
             
            rssEnabled: (b.rss_enabled as boolean) ?? true,
             
            feedUrl: b.feed_url as string,
             
            atomUrl: b.atom_url as string,
          }))
        : [];

      set({
        config: {
           
          globalEnabled: (data.global_enabled as boolean) ?? true,
          boards,
           
          feedFormat: (data.feed_format as 'rss' | 'atom') || 'rss',
           
          itemsPerFeed: (data.items_per_feed as number) || 20,
        },
        loading: false,
      });
    } catch (err) {
      logger.error(err instanceof Error ? err : new Error(String(err)), 'fetchRssConfig');
      set({ error: 'Failed to fetch RSS config', loading: false });
    }
  },

  updateBoardRss: async (forumId: string, boardId: string, enabled: boolean) => {
    try {
      await api.put(`/api/v1/forums/${forumId}/boards/${boardId}/rss`, {
        rss_enabled: enabled,
      });

      const cfg = get().config;
      if (cfg) {
        set({
          config: {
            ...cfg,
            boards: cfg.boards.map((b) =>
              b.boardId === boardId ? { ...b, rssEnabled: enabled } : b
            ),
          },
        });
      }
    } catch (err) {
      logger.error(err instanceof Error ? err : new Error(String(err)), 'updateBoardRss');
      throw err;
    }
  },

  toggleGlobalRss: async (forumId: string, enabled: boolean) => {
    try {
      await api.put(`/api/v1/forums/${forumId}/rss/config`, {
        global_enabled: enabled,
      });

      const cfg = get().config;
      if (cfg) {
        set({ config: { ...cfg, globalEnabled: enabled } });
      }
    } catch (err) {
      logger.error(err instanceof Error ? err : new Error(String(err)), 'toggleGlobalRss');
      throw err;
    }
  },

  setFeedFormat: (format: 'rss' | 'atom') => {
    const cfg = get().config;
    if (cfg) set({ config: { ...cfg, feedFormat: format } });
  },

  setItemsPerFeed: (count: number) => {
    const cfg = get().config;
    if (cfg) set({ config: { ...cfg, itemsPerFeed: count } });
  },
}));
