import { useEffect, useCallback, useRef } from 'react';
import { create } from 'zustand';
import { Socket, Channel } from 'phoenix';

/**
 * Gamification WebSocket Hook
 * 
 * Provides real-time updates for:
 * - XP/Level gains
 * - Achievement unlocks
 * - Cosmetic unlocks
 * - Prestige updates
 * - Event progress
 * - Marketplace notifications
 * 
 * Designed for scale with:
 * - Automatic reconnection with exponential backoff
 * - Message queuing during disconnection
 * - Heartbeat monitoring
 * - Event batching
 */

// ==================== TYPES ====================

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

export interface GamificationState {
  xp: number;
  level: number;
  coins: number;
  streakDays: number;
  connected: boolean;
  lastError: string | null;
}

// ==================== STORE ====================

interface GamificationSocketStore {
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

const SOCKET_URL = import.meta.env.VITE_WS_URL || 'wss://api.cgraph.io/socket';
const RECONNECT_DELAYS = [1000, 2000, 4000, 8000, 16000, 32000];

export const useGamificationSocketStore = create<GamificationSocketStore>((set, get) => ({
  socket: null,
  channel: null,
  state: {
    xp: 0,
    level: 1,
    coins: 0,
    streakDays: 0,
    connected: false,
    lastError: null,
  },
  listeners: new Map(),
  messageQueue: [],

  connect: (token: string, userId: string) => {
    const existing = get().socket;
    if (existing?.isConnected()) {
      return;
    }

    const socket = new Socket(SOCKET_URL, {
      params: { token },
      reconnectAfterMs: (tries) => RECONNECT_DELAYS[Math.min(tries - 1, RECONNECT_DELAYS.length - 1)],
      heartbeatIntervalMs: 30000,
    });

    socket.onError((error) => {
      console.error('[GamificationSocket] Error:', error);
      set((state) => ({
        state: { ...state.state, lastError: 'Connection error', connected: false },
      }));
    });

    socket.onClose(() => {
      set((state) => ({
        state: { ...state.state, connected: false },
      }));
    });

    socket.connect();

    const channel = socket.channel(`gamification:${userId}`, {});

    channel
      .join()
      .receive('ok', (response) => {
        console.log('[GamificationSocket] Joined successfully', response);
        set((state) => ({
          state: { ...state.state, connected: true, lastError: null },
        }));
        
        // Flush queued messages
        const queue = get().messageQueue;
        queue.forEach(({ event, payload }) => {
          channel.push(event, payload);
        });
        set({ messageQueue: [] });
      })
      .receive('error', (error) => {
        console.error('[GamificationSocket] Join failed:', error);
        set((state) => ({
          state: { ...state.state, lastError: error.reason || 'Join failed' },
        }));
      });

    // Set up event listeners
    const events = [
      'initial_state',
      'xp_gained',
      'level_up',
      'achievement_unlocked',
      'cosmetic_unlocked',
      'prestige_updated',
      'event_progress',
      'event_milestone',
      'event_started',
      'event_ending_soon',
      'event_ended',
      'listing_sold',
      'item_purchased',
      'price_alert',
    ];

    events.forEach((event) => {
      channel.on(event, (payload) => {
        // Update internal state for initial_state
        if (event === 'initial_state') {
          set((state) => ({
            state: {
              ...state.state,
              xp: payload.xp ?? state.state.xp,
              level: payload.level ?? state.state.level,
              coins: payload.coins ?? state.state.coins,
              streakDays: payload.streak_days ?? state.state.streakDays,
            },
          }));
        }

        // Notify all listeners
        const listeners = get().listeners.get(event);
        if (listeners) {
          listeners.forEach((callback) => callback(payload));
        }

        // Also notify wildcard listeners
        const wildcardListeners = get().listeners.get('*');
        if (wildcardListeners) {
          wildcardListeners.forEach((callback) => callback({ event, payload }));
        }
      });
    });

    set({ socket, channel });
  },

  disconnect: () => {
    const { socket, channel } = get();
    
    if (channel) {
      channel.leave();
    }
    
    if (socket) {
      socket.disconnect();
    }
    
    set({
      socket: null,
      channel: null,
      state: { ...get().state, connected: false },
    });
  },

  subscribe: (event: string, callback: (data: unknown) => void) => {
    const listeners = get().listeners;
    
    if (!listeners.has(event)) {
      listeners.set(event, new Set());
    }
    
    listeners.get(event)!.add(callback);
    set({ listeners: new Map(listeners) });

    // Return unsubscribe function
    return () => {
      const currentListeners = get().listeners;
      const eventListeners = currentListeners.get(event);
      if (eventListeners) {
        eventListeners.delete(callback);
        if (eventListeners.size === 0) {
          currentListeners.delete(event);
        }
        set({ listeners: new Map(currentListeners) });
      }
    };
  },

  getState: async () => {
    const { channel, state } = get();
    
    if (!channel) {
      return state;
    }

    return new Promise((resolve) => {
      channel
        .push('get_state', {})
        .receive('ok', (response) => {
          const newState = {
            ...state,
            xp: response.xp ?? state.xp,
            level: response.level ?? state.level,
            coins: response.coins ?? state.coins,
            streakDays: response.streak_days ?? state.streakDays,
          };
          set({ state: newState });
          resolve(newState);
        })
        .receive('error', () => resolve(state))
        .receive('timeout', () => resolve(state));
    });
  },

  sendHeartbeat: () => {
    const { channel } = get();
    if (channel) {
      channel.push('heartbeat', {});
    }
  },
}));

// ==================== HOOKS ====================

export function useGamificationSocket(token: string | null, userId: string | null) {
  const { connect, disconnect, state } = useGamificationSocketStore();
  
  useEffect(() => {
    if (token && userId) {
      connect(token, userId);
    }
    
    return () => {
      disconnect();
    };
  }, [token, userId, connect, disconnect]);
  
  return state;
}

export function useGamificationEvent<T = unknown>(
  event: string,
  callback: (data: T) => void
) {
  const subscribe = useGamificationSocketStore((state) => state.subscribe);
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    const unsubscribe = subscribe(event, (data) => {
      callbackRef.current(data as T);
    });
    
    return unsubscribe;
  }, [event, subscribe]);
}

