/**
 * @deprecated This file is deprecated. Import from '@/stores/theme' instead.
 *
 * Chat bubble customization is now part of the unified theme system.
 * This file provides backward compatibility exports.
 *
 * @see /stores/theme/index.ts
 */

import { useThemeStore, CHAT_BUBBLE_PRESETS, type ChatBubbleConfig } from './theme';
import { createLogger } from '@/lib/logger';

const logger = createLogger('chatBubbleStore');

export { CHAT_BUBBLE_PRESETS, type ChatBubbleConfig as ChatBubbleStyle };

// Legacy default style export
export const defaultChatBubbleStyle: ChatBubbleConfig = {
  ownMessageBg: '#10b981',
  otherMessageBg: '#374151',
  ownMessageText: '#ffffff',
  otherMessageText: '#ffffff',
  useGradient: true,
  borderRadius: 16,
  bubbleShape: 'rounded',
  showTail: true,
  glassEffect: false,
  glassBlur: 10,
  shadowIntensity: 20,
  borderWidth: 0,
  entranceAnimation: 'slide',
  hoverEffect: true,
  maxWidth: 70,
  spacing: 4,
  showTimestamp: true,
  showAvatar: true,
  groupMessages: true,
};

/**
 * Backward-compatible chat bubble store hook.
 * Provides style, updateStyle, resetStyle, and applyPreset methods.
 */
export const useChatBubbleStore = () => {
  const chatBubble = useThemeStore((s) => s.chatBubble);
  const updateChatBubble = useThemeStore((s) => s.updateChatBubble);
  const resetChatBubble = useThemeStore((s) => s.resetChatBubble);
  const applyChatBubblePreset = useThemeStore((s) => s.applyChatBubblePreset);

  return {
    style: chatBubble,
    updateStyle: <K extends keyof ChatBubbleConfig>(
      keyOrUpdates: K | Partial<ChatBubbleConfig>,
      value?: ChatBubbleConfig[K]
    ) => {
      if (typeof keyOrUpdates === 'string') {
        updateChatBubble({ [keyOrUpdates]: value } as Partial<ChatBubbleConfig>);
      } else {
        updateChatBubble(keyOrUpdates);
      }
    },
    resetStyle: resetChatBubble,
    applyPreset: (preset: keyof typeof CHAT_BUBBLE_PRESETS) => {
      applyChatBubblePreset(preset);
    },
    // Additional legacy methods
    exportStyle: () => JSON.stringify(chatBubble, null, 2),
    importStyle: (json: string) => {
      try {
        const imported = JSON.parse(json);
        updateChatBubble({ ...defaultChatBubbleStyle, ...imported });
      } catch (e) {
        logger.error('Failed to import chat bubble style:', e);
      }
    },
  };
};

// Legacy selector hook
export const useChatBubbleTheme = () => useThemeStore((s) => s.chatBubble);

export default useChatBubbleStore;
