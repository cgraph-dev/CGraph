/**
 * Chat Effects Type Definitions
 *
 * All type definitions, interfaces, and union types for the chat effects system.
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

  // Reset
  reset: () => void;
}
