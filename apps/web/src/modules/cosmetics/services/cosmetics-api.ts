/**
 * Cosmetics API service.
 *
 * Connects the frontend to the backend CosmeticsController endpoints.
 * Backend serializers already return camelCase, so minimal transformation needed.
 *
 * @module cosmetics/services/cosmetics-api
 */

import { api as apiClient } from '@/lib/api';
import type {
  CosmeticItem,
  CosmeticType,
  UserCosmeticInventory,
  RarityTier,
  AnimationType,
  UnlockType,
} from '@cgraph/shared-types';

// ---------------------------------------------------------------------------
// API response types (match backend serializer output)
// ---------------------------------------------------------------------------

interface ApiBorder {
  id: string;
  slug: string;
  name: string;
  description: string;
  theme: string;
  rarity: RarityTier;
  borderStyle: string;
  animationType: string;
  animationSpeed: number;
  animationIntensity: number;
  colors: string[];
  particleConfig: Record<string, unknown> | null;
  glowConfig: Record<string, unknown> | null;
  isPurchasable: boolean;
  coinCost: number;
  gemCost: number;
  previewUrl: string | null;
  lottieUrl?: string;
  lottieAssetId?: string;
  lottieConfig?: Record<string, unknown>;
}

interface ApiUserBorder {
  id: string;
  borderId: string;
  isEquipped: boolean;
  unlockSource: string;
  expiresAt: string | null;
  customColors: string[] | null;
  border: ApiBorder | null;
}

interface ApiProfileTheme {
  id: string;
  slug: string;
  name: string;
  description: string;
  preset: string;
  rarity: RarityTier;
  colors: Record<string, unknown>;
  backgroundType: string;
  backgroundConfig: Record<string, unknown>;
  layoutType: string;
  hoverEffect: string;
  glassmorphism: boolean;
  borderRadius: string;
  fontFamily: string;
  isPurchasable: boolean;
  coinCost: number;
  gemCost: number;
  previewUrl: string | null;
}

interface ApiUserProfileTheme {
  id: string;
  themeId: string;
  isActive: boolean;
  unlockSource: string;
  expiresAt: string | null;
  customColors: Record<string, unknown> | null;
  customBackground: Record<string, unknown> | null;
  customLayout: Record<string, unknown> | null;
  customEffects: Record<string, unknown> | null;
  theme: ApiProfileTheme | null;
}

interface ApiChatEffect {
  id: string;
  slug: string;
  name: string;
  effectType: string;
  effectId: string;
  rarity: RarityTier;
  config: Record<string, unknown>;
}

interface ApiUserChatEffect {
  id: string;
  effectId: string;
  isActive: boolean;
  unlockSource: string;
  expiresAt: string | null;
  customConfig: Record<string, unknown> | null;
  effect: ApiChatEffect | null;
}

interface ApiInventoryItem {
  id: string;
  itemType: CosmeticType;
  itemId: string;
  equippedAt: string | null;
  obtainedAt: string;
  obtainedVia: string;
}

// ---------------------------------------------------------------------------
// Transformers — convert API responses to shared types
// ---------------------------------------------------------------------------

function borderToCosmeticItem(b: ApiBorder): CosmeticItem {
  return {
    id: b.id,
    slug: b.slug,
    name: b.name,
    description: b.description,
    surface: 'avatar_border',
    type: 'border',
    rarity: b.rarity,
    unlockType: b.isPurchasable ? 'purchase' : 'free',
    unlockCondition: { type: b.isPurchasable ? 'purchase' : 'free', threshold: b.coinCost },
    animationType: validateAnimationType(b.animationType),
    lottieFile: b.lottieUrl ?? null,
    previewUrl: b.previewUrl,
    colors: b.colors ?? [],
    available: true,
    createdAt: '',
  };
}

