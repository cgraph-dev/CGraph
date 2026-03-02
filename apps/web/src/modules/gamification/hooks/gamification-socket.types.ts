/**
 * Gamification Socket Types
 *
 * Type definitions for all gamification WebSocket events and state.
 */

// ==================== EVENT TYPES ====================

export interface XPGainEvent {
  amount: number;
  source: string;
  newTotal: number;
  levelUp?: {
    oldLevel: number;
    newLevel: number;
    rewards: Array<{ type: string; id: string; name: string }>;
  };
}

export interface AchievementUnlockEvent {
  achievementId: string;
  title: string;
  description: string;
  icon: string;
  rarity: string;
  xpReward: number;
  coinReward: number;
}

export interface CosmeticUnlockEvent {
  type: 'avatar_border' | 'profile_theme' | 'chat_effect' | 'title' | 'badge';
  itemId: string;
  name: string;
  rarity: string;
  previewUrl?: string;
}

export interface PrestigeUpdateEvent {
  oldLevel: number;
  newLevel: number;
  prestigePoints: number;
  newBonuses: {
    xpBonus: number;
    coinBonus: number;
    karmaBonus: number;
    dropRateBonus: number;
  };
  exclusiveRewards: Array<{ type: string; id: string; name: string }>;
}

export interface EventProgressEvent {
  eventId: string;
  eventName: string;
  points: number;
  tier: number;
  milestone?: {
    threshold: number;
    reward: { type: string; name: string };
  };
}

export interface MarketplaceNotificationEvent {
  type: 'listing_sold' | 'purchase_complete' | 'offer_received' | 'price_drop';
  data: Record<string, unknown>;
}

// ==================== XP PIPELINE EVENT TYPES ====================

export interface XPAwardedEvent {
  amount: number;
  source: string;
  total_xp: number;
  level: number;
  level_up: boolean;
  level_progress: number;
  daily_cap_status: {
    source: string;
    used: number;
    limit: number;
    remaining: number;
    diminishing_active: boolean;
  };
}

export interface CoinsAwardedEvent {
  amount: number;
  type: string;
  balance: number;
}

export interface CapReachedEvent {
  source: string;
  daily_used: number;
  daily_limit: number;
}

// ==================== STATE ====================

export interface GamificationState {
  xp: number;
  level: number;
  coins: number;
  streakDays: number;
  connected: boolean;
  lastError: string | null;
}

// ==================== STORE INTERFACE ====================

import type { Socket, Channel } from 'phoenix';

export interface GamificationSocketStore {
  socket: Socket | null;
  channel: Channel | null;
  state: GamificationState;
  listeners: Map<string, Set<(data: unknown) => void>>;
  messageQueue: Array<{ event: string; payload: unknown }>;

  // Actions
  connect: (token: string, userId: string) => void;
  disconnect: () => void;
  subscribe: (event: string, callback: (data: unknown) => void) => () => void;
  getState: () => Promise<GamificationState>;
  sendHeartbeat: () => void;
}
