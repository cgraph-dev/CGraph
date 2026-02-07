/**
 * Conversation page types
 * Extracted from Conversation.tsx for modularity
 */

import type { Message } from '@/modules/chat/store';
import type { GifResult } from '@/modules/chat/components/GifPicker';
import type { Sticker } from '@/data/stickers';

/**
 * UI preferences for the conversation view
 */
export interface UIPreferences {
  glassEffect: 'holographic' | 'crystal' | 'frosted' | 'aurora';
  animationIntensity: 'low' | 'medium' | 'high';
  showParticles: boolean;
  enableGlow: boolean;
  enable3D: boolean;
  enableHaptic: boolean;
  voiceVisualizerTheme: 'matrix-green' | 'cyber-blue' | 'neon-pink' | 'sunset-orange';
  messageEntranceAnimation: 'slide' | 'fade' | 'pop' | 'bounce';
}

/**
 * Default UI preferences
 */
export const DEFAULT_UI_PREFERENCES: UIPreferences = {
  glassEffect: 'holographic',
  animationIntensity: 'high',
  showParticles: true,
  enableGlow: true,
  enable3D: true,
  enableHaptic: true,
  voiceVisualizerTheme: 'matrix-green',
  messageEntranceAnimation: 'slide',
};

/**
 * Pending message for E2EE retry
 */
export interface PendingE2EEMessage {
  content: string;
  replyToId?: string;
  options?: {
    type?: string;
    metadata?: Record<string, unknown>;
    forceUnencrypted?: boolean;
  };
}

/**
 * Voice message data from recorder
 */
export interface VoiceMessageData {
  blob: Blob;
  duration: number;
  waveform: number[];
}

/**
 * Mutual friend info for chat info panel
 */
export interface MutualFriend {
  id: string;
  username: string;
  avatarUrl?: string;
}

/**
 * Handler types for message operations
 */
export interface MessageHandlers {
  onSend: () => Promise<void>;
  onRetryE2EE: () => Promise<void>;
  onSendUnencrypted: () => Promise<void>;
  onStickerSelect: (sticker: Sticker) => Promise<void>;
  onGifSelect: (gif: GifResult) => Promise<void>;
  onEmojiSelect: (emoji: string) => void;
  onVoiceComplete: (data: VoiceMessageData) => Promise<void>;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  onTyping: () => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
  onLoadMore: () => void;
}

/**
 * Call modal handlers
 */
export interface CallHandlers {
  onStartVoiceCall: () => void;
  onStartVideoCall: () => void;
}

/**
 * Search result click handler params
 */
export interface SearchResultClickParams {
  conversationId: string;
  messageId: string;
}

/**
 * Re-export Message type for convenience
 */
export type { Message, GifResult, Sticker };
