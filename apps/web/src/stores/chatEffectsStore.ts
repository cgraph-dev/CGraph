import { create } from 'zustand';
import { createLogger } from '@/lib/logger';
const logger = createLogger('chatEffectsStore');
import { persist, createJSONStorage } from 'zustand/middleware';
import { safeLocalStorage } from '@/lib/safeStorage';
import { api } from '@/lib/api';

/**
 * Chat Effects Store
 *
 * Complete chat customization system with:
 * - 30+ message effects
 * - 15 bubble styles
 * - 20 emoji packs
 * - Typing indicators
 * - Sound effects
 * - Reaction animations
 */

// ==================== TYPE DEFINITIONS ====================

export type MessageEffect =
  | 'none'
  | 'confetti'
  | 'fireworks'
  | 'sparkle'
  | 'rainbow'
  | 'hearts'
  | 'stars'
  | 'snow'
  | 'fire'
  | 'electric'
  | 'glitch'
  | 'matrix'
  | 'bubble'
  | 'shake'
  | 'bounce'
  | 'fade-in'
  | 'slide-in'
  | 'zoom'
  | 'flip'
  | 'typewriter'
  | 'neon-glow'
  | 'holographic'
  | 'plasma'
  | 'aurora'
  | 'cosmic'
  | 'sakura'
  | 'rain'
  | 'thunder'
  | 'explosion'
  | 'portal';

export type BubbleStyle =
  | 'default'
  | 'rounded'
  | 'square'
  | 'cloud'
  | 'thought'
  | 'comic'
  | 'neon'
  | 'glass'
  | 'gradient'
  | 'outlined'
  | 'shadowed'
  | 'retro'
  | 'pixel'
  | 'futuristic'
  | 'organic';

export type EmojiPack =
  | 'default'
  | 'kawaii'
  | 'pixel'
  | 'animated'
  | 'neon'
  | 'retro'
  | 'fantasy'
  | 'gaming'
  | 'animals'
  | 'food'
  | 'sports'
  | 'nature'
  | 'tech'
  | 'flags'
  | 'memes'
  | 'seasonal'
  | 'custom';

export type TypingIndicator =
  | 'dots'
  | 'wave'
  | 'bounce'
  | 'pulse'
  | 'typing-text'
  | 'pencil'
  | 'speech-bubble'
  | 'custom';

export type ReactionAnimation =
  | 'pop'
  | 'bounce'
  | 'float'
  | 'explode'
  | 'spin'
  | 'shake'
  | 'glow'
  | 'rainbow';

export interface MessageEffectConfig {
  effect: MessageEffect;
  intensity: 'low' | 'medium' | 'high';
  duration: number; // milliseconds
  particleCount?: number;
  color?: string;
  sound?: boolean;
}

export interface BubbleStyleConfig {
  style: BubbleStyle;
  backgroundColor: string;
  textColor: string;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: string;
  shadow?: string;
  gradient?: { from: string; to: string; angle: number };
  glow?: { color: string; blur: number };
}

export interface TypingIndicatorConfig {
  style: TypingIndicator;
  color: string;
  speed: 'slow' | 'normal' | 'fast';
  size: 'sm' | 'md' | 'lg';
}

export interface ReactionConfig {
  animation: ReactionAnimation;
  scale: number;
  duration: number;
  sound?: boolean;
}

export interface ChatSoundEffect {
  id: string;
  name: string;
  url: string;
  volume: number;
  enabled: boolean;
}

export interface UnlockedEffect {
  id: string;
  type: 'message-effect' | 'bubble-style' | 'emoji-pack' | 'typing-indicator' | 'sound';
  unlockedAt: string;
  source: 'achievement' | 'purchase' | 'event' | 'gift' | 'level';
  expiresAt?: string;
}

// ==================== EFFECT PRESETS ====================

