/**
 * useMessageReactions Hook
 *
 * Handles adding and removing reactions to messages via API.
 * Provides optimistic updates and state management.
 *
 * @module screens/messages/ConversationScreen/hooks
 */

import { useCallback } from 'react';
import { Alert } from 'react-native';
import * as Haptics from 'expo-haptics';
import api from '../../../../lib/api';
import { createLogger } from '../../../../lib/logger';
import type { Message, UserBasic } from '../../../../types';
import type { AnimationFormat } from '@/lib/lottie';

const logger = createLogger('useMessageReactions');

interface UseMessageReactionsOptions {
  user: UserBasic | null | undefined;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
}

export interface UseMessageReactionsReturn {
  handleAddReaction: (messageId: string, emoji: string) => Promise<void>;
  handleRemoveReaction: (messageId: string, emoji: string) => Promise<void>;
  handleQuickReaction: (
    selectedMessage: Message | null,
    emoji: string,
    hasReacted: boolean,
    closeMenu: () => void
  ) => void;
  handleReactionTap: (messageId: string, emoji: string, hasReacted: boolean) => void;
  addReactionToMessage: (
    messageId: string,
    emoji: string,
    userId: string,
    userData?: ReactionUser
  ) => void;
  removeReactionFromMessage: (messageId: string, emoji: string, userId: string) => void;
}

interface ReactionUser {
  id: string;
  username?: string;
  display_name?: string;
  avatar_url?: string;
}

/** Animation metadata attached to reaction state */
export interface ReactionAnimationMeta {
  animationFormat?: AnimationFormat;
  lottieUrl?: string;
}

/**
 * Hook for managing message reactions.
 */