function themeToCosmeticItem(t: ApiProfileTheme): CosmeticItem {
  return {
    id: t.id,
    slug: t.slug,
    name: t.name,
    description: t.description,
    surface: 'avatar_border', // themes don't have a surface, use default
    type: 'theme',
    rarity: t.rarity,
    unlockType: t.isPurchasable ? 'purchase' : 'free',
    unlockCondition: { type: t.isPurchasable ? 'purchase' : 'free', threshold: t.coinCost },
    animationType: 'none',
    lottieFile: null,
    previewUrl: t.previewUrl,
    colors: [],
    available: true,
    createdAt: '',
  };
}

function effectToCosmeticItem(e: ApiChatEffect): CosmeticItem {
  return {
    id: e.id,
    slug: e.slug,
    name: e.name,
    description: '',
    surface: 'chat_bubble',
    type: 'chat_bubble',
    rarity: e.rarity,
    unlockType: 'free',
    unlockCondition: { type: 'free', threshold: null },
    animationType: 'none',
    lottieFile: null,
    previewUrl: null,
    colors: [],
    available: true,
    createdAt: '',
  };
}

function userBorderToInventory(ub: ApiUserBorder): UserCosmeticInventory {
  const cosmetic = ub.border
    ? borderToCosmeticItem(ub.border)
    : {
        id: ub.borderId,
        slug: '',
        name: 'Unknown Border',
        description: '',
        surface: 'avatar_border' as const,
        type: 'border' as const,
        rarity: 'common' as const,
        unlockType: 'free' as const,
        unlockCondition: { type: 'free' as const, threshold: null },
        animationType: 'none' as const,
        lottieFile: null,
        previewUrl: null,
        colors: [],
        available: true,
        createdAt: '',
      };

  return {
    cosmetic,
    equipped: ub.isEquipped,
    acquiredAt: '',
    source: validateUnlockType(ub.unlockSource),
  };
}

function userThemeToInventory(ut: ApiUserProfileTheme): UserCosmeticInventory {
  const cosmetic = ut.theme
    ? themeToCosmeticItem(ut.theme)
    : {
        id: ut.themeId,
        slug: '',
        name: 'Unknown Theme',
        description: '',
        surface: 'avatar_border' as const,
        type: 'theme' as const,
        rarity: 'common' as const,
        unlockType: 'free' as const,
        unlockCondition: { type: 'free' as const, threshold: null },
        animationType: 'none' as const,
        lottieFile: null,
        previewUrl: null,
        colors: [],
        available: true,
        createdAt: '',
      };

  return {
    cosmetic,
    equipped: ut.isActive,
    acquiredAt: '',
    source: validateUnlockType(ut.unlockSource),
  };
}

function userEffectToInventory(ue: ApiUserChatEffect): UserCosmeticInventory {
  const cosmetic = ue.effect
    ? effectToCosmeticItem(ue.effect)
    : {
        id: ue.effectId,
        slug: '',
        name: 'Unknown Effect',
        description: '',
        surface: 'chat_bubble' as const,
        type: 'chat_bubble' as const,
        rarity: 'common' as const,
        unlockType: 'free' as const,
        unlockCondition: { type: 'free' as const, threshold: null },
        animationType: 'none' as const,
        lottieFile: null,
        previewUrl: null,
        colors: [],
        available: true,
        createdAt: '',
      };

  return {
    cosmetic,
    equipped: ue.isActive,
    acquiredAt: '',
    source: validateUnlockType(ue.unlockSource),
  };
}

// ---------------------------------------------------------------------------
// Type validators
// ---------------------------------------------------------------------------

const VALID_ANIMATION_TYPES: readonly AnimationType[] = [
  'none',
  'lottie',
  'css',
  'sprite',
  'video',
];
const VALID_UNLOCK_TYPES: readonly UnlockType[] = [
  'free',
  'purchase',
  'achievement',
  'level',
  'event',
  'subscription',
  'gift',
  'admin',
];

function validateAnimationType(value: string | undefined | null): AnimationType {
  const v = value ?? 'none';
  const match = VALID_ANIMATION_TYPES.find((t) => t === v);
  return match ?? 'none';
}

function validateUnlockType(value: string | undefined | null): UnlockType {
  const v = value ?? 'free';
  const match = VALID_UNLOCK_TYPES.find((t) => t === v);
  return match ?? 'free';
}

// ---------------------------------------------------------------------------
// API service
// ---------------------------------------------------------------------------

