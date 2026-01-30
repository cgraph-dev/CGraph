/**
 * Reaction Utilities
 *
 * Type-safe utilities for aggregating and managing message reactions.
 * Used across conversation and chat components.
 */

import { useAuthStore } from '@/stores/authStore';
import { useChatStore } from '@/stores/chatStore';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Aggregated reaction format expected by MessageReactions component.
 * Transforms raw reaction arrays into grouped, counted summaries.
 */
export interface AggregatedReaction {
  emoji: string;
  count: number;
  users: Array<{ id: string; username: string }>;
  hasReacted: boolean;
}

/**
 * Raw reaction format from the chat store.
 * Includes individual user attribution for each reaction instance.
 */
export interface RawReaction {
  id: string;
  emoji: string;
  userId: string;
  user: {
    id: string;
    username: string;
  };
}

// ============================================================================
// AGGREGATION UTILITIES
// ============================================================================

/**
 * Aggregates raw reactions into grouped format with counts and user lists.
 * Uses a Map-based accumulator pattern for O(n) complexity.
 *
 * @param reactions - Array of individual reaction records
 * @param currentUserId - Optional current user ID for hasReacted check
 * @returns Array of aggregated reactions grouped by emoji
 */
export function aggregateReactions(
  reactions: RawReaction[] | undefined,
  currentUserId?: string | null
): AggregatedReaction[] {
  if (!reactions || reactions.length === 0) return [];

  // Use provided userId or get from store
  const userId = currentUserId ?? useAuthStore.getState().user?.id;
  const aggregationMap = new Map<string, AggregatedReaction>();

  for (const reaction of reactions) {
    // Skip reactions with missing required data
    if (!reaction?.emoji) continue;

    const reactionUserId = reaction.user?.id ?? reaction.userId ?? 'unknown';
    const username = reaction.user?.username ?? 'Unknown User';
    const existing = aggregationMap.get(reaction.emoji);

    if (existing) {
      existing.count++;
      existing.users.push({ id: reactionUserId, username });
      if (reaction.userId === userId) {
        existing.hasReacted = true;
      }
    } else {
      aggregationMap.set(reaction.emoji, {
        emoji: reaction.emoji,
        count: 1,
        users: [{ id: reactionUserId, username }],
        hasReacted: reaction.userId === userId,
      });
    }
  }

  return Array.from(aggregationMap.values());
}

/**
 * Quick aggregation for inline display (used in message list).
 * Returns a simplified map format for efficient rendering.
 *
 * @param reactions - Array of raw reactions
 * @param currentUserId - Current user ID for hasReacted check
 * @returns Record mapping emoji to count and hasReacted
 */
export function aggregateReactionsSimple(
  reactions: RawReaction[] | undefined,
  currentUserId?: string | null
): Record<string, { count: number; hasReacted: boolean }> {
  if (!reactions || reactions.length === 0) return {};

  const userId = currentUserId ?? useAuthStore.getState().user?.id;

  return reactions.reduce<Record<string, { count: number; hasReacted: boolean }>>((acc, r) => {
    const entry = (acc[r.emoji] ??= { count: 0, hasReacted: false });
    entry.count++;
    if (userId && r.userId === userId) entry.hasReacted = true;
    return acc;
  }, {});
}

// ============================================================================
// REACTION HANDLERS
// ============================================================================

/**
 * Handles removal of a reaction from a message.
 * Integrates with the chat store's reaction management system.
 *
 * @param messageId - The ID of the message to remove reaction from
 * @param emoji - The emoji to remove
 */
export async function handleRemoveReaction(messageId: string, emoji: string): Promise<void> {
  try {
    const { removeReaction } = useChatStore.getState();
    await removeReaction(messageId, emoji);
  } catch (error) {
    console.error('Failed to remove reaction:', error);
  }
}

/**
 * Handles adding a reaction to a message.
 * Integrates with the chat store's reaction management system.
 *
 * @param messageId - The ID of the message to add reaction to
 * @param emoji - The emoji to add
 */
export async function handleAddReaction(
  messageId: string,
  emoji: string
): Promise<void> {
  try {
    const { addReaction } = useChatStore.getState();
    await addReaction(messageId, emoji);
  } catch (error) {
    console.error('Failed to add reaction:', error);
  }
}

/**
 * Toggle reaction - adds if not present, removes if present.
 *
 * @param messageId - The ID of the message
 * @param emoji - The emoji to toggle
 * @param hasReacted - Whether user has already reacted with this emoji
 */
export async function toggleReaction(
  messageId: string,
  emoji: string,
  hasReacted: boolean
): Promise<void> {
  if (hasReacted) {
    await handleRemoveReaction(messageId, emoji);
  } else {
    await handleAddReaction(messageId, emoji);
  }
}