export function useMessageReactions({
  user,
  setMessages,
}: UseMessageReactionsOptions): UseMessageReactionsReturn {
  /**
   * Add a reaction to a message (optimistic update + API call).
   * Limit: 1 reaction per user per message - will replace existing reaction.
   */
  const handleAddReaction = useCallback(
    async (messageId: string, emoji: string) => {
      try {
        await api.post(`/api/v1/messages/${messageId}/reactions`, { emoji });
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        // Optimistic update - add reaction locally (replacing any existing user reaction)
        setMessages((prev) =>
          prev.map((m) => {
            if (m.id !== messageId) return m;
            let reactions = [...(m.reactions || [])];
            const currentUserId = user?.id;

            // First, remove user's previous reaction if any (1 reaction per user limit)

             
            reactions = reactions
              .map((r) => {
                if (r.hasReacted && r.emoji !== emoji) {
                  const newUsers = r.users.filter((u) => u.id !== currentUserId);
                  if (newUsers.length === 0) {
                    return null; // Mark for removal
                  }
                  return {
                    ...r,
                    count: newUsers.length,
                    hasReacted: false,
                    users: newUsers,
                  };
                }
                return r;
              })
              .filter(Boolean) as typeof reactions;

            // Now add the new reaction
            const existingIdx = reactions.findIndex((r) => r.emoji === emoji);

            if (existingIdx >= 0) {
              const existing = reactions[existingIdx];
              if (!existing.hasReacted) {
                reactions[existingIdx] = {
                  ...existing,
                  count: existing.count + 1,
                  hasReacted: true,
                  users: [
                    ...existing.users,
                    {
                      id: currentUserId || '',
                      username: user?.username || null,
                      display_name: user?.display_name,
                      avatar_url: user?.avatar_url,
                      status: 'online',
                    },
                  ],
                };
              }
            } else {
              reactions.push({
                emoji,
                count: 1,
                hasReacted: true,
                users: [
                  {
                    id: currentUserId || '',
                    username: user?.username || null,
                    display_name: user?.display_name,
                    avatar_url: user?.avatar_url,
                    status: 'online',
                  },
                ],
              });
            }
            return { ...m, reactions };
          })
        );
      } catch (error: unknown) {
         
        const err = error as { response?: { status?: number }; message?: string };
        // 409 means user already has this exact reaction - silently ignore
        if (err.response?.status !== 409) {
          logger.warn('Error adding reaction:', err.message || error);
        }
      }
    },
    [user, setMessages]
  );

  /**
   * Remove a reaction from a message.
   */
  const handleRemoveReaction = useCallback(
    async (messageId: string, emoji: string) => {
      try {
        await api.delete(`/api/v1/messages/${messageId}/reactions/${encodeURIComponent(emoji)}`);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        // Optimistic update - remove reaction locally
        setMessages((prev) =>
          prev.map((m) => {
            if (m.id !== messageId) return m;
            const reactions = [...(m.reactions || [])];
            const existingIdx = reactions.findIndex((r) => r.emoji === emoji);

            if (existingIdx >= 0) {
              const existing = reactions[existingIdx];
              const newUsers = existing.users.filter((u) => u.id !== user?.id);
              if (newUsers.length === 0) {
                reactions.splice(existingIdx, 1);
              } else {
                reactions[existingIdx] = {
                  ...existing,
                  count: newUsers.length,
                  hasReacted: false,
                  users: newUsers,
                };
              }
            }
            return { ...m, reactions };
          })
        );
      } catch (error) {
        logger.error('Error removing reaction:', error);
        Alert.alert('Error', 'Failed to remove reaction');
      }
    },
    [user?.id, setMessages]
  );

  /**
   * Handle quick reaction from message actions menu.
   */
  const handleQuickReaction = useCallback(
    (
      selectedMessage: Message | null,
      emoji: string,
      hasReacted: boolean,
      closeMenu: () => void
    ) => {
      if (selectedMessage) {
        if (hasReacted) {
          handleRemoveReaction(selectedMessage.id, emoji);
        } else {
          handleAddReaction(selectedMessage.id, emoji);
        }
        closeMenu();
      }
    },
    [handleAddReaction, handleRemoveReaction]
  );

  /**
   * Handle reaction tap on message bubble (toggle).
   */
  const handleReactionTap = useCallback(
    (messageId: string, emoji: string, hasReacted: boolean) => {
      if (hasReacted) {
        handleRemoveReaction(messageId, emoji);
      } else {
        handleAddReaction(messageId, emoji);
      }
    },
    [handleAddReaction, handleRemoveReaction]
  );

  /**
   * Add a reaction to message from WebSocket event.
   */
  const addReactionToMessage = useCallback(
    (messageId: string, emoji: string, userId: string, userData?: ReactionUser) => {
      const currentUserId = String(user?.id || '');
      const reactingUserId = String(userId);

      setMessages((prev) =>
        prev.map((m) => {
          if (m.id !== messageId) return m;
          const reactions = [...(m.reactions || [])];
          const existingIdx = reactions.findIndex((r) => r.emoji === emoji);

          if (existingIdx >= 0) {
            const existing = reactions[existingIdx];
            const userAlreadyReacted = existing.users.some((u) => String(u.id) === reactingUserId);
            if (!userAlreadyReacted) {
              reactions[existingIdx] = {
                ...existing,
                count: existing.count + 1,
                users: [
                  ...existing.users,
                  {
                    id: userId,
                    username: userData?.username || null,
                    display_name: userData?.display_name,
                    avatar_url: userData?.avatar_url,
                    status: 'online',
                  },
                ],
                hasReacted: existing.hasReacted || reactingUserId === currentUserId,
              };
            }
          } else {
            reactions.push({
              emoji,
              count: 1,
              users: [
                {
                  id: userId,
                  username: userData?.username || null,
                  display_name: userData?.display_name,
                  avatar_url: userData?.avatar_url,
                  status: 'online',
                },
              ],
              hasReacted: reactingUserId === currentUserId,
            });
          }
          return { ...m, reactions };
        })
      );
    },
    [user?.id, setMessages]
  );

  /**
   * Remove a reaction from message from WebSocket event.
   */
  const removeReactionFromMessage = useCallback(
    (messageId: string, emoji: string, userId: string) => {
      const currentUserId = String(user?.id || '');
      const removedUserId = String(userId);

      setMessages((prev) =>
        prev.map((m) => {
          if (m.id !== messageId) return m;
          const reactions = [...(m.reactions || [])];
          const existingIdx = reactions.findIndex((r) => r.emoji === emoji);

          if (existingIdx >= 0) {
            const existing = reactions[existingIdx];
            const newUsers = existing.users.filter((u) => String(u.id) !== removedUserId);
            if (newUsers.length === 0) {
              reactions.splice(existingIdx, 1);
            } else {
              reactions[existingIdx] = {
                ...existing,
                count: newUsers.length,
                users: newUsers,
                hasReacted: newUsers.some((u) => String(u.id) === currentUserId),
              };
            }
          }
          return { ...m, reactions };
        })
      );
    },
    [user?.id, setMessages]
  );

  return {
    handleAddReaction,
    handleRemoveReaction,
    handleQuickReaction,
    handleReactionTap,
    addReactionToMessage,
    removeReactionFromMessage,
  };
}

export default useMessageReactions;
