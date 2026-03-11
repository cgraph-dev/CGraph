/**
 * Chat Effects Store — manages chat visual effects preferences.
 *
 * Persists settings via AsyncStorage with manual hydration.
 *
 * @module stores/chatEffectsStore
 */

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Available chat visual effects. */
export type ChatEffect =
  | 'confetti'
  | 'fireworks'
  | 'hearts'
  | 'snow'
  | 'rain'
  | 'bubbles'
  | 'stars'
  | 'none';

/** Intensity level for chat effects. */
export type EffectIntensity = 'low' | 'medium' | 'high';

interface ChatEffectsState {
  readonly activeEffect: ChatEffect;
  readonly sendEffects: boolean;
  readonly receiveEffects: boolean;
  readonly effectIntensity: EffectIntensity;
  readonly isLoading: boolean;
  readonly error: string | null;
}

interface ChatEffectsActions {
  readonly setEffect: (effect: ChatEffect) => void;
  readonly toggleSendEffects: () => void;
  readonly toggleReceiveEffects: () => void;
  readonly setIntensity: (intensity: EffectIntensity) => void;
  readonly hydrate: () => Promise<void>;
  readonly reset: () => void;
}

type ChatEffectsStore = ChatEffectsState & ChatEffectsActions;

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STORAGE_KEY = '@cgraph/chat-effects';

interface PersistedData {
  activeEffect?: ChatEffect;
  sendEffects?: boolean;
  receiveEffects?: boolean;
  effectIntensity?: EffectIntensity;
}

/** Validate that a value is a known ChatEffect. */
function isChatEffect(value: unknown): value is ChatEffect {
  const valid: readonly string[] = [
    'confetti',
    'fireworks',
    'hearts',
    'snow',
    'rain',
    'bubbles',
    'stars',
    'none',
  ];
  return typeof value === 'string' && valid.includes(value);
}

/** Validate that a value is a known EffectIntensity. */
function isEffectIntensity(value: unknown): value is EffectIntensity {
  const valid: readonly string[] = ['low', 'medium', 'high'];
  return typeof value === 'string' && valid.includes(value);
}

/** Persist current state to AsyncStorage. */
async function persist(state: ChatEffectsState): Promise<void> {
  const data: PersistedData = {
    activeEffect: state.activeEffect,
    sendEffects: state.sendEffects,
    receiveEffects: state.receiveEffects,
    effectIntensity: state.effectIntensity,
  };
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data)).catch(() => {});
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useChatEffectsStore = create<ChatEffectsStore>((set, get) => ({
  activeEffect: 'none',
  sendEffects: true,
  receiveEffects: true,
  effectIntensity: 'medium',
  isLoading: false,
  error: null,

  setEffect: (effect: ChatEffect) => {
    set({ activeEffect: effect, error: null });
    void persist(get());
  },

  toggleSendEffects: () => {
    set((s) => ({ sendEffects: !s.sendEffects, error: null }));
    void persist(get());
  },

  toggleReceiveEffects: () => {
    set((s) => ({ receiveEffects: !s.receiveEffects, error: null }));
    void persist(get());
  },

  setIntensity: (intensity: EffectIntensity) => {
    set({ effectIntensity: intensity, error: null });
    void persist(get());
  },

  hydrate: async () => {
    set({ isLoading: true, error: null });
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          const data = /** @type {Record<string, unknown>} */ Object(parsed);
          set({
            activeEffect: isChatEffect(data.activeEffect) ? data.activeEffect : 'none',
            sendEffects: typeof data.sendEffects === 'boolean' ? data.sendEffects : true,
            receiveEffects: typeof data.receiveEffects === 'boolean' ? data.receiveEffects : true,
            effectIntensity: isEffectIntensity(data.effectIntensity)
              ? data.effectIntensity
              : 'medium',
          });
        }
      }
    } catch {
      set({ error: 'Failed to load chat effects settings' });
    } finally {
      set({ isLoading: false });
    }
  },

  reset: () => {
    set({
      activeEffect: 'none',
      sendEffects: true,
      receiveEffects: true,
      effectIntensity: 'medium',
      isLoading: false,
      error: null,
    });
    void AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
  },
}));

// ---------------------------------------------------------------------------
// Selectors
// ---------------------------------------------------------------------------

/** Select the active effect. */
export const useActiveEffect = () => useChatEffectsStore((s) => s.activeEffect);

/** Select whether send effects are enabled. */
export const useSendEffects = () => useChatEffectsStore((s) => s.sendEffects);

/** Select whether receive effects are enabled. */
export const useReceiveEffects = () => useChatEffectsStore((s) => s.receiveEffects);

/** Select the effect intensity. */
export const useEffectIntensity = () => useChatEffectsStore((s) => s.effectIntensity);