export function useXPUpdates(callback: (data: XPGainEvent) => void) {
  useGamificationEvent('xp_gained', callback);
}

export function useLevelUp(callback: (data: { oldLevel: number; newLevel: number; rewards: unknown[] }) => void) {
  useGamificationEvent('level_up', callback);
}

export function useAchievementUnlock(callback: (data: AchievementUnlockEvent) => void) {
  useGamificationEvent('achievement_unlocked', callback);
}

export function useCosmeticUnlock(callback: (data: CosmeticUnlockEvent) => void) {
  useGamificationEvent('cosmetic_unlocked', callback);
}

export function usePrestigeUpdate(callback: (data: PrestigeUpdateEvent) => void) {
  useGamificationEvent('prestige_updated', callback);
}

export function useEventProgress(callback: (data: EventProgressEvent) => void) {
  useGamificationEvent('event_progress', callback);
}

export function useEventMilestone(callback: (data: { eventId: string; milestone: number; reward: unknown }) => void) {
  useGamificationEvent('event_milestone', callback);
}

export function useEventAnnouncements(
  callbacks: {
    onStart?: (data: { eventId: string; name: string }) => void;
    onEndingSoon?: (data: { eventId: string; hoursRemaining: number }) => void;
    onEnd?: (data: { eventId: string; name: string }) => void;
  }
) {
  useGamificationEvent('event_started', callbacks.onStart || (() => {}));
  useGamificationEvent('event_ending_soon', callbacks.onEndingSoon || (() => {}));
  useGamificationEvent('event_ended', callbacks.onEnd || (() => {}));
}

export function useMarketplaceNotifications(callback: (data: MarketplaceNotificationEvent) => void) {
  useGamificationEvent('listing_sold', (data) => 
    callback({ type: 'listing_sold', data: data as Record<string, unknown> })
  );
  useGamificationEvent('item_purchased', (data) => 
    callback({ type: 'purchase_complete', data: data as Record<string, unknown> })
  );
  useGamificationEvent('price_alert', (data) => 
    callback({ type: 'price_drop', data: data as Record<string, unknown> })
  );
}

// ==================== NOTIFICATION TOAST HOOK ====================

export function useGamificationToasts() {
  const showToast = useCallback((
    type: 'xp' | 'level' | 'achievement' | 'cosmetic' | 'prestige' | 'event',
    data: unknown
  ) => {
    // This should integrate with your toast/notification system
    // For now, dispatch a custom event that can be caught by a toast provider
    window.dispatchEvent(new CustomEvent('gamification:toast', {
      detail: { type, data }
    }));
  }, []);

  useXPUpdates((data) => {
    if (data.amount >= 100) { // Only show for significant gains
      showToast('xp', data);
    }
    if (data.levelUp) {
      showToast('level', data.levelUp);
    }
  });

  useAchievementUnlock((data) => {
    showToast('achievement', data);
  });

  useCosmeticUnlock((data) => {
    showToast('cosmetic', data);
  });

  usePrestigeUpdate((data) => {
    showToast('prestige', data);
  });

  useEventMilestone((data) => {
    showToast('event', data);
  });
}

export default useGamificationSocket;
