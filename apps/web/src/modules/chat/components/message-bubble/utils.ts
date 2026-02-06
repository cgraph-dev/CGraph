/**
 * Message Bubble Utilities
 *
 * Helper functions for message bubble display.
 */

import { format } from 'date-fns';
import { useChatStore } from '@/stores/chatStore';
import { createLogger } from '@/lib/logger';
import type { UIPreferences } from './types';

const logger = createLogger('MessageBubble');

/**
 * Safe time formatter that handles invalid dates
 */
export function formatMessageTime(dateStr: string | undefined | null): string {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '';
    return format(date, 'h:mm a');
  } catch {
    return '';
  }
}

/**
 * Handles adding a reaction to a message.
 */
export async function handleAddReaction(
  messageId: string,
  emoji: string,
  _conversationId?: string
): Promise<void> {
  try {
    const { addReaction } = useChatStore.getState();
    await addReaction(messageId, emoji);
  } catch (error) {
    logger.warn('Failed to add reaction:', error);
  }
}

/**
 * Map UIPreferences voiceVisualizerTheme to AdvancedVoiceVisualizer theme
 * The visualizer expects 'amber' but UIPreferences uses 'sunset-orange'
 */
export function mapVisualizerTheme(
  theme: UIPreferences['voiceVisualizerTheme']
): 'matrix-green' | 'cyber-blue' | 'neon-pink' | 'amber' {
  if (theme === 'sunset-orange') {
    return 'amber';
  }
  return theme as 'matrix-green' | 'cyber-blue' | 'neon-pink' | 'amber';
}
