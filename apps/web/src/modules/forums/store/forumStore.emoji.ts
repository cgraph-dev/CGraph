/**
 * Forum Emoji Store Slice
 *
 * Zustand store for managing emoji packs and custom emojis.
 * Handles pack CRUD, import/export, and emoji operations.
 *
 * @module store/forumStore.emoji
 */

import { create } from 'zustand';
import { createLogger } from '@/lib/logger';
import { api } from '@/lib/api';

const logger = createLogger('ForumStore:Emoji');

// ─── Types ───────────────────────────────────────────────────────────────────

export interface EmojiPack {
  id: string;
  name: string;
  description: string | null;
  author: string | null;
  version: string;
  iconUrl: string | null;
  emojiCount: number;
  isPremium: boolean;
  isActive: boolean;
  emojis: PackEmoji[];
}

export interface PackEmoji {
  id: string;
  shortcode: string;
  imageUrl: string;
  isAnimated: boolean;
}

export interface EmojiPackBundle {
  name: string;
  description?: string;
  author?: string;
  version: string;
  emojis: Array<{
    shortcode: string;
    name: string;
    image_url: string;
    image_type: string;
    is_animated: boolean;
    aliases: string[];
  }>;
}

interface EmojiStoreState {
  packs: EmojiPack[];
  loading: boolean;
  error: string | null;

  // Actions
  fetchPacks: (forumId: string) => Promise<void>;
  createPack: (forumId: string, data: { name: string; description?: string }) => Promise<EmojiPack>;
  importPack: (forumId: string, bundle: EmojiPackBundle) => Promise<EmojiPack>;
  exportPack: (forumId: string, packId: string) => Promise<EmojiPackBundle>;
  deletePack: (forumId: string, packId: string) => Promise<void>;
  fetchMarketplace: () => Promise<EmojiPack[]>;
  uploadEmoji: (forumId: string, packId: string, data: FormData) => Promise<void>;
  deleteEmoji: (emojiId: string) => Promise<void>;
  approveEmoji: (emojiId: string) => Promise<void>;
}

// ─── Mappers ─────────────────────────────────────────────────────────────────

function mapPack(raw: Record<string, unknown>): EmojiPack {
  return {
     
    id: raw.id as string,
     
    name: raw.name as string,
     
    description: (raw.description as string) || null,
     
    author: (raw.author as string) || null,
     
    version: (raw.version as string) || '1.0.0',
     
    iconUrl: (raw.icon_url as string) || null,
     
    emojiCount: (raw.emoji_count as number) || 0,
     
    isPremium: (raw.is_premium as boolean) || false,
     
    isActive: (raw.is_active as boolean) ?? true,
    emojis: Array.isArray(raw.emojis)
      ?  
        (raw.emojis as Record<string, unknown>[]).map((e) => ({
           
          id: e.id as string,
           
          shortcode: e.shortcode as string,
           
          imageUrl: e.image_url as string,
           
          isAnimated: (e.is_animated as boolean) || false,
        }))
      : [],
  };
}

// ─── Store ───────────────────────────────────────────────────────────────────

export const useEmojiPackStore = create<EmojiStoreState>((set, get) => ({
  packs: [],
  loading: false,
  error: null,

  fetchPacks: async (forumId: string) => {
    set({ loading: true, error: null });
    try {
      const res = await api.get(`/api/v1/forums/${forumId}/emoji-packs`);
       
      const data = (res.data as { data: Record<string, unknown>[] }).data || [];
      set({ packs: data.map(mapPack), loading: false });
    } catch (err) {
      logger.error(err instanceof Error ? err : new Error(String(err)), 'fetchPacks');
      set({ error: 'Failed to fetch emoji packs', loading: false });
    }
  },

  createPack: async (forumId: string, data: { name: string; description?: string }) => {
    const res = await api.post(`/api/v1/forums/${forumId}/emoji-packs`, { pack: data });
     
    const pack = mapPack((res.data as { data: Record<string, unknown> }).data);
    set((s) => ({ packs: [...s.packs, pack] }));
    return pack;
  },

  importPack: async (forumId: string, bundle: EmojiPackBundle) => {
    const res = await api.post(`/api/v1/forums/${forumId}/emoji-packs/import`, { bundle });
     
    const pack = mapPack((res.data as { data: Record<string, unknown> }).data);
    // Refetch to get full pack with emojis
    await get().fetchPacks(forumId);
    return pack;
  },

  exportPack: async (forumId: string, packId: string) => {
    const res = await api.get(`/api/v1/forums/${forumId}/emoji-packs/${packId}/export`);
     
    return res.data as EmojiPackBundle;
  },

  deletePack: async (forumId: string, packId: string) => {
    await api.delete(`/api/v1/forums/${forumId}/emoji-packs/${packId}`);
    set((s) => ({ packs: s.packs.filter((p) => p.id !== packId) }));
  },

  fetchMarketplace: async () => {
    const res = await api.get('/api/v1/emoji-packs/marketplace');
     
    const data = (res.data as { data: Record<string, unknown>[] }).data || [];
    return data.map(mapPack);
  },

  uploadEmoji: async (forumId: string, _packId: string, data: FormData) => {
    await api.post(`/api/v1/emojis`, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    await get().fetchPacks(forumId);
  },

  deleteEmoji: async (emojiId: string) => {
    await api.delete(`/api/v1/emojis/${emojiId}`);
  },

  approveEmoji: async (emojiId: string) => {
    await api.post(`/api/v1/admin/emojis/${emojiId}/approve`);
  },
}));
