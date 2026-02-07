import { create } from 'zustand';
import { createLogger } from '@/lib/logger';
const logger = createLogger('chatEffectsStore');
import { persist, createJSONStorage } from 'zustand/middleware';
import { safeLocalStorage } from '@/lib/safeStorage';
import { api } from '@/lib/api';

// Re-export types and presets for consumers
export * from './chatEffects.types';
export * from './chatEffects.presets';

import type {
  MessageEffect,
  BubbleStyle,
  BubbleStyleConfig,
  TypingIndicator,
  TypingIndicatorConfig,
  ChatEffectsState,
} from './chatEffects.types';

import {
  MESSAGE_EFFECT_PRESETS,
  BUBBLE_STYLE_PRESETS,
  TYPING_INDICATOR_PRESETS,
  SOUND_EFFECT_LIBRARY,
  MESSAGE_EFFECTS_LIST,
  BUBBLE_STYLES_LIST,
  TYPING_INDICATORS_LIST,
} from './chatEffects.presets';

// ==================== STORE IMPLEMENTATION ====================

export const useChatEffectsStore = create<ChatEffectsState>()(
  persist(
    (set, get) => ({
      // Default active effects
      activeMessageEffect: { effect: 'fade-in', intensity: 'low', duration: 400 },
      activeBubbleStyle: BUBBLE_STYLE_PRESETS.default as BubbleStyleConfig & { style: BubbleStyle },
      activeEmojiPack: 'default',
      activeTypingIndicator: TYPING_INDICATOR_PRESETS.dots as TypingIndicatorConfig & {
        style: TypingIndicator;
      },
      activeReactionConfig: { animation: 'pop', scale: 1.2, duration: 300, sound: true },

      // Sound defaults
      soundEffects: SOUND_EFFECT_LIBRARY,
      masterVolume: 0.7,
      soundsEnabled: true,

      // Empty unlocks
      unlockedEffects: [],

      // Settings
      reduceMotion: false,
      showEffectsInCompactMode: false,
      autoPlayEffects: true,

      // Preview
      previewEffect: null,
      previewBubble: null,

      // Sync
      lastSyncedAt: null,
      isSyncing: false,

      // Available effects for CosmeticsSettingsPanel
      messageEffects: MESSAGE_EFFECTS_LIST,
      bubbleStyles: BUBBLE_STYLES_LIST,
      typingIndicators: TYPING_INDICATORS_LIST,

      // Activation actions for CosmeticsSettingsPanel
      activateEffect: (id: MessageEffect) => {
        get().setMessageEffect(id);
      },

      activateBubbleStyle: (id: BubbleStyle) => {
        get().setBubbleStyle(id);
      },

      activateTypingIndicator: (id: TypingIndicator) => {
        get().setTypingIndicator(id);
      },

      // Message effect actions
      setMessageEffect: (effect, config) => {
        const preset = MESSAGE_EFFECT_PRESETS[effect];
        set({
          activeMessageEffect: {
            effect,
            intensity: config?.intensity ?? preset.intensity,
            duration: config?.duration ?? preset.duration,
            particleCount: config?.particleCount ?? preset.particleCount,
            color: config?.color ?? preset.color,
            sound: config?.sound ?? preset.sound,
          },
        });
      },

      // Bubble style actions
      setBubbleStyle: (style, config) => {
        const preset = BUBBLE_STYLE_PRESETS[style];
        set({
          activeBubbleStyle: {
            style,
            backgroundColor: config?.backgroundColor ?? preset.backgroundColor,
            textColor: config?.textColor ?? preset.textColor,
            borderColor: config?.borderColor ?? preset.borderColor,
            borderWidth: config?.borderWidth ?? preset.borderWidth,
            borderRadius: config?.borderRadius ?? preset.borderRadius,
            shadow: config?.shadow ?? preset.shadow,
            gradient: config?.gradient ?? preset.gradient,
            glow: config?.glow ?? preset.glow,
          },
        });
      },

      setEmojiPack: (pack) => set({ activeEmojiPack: pack }),

      setTypingIndicator: (style, config) => {
        const preset = TYPING_INDICATOR_PRESETS[style];
        set({
          activeTypingIndicator: {
            style,
            color: config?.color ?? preset.color,
            speed: config?.speed ?? preset.speed,
            size: config?.size ?? preset.size,
          },
        });
      },

      setReactionConfig: (config) =>
        set((state) => ({
          activeReactionConfig: { ...state.activeReactionConfig, ...config },
        })),

      // Sound actions
      setSoundEffect: (id, updates) =>
        set((state) => ({
          soundEffects: state.soundEffects.map((sound) =>
            sound.id === id ? { ...sound, ...updates } : sound
          ),
        })),

      setMasterVolume: (volume) => set({ masterVolume: Math.max(0, Math.min(1, volume)) }),

      toggleSounds: () => set((state) => ({ soundsEnabled: !state.soundsEnabled })),

      playSound: (id) => {
        const state = get();
        if (!state.soundsEnabled) return;

        const sound = state.soundEffects.find((s) => s.id === id);
        if (!sound || !sound.enabled) return;

        try {
          const audio = new Audio(sound.url);
          audio.volume = sound.volume * state.masterVolume;
          audio.play().catch(() => {});
        } catch {
          // Ignore audio errors
        }
      },

      // Unlock actions
      unlockEffect: (effect) =>
        set((state) => {
          if (state.unlockedEffects.some((e) => e.id === effect.id && e.type === effect.type)) {
            return state;
          }
          return { unlockedEffects: [...state.unlockedEffects, effect] };
        }),

      isEffectUnlocked: (id, type) => {
        const state = get();
        const effect = state.unlockedEffects.find((e) => e.id === id && e.type === type);
        if (!effect) return false;
        if (effect.expiresAt && new Date(effect.expiresAt) < new Date()) return false;
        return true;
      },

      getUnlockedByType: (type) => {
        const state = get();
        const now = new Date();
        return state.unlockedEffects.filter(
          (e) => e.type === type && (!e.expiresAt || new Date(e.expiresAt) > now)
        );
      },

      // Settings actions
      setReduceMotion: (reduce) => set({ reduceMotion: reduce }),
      toggleCompactModeEffects: () =>
        set((state) => ({ showEffectsInCompactMode: !state.showEffectsInCompactMode })),
      toggleAutoPlay: () => set((state) => ({ autoPlayEffects: !state.autoPlayEffects })),

      // Preview actions
      setPreviewEffect: (effect) => set({ previewEffect: effect }),
      setPreviewBubble: (style) => set({ previewBubble: style }),

      // Sync actions
      syncWithServer: async () => {
        const state = get();
        set({ isSyncing: true });
        try {
          await api.post('/api/v1/chat-effects/sync', {
            messageEffect: state.activeMessageEffect,
            bubbleStyle: state.activeBubbleStyle,
            emojiPack: state.activeEmojiPack,
            typingIndicator: state.activeTypingIndicator,
            reactionConfig: state.activeReactionConfig,
            soundSettings: {
              effects: state.soundEffects,
              masterVolume: state.masterVolume,
              enabled: state.soundsEnabled,
            },
            settings: {
              reduceMotion: state.reduceMotion,
              showEffectsInCompactMode: state.showEffectsInCompactMode,
              autoPlayEffects: state.autoPlayEffects,
            },
          });
          set({ lastSyncedAt: new Date().toISOString() });
        } catch (error) {
          logger.error('Failed to sync chat effects:', error);
        } finally {
          set({ isSyncing: false });
        }
      },

      loadFromServer: async () => {
        set({ isSyncing: true });
        try {
          const response = await api.get('/api/v1/chat-effects');
          if (response.data) {
            const data = response.data;
            set({
              activeMessageEffect: data.messageEffect ?? get().activeMessageEffect,
              activeBubbleStyle: data.bubbleStyle ?? get().activeBubbleStyle,
              activeEmojiPack: data.emojiPack ?? 'default',
              activeTypingIndicator: data.typingIndicator ?? get().activeTypingIndicator,
              activeReactionConfig: data.reactionConfig ?? get().activeReactionConfig,
              unlockedEffects: data.unlockedEffects ?? [],
              soundEffects: data.soundSettings?.effects ?? SOUND_EFFECT_LIBRARY,
              masterVolume: data.soundSettings?.masterVolume ?? 0.7,
              soundsEnabled: data.soundSettings?.enabled ?? true,
              reduceMotion: data.settings?.reduceMotion ?? false,
              showEffectsInCompactMode: data.settings?.showEffectsInCompactMode ?? false,
              autoPlayEffects: data.settings?.autoPlayEffects ?? true,
              lastSyncedAt: new Date().toISOString(),
            });
          }
        } catch (error) {
          logger.error('Failed to load chat effects from server:', error);
        } finally {
          set({ isSyncing: false });
        }
      },
    }),
    {
      name: 'cgraph-chat-effects',
      storage: createJSONStorage(() => safeLocalStorage),
      partialize: (state) => ({
        activeMessageEffect: state.activeMessageEffect,
        activeBubbleStyle: state.activeBubbleStyle,
        activeEmojiPack: state.activeEmojiPack,
        activeTypingIndicator: state.activeTypingIndicator,
        activeReactionConfig: state.activeReactionConfig,
        soundEffects: state.soundEffects,
        masterVolume: state.masterVolume,
        soundsEnabled: state.soundsEnabled,
        unlockedEffects: state.unlockedEffects,
        reduceMotion: state.reduceMotion,
        showEffectsInCompactMode: state.showEffectsInCompactMode,
        autoPlayEffects: state.autoPlayEffects,
        lastSyncedAt: state.lastSyncedAt,
      }),
    }
  )
);

// ==================== SELECTOR HOOKS ====================

export const useActiveMessageEffect = () =>
  useChatEffectsStore((state) => state.activeMessageEffect);

export const useActiveBubbleStyle = () => useChatEffectsStore((state) => state.activeBubbleStyle);

export const useActiveEmojiPack = () => useChatEffectsStore((state) => state.activeEmojiPack);

export const useChatSoundSettings = () =>
  useChatEffectsStore((state) => ({
    effects: state.soundEffects,
    masterVolume: state.masterVolume,
    enabled: state.soundsEnabled,
    playSound: state.playSound,
  }));

export const useChatEffectSettings = () =>
  useChatEffectsStore((state) => ({
    reduceMotion: state.reduceMotion,
    showEffectsInCompactMode: state.showEffectsInCompactMode,
    autoPlayEffects: state.autoPlayEffects,
    effect: state.activeMessageEffect.effect,
    config: state.activeMessageEffect,
    enabled: state.autoPlayEffects,
  }));

export default useChatEffectsStore;