export const cosmeticsApi = {
  // ── Borders ─────────────────────────────────────────────────────────

  async listBorders(params?: {
    theme?: string;
    rarity?: RarityTier;
    animation_type?: string;
  }): Promise<{
    borders: CosmeticItem[];
    themes: string[];
    rarities: string[];
  }> {
    const response = await apiClient.get('/api/v1/avatar-borders', { params });
    const data = response.data;
    return {
      borders: (data.borders ?? []).map(borderToCosmeticItem),
      themes: data.themes ?? [],
      rarities: data.rarities ?? [],
    };
  },

  async getUnlockedBorders(): Promise<{
    inventory: UserCosmeticInventory[];
    equippedId: string | null;
  }> {
    const response = await apiClient.get('/api/v1/avatar-borders/unlocked');
    const data = response.data;
    return {
      inventory: (data.unlocked ?? []).map(userBorderToInventory),
      equippedId: data.equipped_id ?? null,
    };
  },

  async equipBorder(borderId: string): Promise<UserCosmeticInventory> {
    const response = await apiClient.post(`/api/v1/avatar-borders/${borderId}/equip`);
    return userBorderToInventory(response.data.equipped);
  },

  async purchaseBorder(borderId: string): Promise<UserCosmeticInventory> {
    const response = await apiClient.post(`/api/v1/avatar-borders/${borderId}/purchase`);
    return userBorderToInventory(response.data.unlocked);
  },

  // ── Profile Themes ──────────────────────────────────────────────────

  async listProfileThemes(params?: { preset?: string; rarity?: RarityTier }): Promise<{
    themes: CosmeticItem[];
    presets: string[];
    rarities: string[];
  }> {
    const response = await apiClient.get('/api/v1/profile-themes', { params });
    const data = response.data;
    return {
      themes: (data.themes ?? []).map(themeToCosmeticItem),
      presets: data.presets ?? [],
      rarities: data.rarities ?? [],
    };
  },

  async getActiveTheme(): Promise<UserCosmeticInventory | null> {
    const response = await apiClient.get('/api/v1/profile-themes/active');
    const data = response.data;
    return data.theme ? userThemeToInventory(data.theme) : null;
  },

  async activateTheme(themeId: string): Promise<UserCosmeticInventory> {
    const response = await apiClient.post(`/api/v1/profile-themes/${themeId}/activate`);
    return userThemeToInventory(response.data.theme);
  },

  // ── Chat Effects ────────────────────────────────────────────────────

  async getChatEffects(): Promise<{
    effects: UserCosmeticInventory[];
    activeEffectIds: string[];
  }> {
    const response = await apiClient.get('/api/v1/chat-effects');
    const data = response.data;
    return {
      effects: (data.unlockedEffects ?? []).map(userEffectToInventory),
      activeEffectIds: data.activeEffects ?? [],
    };
  },

  async activateChatEffect(effectId: string): Promise<UserCosmeticInventory> {
    const response = await apiClient.post(`/api/v1/chat-effects/${effectId}/activate`);
    return userEffectToInventory(response.data.effect);
  },

  // ── Unified Inventory ───────────────────────────────────────────────

  async getInventory(itemType?: CosmeticType): Promise<{
    items: ApiInventoryItem[];
    total: number;
  }> {
    const response = await apiClient.get('/api/v1/cosmetics/inventory', {
      params: itemType ? { item_type: itemType } : undefined,
    });
    const data = response.data;
    return {
      items: data.items ?? [],
      total: data.total ?? 0,
    };
  },

  async equip(itemType: CosmeticType, itemId: string): Promise<ApiInventoryItem> {
    const response = await apiClient.put('/api/v1/cosmetics/equip', {
      item_type: itemType,
      item_id: itemId,
    });
    return response.data.equipped;
  },

  async unequip(itemType: CosmeticType, itemId: string): Promise<ApiInventoryItem> {
    const response = await apiClient.delete('/api/v1/cosmetics/unequip', {
      data: { item_type: itemType, item_id: itemId },
    });
    return response.data.unequipped;
  },
};
