/**
 * Cosmetics Store — Zustand state management for cosmetics.
 *
 * Connects the ShopPage and InventoryPage to the backend
 * CosmeticsController via the cosmeticsApi service.
 *
 * @module cosmetics/store/cosmetics-store
 */

import { create } from 'zustand';
import type { CosmeticItem, UserCosmeticInventory } from '@cgraph/shared-types';
import { cosmeticsApi } from '../services/cosmetics-api';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CosmeticsState {
  /** Full catalogue of available cosmetics (shop). */
  catalogue: CosmeticItem[];
  /** User's owned cosmetic inventory. */
  inventory: UserCosmeticInventory[];
  /** Available filter values from the API. */
  availableThemes: string[];
  availableRarities: string[];
  /** Loading states. */
  isLoadingCatalogue: boolean;
  isLoadingInventory: boolean;
  isEquipping: boolean;
  /** Error message. */
  error: string | null;

  // Actions
  fetchCatalogue: () => Promise<void>;
  fetchInventory: () => Promise<void>;
  equipItem: (item: CosmeticItem) => Promise<void>;
  unequipItem: (item: CosmeticItem) => Promise<void>;
  purchaseItem: (item: CosmeticItem) => Promise<void>;
  reset: () => void;
}

// ---------------------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------------------

const initialState: Omit<
  CosmeticsState,
  'fetchCatalogue' | 'fetchInventory' | 'equipItem' | 'unequipItem' | 'purchaseItem' | 'reset'
> = {
  catalogue: [],
  inventory: [],
  availableThemes: [],
  availableRarities: [],
  isLoadingCatalogue: false,
  isLoadingInventory: false,
  isEquipping: false,
  error: null,
};

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useCosmeticsStore = create<CosmeticsState>()((set, get) => ({
  ...initialState,

  fetchCatalogue: async () => {
    set({ isLoadingCatalogue: true, error: null });
    try {
      const [bordersResult, themesResult] = await Promise.all([
        cosmeticsApi.listBorders(),
        cosmeticsApi.listProfileThemes(),
      ]);

      const catalogue = [...bordersResult.borders, ...themesResult.themes];

      set({
        catalogue,
        availableThemes: bordersResult.themes,
        availableRarities: bordersResult.rarities,
        isLoadingCatalogue: false,
      });
    } catch (err) {
      set({
        isLoadingCatalogue: false,
        error: err instanceof Error ? err.message : 'Failed to load cosmetics catalogue',
      });
    }
  },

  fetchInventory: async () => {
    set({ isLoadingInventory: true, error: null });
    try {
      const [bordersResult, effectsResult] = await Promise.all([
        cosmeticsApi.getUnlockedBorders(),
        cosmeticsApi.getChatEffects(),
      ]);

      // Also attempt to get active theme
      let themeInventory: UserCosmeticInventory[] = [];
      try {
        const activeTheme = await cosmeticsApi.getActiveTheme();
        if (activeTheme) {
          themeInventory = [activeTheme];
        }
      } catch {
        // Theme endpoint may not return data — that's fine
      }

      const inventory = [...bordersResult.inventory, ...effectsResult.effects, ...themeInventory];

      set({ inventory, isLoadingInventory: false });
    } catch (err) {
      set({
        isLoadingInventory: false,
        error: err instanceof Error ? err.message : 'Failed to load inventory',
      });
    }
  },

  equipItem: async (item: CosmeticItem) => {
    set({ isEquipping: true, error: null });
    try {
      if (item.type === 'border') {
        await cosmeticsApi.equipBorder(item.id);
      } else if (item.type === 'theme') {
        await cosmeticsApi.activateTheme(item.id);
      } else if (item.type === 'chat_bubble') {
        await cosmeticsApi.activateChatEffect(item.id);
      } else {
        await cosmeticsApi.equip(item.type, item.id);
      }

      // Optimistic update: mark this item as equipped in the inventory
      const { inventory } = get();
      set({
        inventory: inventory.map((entry) =>
          entry.cosmetic.id === item.id
            ? { ...entry, equipped: true }
            : entry.cosmetic.type === item.type
              ? { ...entry, equipped: false }
              : entry
        ),
        isEquipping: false,
      });
    } catch (err) {
      set({
        isEquipping: false,
        error: err instanceof Error ? err.message : 'Failed to equip item',
      });
    }
  },

  unequipItem: async (item: CosmeticItem) => {
    set({ isEquipping: true, error: null });
    try {
      await cosmeticsApi.unequip(item.type, item.id);

      // Optimistic update: mark this item as unequipped
      const { inventory } = get();
      set({
        inventory: inventory.map((entry) =>
          entry.cosmetic.id === item.id ? { ...entry, equipped: false } : entry
        ),
        isEquipping: false,
      });
    } catch (err) {
      set({
        isEquipping: false,
        error: err instanceof Error ? err.message : 'Failed to unequip item',
      });
    }
  },

  purchaseItem: async (item: CosmeticItem) => {
    set({ isEquipping: true, error: null });
    try {
      let newEntry: UserCosmeticInventory | undefined;

      if (item.type === 'border') {
        newEntry = await cosmeticsApi.purchaseBorder(item.id);
      } else {
        // For other types, use the unified equip endpoint
        await cosmeticsApi.equip(item.type, item.id);
        newEntry = {
          cosmetic: item,
          equipped: false,
          acquiredAt: new Date().toISOString(),
          source: 'purchase',
        };
      }

      if (newEntry) {
        const { inventory } = get();
        set({ inventory: [...inventory, newEntry], isEquipping: false });
      } else {
        set({ isEquipping: false });
      }
    } catch (err) {
      set({
        isEquipping: false,
        error: err instanceof Error ? err.message : 'Failed to purchase item',
      });
    }
  },

  reset: () => set(initialState),
}));