export const MESSAGE_EFFECT_PRESETS: Record<MessageEffect, Omit<MessageEffectConfig, 'effect'>> = {
  none: { intensity: 'low', duration: 0 },
  confetti: { intensity: 'high', duration: 3000, particleCount: 50 },
  fireworks: { intensity: 'high', duration: 2500, particleCount: 30 },
  sparkle: { intensity: 'medium', duration: 1500, particleCount: 20, color: '#ffd700' },
  rainbow: { intensity: 'medium', duration: 2000 },
  hearts: { intensity: 'medium', duration: 2000, particleCount: 15, color: '#ff69b4' },
  stars: { intensity: 'medium', duration: 1800, particleCount: 25, color: '#ffff00' },
  snow: { intensity: 'low', duration: 4000, particleCount: 40 },
  fire: { intensity: 'high', duration: 2000, particleCount: 35, color: '#ff4500' },
  electric: { intensity: 'high', duration: 1500, particleCount: 20, color: '#00ffff' },
  glitch: { intensity: 'high', duration: 1000 },
  matrix: { intensity: 'medium', duration: 3000, color: '#00ff00' },
  bubble: { intensity: 'low', duration: 2500, particleCount: 10 },
  shake: { intensity: 'medium', duration: 500 },
  bounce: { intensity: 'low', duration: 800 },
  'fade-in': { intensity: 'low', duration: 400 },
  'slide-in': { intensity: 'low', duration: 300 },
  zoom: { intensity: 'medium', duration: 400 },
  flip: { intensity: 'medium', duration: 600 },
  typewriter: { intensity: 'low', duration: 1500 },
  'neon-glow': { intensity: 'medium', duration: 2000, color: '#ff00ff' },
  holographic: { intensity: 'high', duration: 3000 },
  plasma: { intensity: 'high', duration: 2500, color: '#9400d3' },
  aurora: { intensity: 'medium', duration: 4000 },
  cosmic: { intensity: 'high', duration: 3500, particleCount: 30 },
  sakura: { intensity: 'low', duration: 5000, particleCount: 25, color: '#ffb7c5' },
  rain: { intensity: 'low', duration: 4000, particleCount: 50 },
  thunder: { intensity: 'high', duration: 1000, sound: true },
  explosion: { intensity: 'high', duration: 1500, particleCount: 60, sound: true },
  portal: { intensity: 'high', duration: 2000, color: '#7c3aed' },
};

export const BUBBLE_STYLE_PRESETS: Record<BubbleStyle, Omit<BubbleStyleConfig, 'style'>> = {
  default: {
    backgroundColor: '#1a1a2e',
    textColor: '#ffffff',
    borderRadius: '1rem',
  },
  rounded: {
    backgroundColor: '#2d2d44',
    textColor: '#ffffff',
    borderRadius: '2rem',
  },
  square: {
    backgroundColor: '#1a1a2e',
    textColor: '#ffffff',
    borderRadius: '0.25rem',
  },
  cloud: {
    backgroundColor: '#3d3d5c',
    textColor: '#ffffff',
    borderRadius: '1.5rem 1.5rem 1.5rem 0.25rem',
  },
  thought: {
    backgroundColor: '#2a2a40',
    textColor: '#ffffff',
    borderRadius: '2rem',
    borderColor: '#4a4a6a',
    borderWidth: 2,
  },
  comic: {
    backgroundColor: '#ffff00',
    textColor: '#000000',
    borderColor: '#000000',
    borderWidth: 3,
    borderRadius: '0.5rem',
  },
  neon: {
    backgroundColor: 'transparent',
    textColor: '#00ff00',
    borderColor: '#00ff00',
    borderWidth: 2,
    borderRadius: '1rem',
    glow: { color: '#00ff00', blur: 10 },
  },
  glass: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    textColor: '#ffffff',
    borderRadius: '1rem',
    shadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
  },
  gradient: {
    backgroundColor: 'transparent',
    textColor: '#ffffff',
    borderRadius: '1rem',
    gradient: { from: '#667eea', to: '#764ba2', angle: 135 },
  },
  outlined: {
    backgroundColor: 'transparent',
    textColor: '#22c55e',
    borderColor: '#22c55e',
    borderWidth: 2,
    borderRadius: '1rem',
  },
  shadowed: {
    backgroundColor: '#1a1a2e',
    textColor: '#ffffff',
    borderRadius: '1rem',
    shadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
  },
  retro: {
    backgroundColor: '#2d1b69',
    textColor: '#ff6ad5',
    borderRadius: '0',
    borderColor: '#ff6ad5',
    borderWidth: 4,
  },
  pixel: {
    backgroundColor: '#222222',
    textColor: '#00ff00',
    borderRadius: '0',
    borderColor: '#00ff00',
    borderWidth: 2,
  },
  futuristic: {
    backgroundColor: 'rgba(0, 255, 255, 0.1)',
    textColor: '#00ffff',
    borderRadius: '0 1rem 0 1rem',
    borderColor: '#00ffff',
    borderWidth: 1,
    glow: { color: '#00ffff', blur: 8 },
  },
  organic: {
    backgroundColor: '#2d4a3e',
    textColor: '#90ee90',
    borderRadius: '40% 60% 60% 40% / 60% 40% 60% 40%',
  },
};

