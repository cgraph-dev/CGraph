/**
 * Channel Thread Store
 *
 * Manages threaded reply state for group channel messages.
 * Separate from the DM thread store since channel threads use
 * different API endpoints.
 *
 * @module modules/groups/store/channelThreadStore
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { api } from '@/lib/api';
import type { ChannelMessage } from './group-types';

interface ChannelThreadState {
  /** The parent message of the currently open thread */
  activeThread: ChannelMessage | null;
  /** Channel ID of the active thread */
  activeChannelId: string | null;
  /** Replies in the active thread (chronological order) */
  threadReplies: ChannelMessage[];
  /** Loading flag for thread replies */
  isLoading: boolean;
  /** Whether there are more replies to fetch */
  hasMore: boolean;
  /** Per-message reply counts: messageId → count */
  replyCounts: Record<string, number>;
  /** Derived: whether thread panel is open */
  isOpen: boolean;

  // Actions
  openThread: (channelId: string, message: ChannelMessage) => Promise<void>;
  closeThread: () => void;
  sendThreadReply: (content: string) => Promise<void>;
  addThreadReply: (reply: ChannelMessage) => void;
  fetchReplyCounts: (channelId: string, messageIds: string[]) => Promise<void>;
  reset: () => void;
}

export const useChannelThreadStore = create<ChannelThreadState>()(
  devtools(
    (set, get) => ({
      activeThread: null,
      activeChannelId: null,
      threadReplies: [],
      isLoading: false,
      hasMore: false,
      replyCounts: {},
      get isOpen() {
        return get().activeThread !== null;
      },

      openThread: async (channelId, message) => {
        set({
          activeThread: message,
          activeChannelId: channelId,
          threadReplies: [],
          isLoading: true,
          hasMore: false,
        });

        try {
          const res = await api.get(`/api/v1/channels/${channelId}/messages/${message.id}/thread`);

          // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
          const replies = (res.data?.data ?? res.data?.replies ?? []) as ChannelMessage[];

          set({
            threadReplies: replies,
            isLoading: false,
            hasMore: res.data?.meta?.has_more ?? false,
          });
        } catch {
          set({ isLoading: false });
        }
      },

      closeThread: () => {
        set({
          activeThread: null,
          activeChannelId: null,
          threadReplies: [],
          isLoading: false,
          hasMore: false,
        });
      },

      sendThreadReply: async (content: string) => {
        const { activeChannelId, activeThread } = get();
        if (!activeChannelId || !activeThread) return;

        try {
          const res = await api.post(`/api/v1/channels/${activeChannelId}/messages`, {
            content,
            reply_to_id: activeThread.id,
          });

          // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
          const reply = (res.data?.data ?? res.data?.message ?? res.data) as ChannelMessage;
          if (reply?.id) {
            set((state) => ({
              threadReplies: [...state.threadReplies, reply],
              replyCounts: {
                ...state.replyCounts,
                [activeThread.id]: (state.replyCounts[activeThread.id] || 0) + 1,
              },
            }));
          }
        } catch (err) {
          console.error('Failed to send channel thread reply:', err);
        }
      },

      addThreadReply: (reply: ChannelMessage) => {
        const { activeThread } = get();
        if (!activeThread || reply.replyToId !== activeThread.id) return;

        set((state) => {
          if (state.threadReplies.some((r) => r.id === reply.id)) return state;
          return {
            threadReplies: [...state.threadReplies, reply],
            replyCounts: {
              ...state.replyCounts,
              [activeThread.id]: (state.replyCounts[activeThread.id] || 0) + 1,
            },
          };
        });
      },

      fetchReplyCounts: async (channelId: string, messageIds: string[]) => {
        if (messageIds.length === 0) return;

        try {
          const res = await api.post(`/api/v1/channels/${channelId}/thread-counts`, {
            message_ids: messageIds,
          });

          // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
          const counts = (res.data?.data ?? res.data?.counts ?? {}) as Record<string, number>;
          set((state) => ({
            replyCounts: { ...state.replyCounts, ...counts },
          }));
        } catch {
          // Silent fail — counts are non-critical UI decoration
        }
      },

      reset: () =>
        set({
          activeThread: null,
          activeChannelId: null,
          threadReplies: [],
          isLoading: false,
          hasMore: false,
          replyCounts: {},
        }),
    }),
    { name: 'channel-thread-store' }
  )
);
