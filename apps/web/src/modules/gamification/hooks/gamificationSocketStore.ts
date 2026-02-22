/**
 * Gamification Socket Store
 *
 * Zustand store managing the Phoenix WebSocket connection for gamification.
 * Provides:
 * - Automatic reconnection with exponential backoff
 * - Message queuing during disconnection
 * - Heartbeat monitoring
 * - Listener management
 */

import { create } from 'zustand';
import { Socket } from 'phoenix';
import { exponentialBackoffWithJitter } from '@cgraph/socket';
import { createLogger } from '@/lib/logger';
import type { GamificationSocketStore, GamificationState } from './gamification-socket.types';

const logger = createLogger('GamificationSocket');

const SOCKET_URL = import.meta.env.VITE_WS_URL || 'wss://cgraph-backend.fly.dev/socket';

const CHANNEL_EVENTS = [
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
] as const;

const DEFAULT_STATE: GamificationState = {
  xp: 0,
  level: 1,
  coins: 0,
  streakDays: 0,
  connected: false,
  lastError: null,
};

function handleInitialState(
  payload: Record<string, unknown>,
  currentState: GamificationState
): GamificationState {
  return {
    ...currentState,
    xp: (payload.xp as number) ?? currentState.xp,
    level: (payload.level as number) ?? currentState.level,
    coins: (payload.coins as number) ?? currentState.coins,
    streakDays: (payload.streak_days as number) ?? currentState.streakDays,
  };
}

function notifyListeners(
  listeners: Map<string, Set<(data: unknown) => void>>,
  event: string,
  payload: unknown
) {
  const eventListeners = listeners.get(event);
  if (eventListeners) {
    eventListeners.forEach((callback) => callback(payload));
  }

  // Also notify wildcard listeners
  const wildcardListeners = listeners.get('*');
  if (wildcardListeners) {
    wildcardListeners.forEach((callback) => callback({ event, payload }));
  }
}

export const useGamificationSocketStore = create<GamificationSocketStore>((set, get) => ({
  socket: null,
  channel: null,
  state: { ...DEFAULT_STATE },
  listeners: new Map(),
  messageQueue: [],

  connect: (token: string, userId: string) => {
    const existing = get().socket;
    if (existing?.isConnected()) {
      return;
    }

    const socket = new Socket(SOCKET_URL, {
      params: { token },
      // Exponential backoff with equal jitter — prevents thundering herd at scale
      reconnectAfterMs: exponentialBackoffWithJitter(),
      heartbeatIntervalMs: 30000,
    });

    socket.onError((error) => {
      logger.error('Socket error:', error);
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
      .receive('ok', (response: unknown) => {
        logger.debug('Joined successfully', response);
        set((state) => ({
          state: { ...state.state, connected: true, lastError: null },
        }));

        // Flush queued messages
        const queue = get().messageQueue;
        queue.forEach(({ event, payload }) => {
          channel.push(event, payload as Record<string, unknown>);
        });
        set({ messageQueue: [] });
      })
      .receive('error', (err: unknown) => {
        const error = err as Record<string, unknown>;
        logger.error('Join failed:', error);
        set((state) => ({
          state: { ...state.state, lastError: (error.reason as string) || 'Join failed' },
        }));
      });

    // Set up event listeners
    CHANNEL_EVENTS.forEach((event) => {
      channel.on(event, (p: unknown) => {
        const payload = p as Record<string, unknown>;

        if (event === 'initial_state') {
          set((state) => ({
            state: handleInitialState(payload, state.state),
          }));
        }

        notifyListeners(get().listeners, event, payload);
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
    const { listeners } = get();

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
        .receive('ok', (res: unknown) => {
          const response = res as Record<string, unknown>;
          const newState = {
            ...state,
            xp: (response.xp as number) ?? state.xp,
            level: (response.level as number) ?? state.level,
            coins: (response.coins as number) ?? state.coins,
            streakDays: (response.streak_days as number) ?? state.streakDays,
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
  reset: () => set({
    socket: null,
    channel: null,
    state: { ...DEFAULT_STATE },
    listeners: new Map(),
    messageQueue: [],
  }),
}));