export const TYPING_INDICATOR_PRESETS: Record<
  TypingIndicator,
  Omit<TypingIndicatorConfig, 'style'>
> = {
  dots: { color: '#888888', speed: 'normal', size: 'md' },
  wave: { color: '#22c55e', speed: 'normal', size: 'md' },
  bounce: { color: '#3b82f6', speed: 'fast', size: 'sm' },
  pulse: { color: '#8b5cf6', speed: 'slow', size: 'md' },
  'typing-text': { color: '#ffffff', speed: 'normal', size: 'sm' },
  pencil: { color: '#f59e0b', speed: 'normal', size: 'md' },
  'speech-bubble': { color: '#ffffff', speed: 'normal', size: 'lg' },
  custom: { color: '#22c55e', speed: 'normal', size: 'md' },
};

export const SOUND_EFFECT_LIBRARY: ChatSoundEffect[] = [
  { id: 'message-sent', name: 'Message Sent', url: '/sounds/send.mp3', volume: 0.5, enabled: true },
  {
    id: 'message-received',
    name: 'Message Received',
    url: '/sounds/receive.mp3',
    volume: 0.5,
    enabled: true,
  },
  {
    id: 'notification',
    name: 'Notification',
    url: '/sounds/notification.mp3',
    volume: 0.7,
    enabled: true,
  },
  { id: 'mention', name: 'Mention', url: '/sounds/mention.mp3', volume: 0.8, enabled: true },
  { id: 'typing', name: 'Typing', url: '/sounds/typing.mp3', volume: 0.3, enabled: false },
  { id: 'reaction', name: 'Reaction', url: '/sounds/pop.mp3', volume: 0.4, enabled: true },
  { id: 'join', name: 'User Join', url: '/sounds/join.mp3', volume: 0.5, enabled: true },
  { id: 'leave', name: 'User Leave', url: '/sounds/leave.mp3', volume: 0.4, enabled: true },
  { id: 'call-ring', name: 'Call Ring', url: '/sounds/ring.mp3', volume: 0.8, enabled: true },
  { id: 'call-end', name: 'Call End', url: '/sounds/end-call.mp3', volume: 0.6, enabled: true },
];

// ==================== STATE INTERFACE ====================

export interface MessageEffectItem {
  id: MessageEffect;
  name: string;
  icon?: string;
  description?: string;
}

export interface BubbleStyleItem {
  id: BubbleStyle;
  name: string;
  borderRadius?: number | string;
  gradient?: string;
  glowColor?: string;
}

export interface TypingIndicatorItem {
  id: TypingIndicator;
  name: string;
}

export interface ChatEffectsState {
  // User's active effects
  activeMessageEffect: MessageEffectConfig;
  activeBubbleStyle: BubbleStyleConfig;
  activeEmojiPack: EmojiPack;
  activeTypingIndicator: TypingIndicatorConfig;
  activeReactionConfig: ReactionConfig;

  // Sound settings
  soundEffects: ChatSoundEffect[];
  masterVolume: number;
  soundsEnabled: boolean;

  // Unlocked content
  unlockedEffects: UnlockedEffect[];

  // Settings
  reduceMotion: boolean;
  showEffectsInCompactMode: boolean;
  autoPlayEffects: boolean;

  // Preview mode
  previewEffect: MessageEffect | null;
  previewBubble: BubbleStyle | null;

  // API sync
  lastSyncedAt: string | null;
  isSyncing: boolean;

  // Available effects for CosmeticsSettingsPanel
  messageEffects: MessageEffectItem[];
  bubbleStyles: BubbleStyleItem[];
  typingIndicators: TypingIndicatorItem[];

  // Actions
  setMessageEffect: (effect: MessageEffect, config?: Partial<MessageEffectConfig>) => void;
  setBubbleStyle: (style: BubbleStyle, config?: Partial<BubbleStyleConfig>) => void;
  setEmojiPack: (pack: EmojiPack) => void;
  setTypingIndicator: (style: TypingIndicator, config?: Partial<TypingIndicatorConfig>) => void;
  setReactionConfig: (config: Partial<ReactionConfig>) => void;

  // Activation actions for CosmeticsSettingsPanel
  activateEffect: (id: MessageEffect) => void;
  activateBubbleStyle: (id: BubbleStyle) => void;
  activateTypingIndicator: (id: TypingIndicator) => void;

  // Sound actions
  setSoundEffect: (id: string, updates: Partial<ChatSoundEffect>) => void;
  setMasterVolume: (volume: number) => void;
  toggleSounds: () => void;
  playSound: (id: string) => void;

  // Unlock actions
  unlockEffect: (effect: UnlockedEffect) => void;
  isEffectUnlocked: (id: string, type: UnlockedEffect['type']) => boolean;
  getUnlockedByType: (type: UnlockedEffect['type']) => UnlockedEffect[];

  // Settings actions
  setReduceMotion: (reduce: boolean) => void;
  toggleCompactModeEffects: () => void;
  toggleAutoPlay: () => void;

  // Preview actions
  setPreviewEffect: (effect: MessageEffect | null) => void;
  setPreviewBubble: (style: BubbleStyle | null) => void;

  // Sync actions
  syncWithServer: () => Promise<void>;
  loadFromServer: () => Promise<void>;
}

// ==================== STORE IMPLEMENTATION ====================

// Available effects data for CosmeticsSettingsPanel
const MESSAGE_EFFECTS_LIST: MessageEffectItem[] = [
  { id: 'none', name: 'None', icon: '🚫', description: 'No effect' },
  { id: 'confetti', name: 'Confetti', icon: '🎊', description: 'Celebration confetti' },
  { id: 'fireworks', name: 'Fireworks', icon: '🎆', description: 'Explosive fireworks' },
  { id: 'sparkle', name: 'Sparkle', icon: '✨', description: 'Magical sparkles' },
  { id: 'rainbow', name: 'Rainbow', icon: '🌈', description: 'Rainbow trail' },
  { id: 'hearts', name: 'Hearts', icon: '💕', description: 'Floating hearts' },
  { id: 'stars', name: 'Stars', icon: '⭐', description: 'Star burst' },
  { id: 'snow', name: 'Snow', icon: '❄️', description: 'Falling snowflakes' },
  { id: 'fire', name: 'Fire', icon: '🔥', description: 'Burning flames' },
  { id: 'electric', name: 'Electric', icon: '⚡', description: 'Electric sparks' },
  { id: 'glitch', name: 'Glitch', icon: '📺', description: 'Digital glitch' },
  { id: 'matrix', name: 'Matrix', icon: '💚', description: 'Matrix code rain' },
  { id: 'bubble', name: 'Bubble', icon: '🫧', description: 'Rising bubbles' },
  { id: 'fade-in', name: 'Fade In', icon: '👻', description: 'Smooth fade' },
  { id: 'neon-glow', name: 'Neon Glow', icon: '💡', description: 'Neon lighting' },
];

const BUBBLE_STYLES_LIST: BubbleStyleItem[] = [
  { id: 'default', name: 'Default', borderRadius: 16 },
  { id: 'rounded', name: 'Rounded', borderRadius: 32 },
  { id: 'square', name: 'Square', borderRadius: 4 },
  { id: 'cloud', name: 'Cloud', borderRadius: '24px 24px 24px 4px' },
  { id: 'neon', name: 'Neon', borderRadius: 16, glowColor: '#00ff00' },
  { id: 'glass', name: 'Glass', borderRadius: 16, gradient: 'rgba(255,255,255,0.1)' },
  {
    id: 'gradient',
    name: 'Gradient',
    borderRadius: 16,
    gradient: 'linear-gradient(135deg, #667eea, #764ba2)',
  },
  { id: 'comic', name: 'Comic', borderRadius: 8 },
  { id: 'retro', name: 'Retro', borderRadius: 0 },
  { id: 'futuristic', name: 'Futuristic', borderRadius: '0 16px 0 16px', glowColor: '#00ffff' },
];

const TYPING_INDICATORS_LIST: TypingIndicatorItem[] = [
  { id: 'dots', name: 'Bouncing Dots' },
  { id: 'wave', name: 'Wave Animation' },
  { id: 'bounce', name: 'Bounce' },
  { id: 'pulse', name: 'Pulse' },
  { id: 'typing-text', name: 'Typing Text' },
  { id: 'pencil', name: 'Pencil Icon' },
  { id: 'speech-bubble', name: 'Speech Bubble' },
];

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
  }));

export default useChatEffectsStore;
