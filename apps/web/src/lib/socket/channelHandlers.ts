/**
 * Forum Channel Handler
 *
 * Manages Phoenix channel connections for forum-level real-time events
 * including new threads, member changes, stats, and presence.
 *
 * @module lib/socket/forumChannelHandler
 */

import { Channel, Presence } from 'phoenix';
import type {
  ForumChannelCallbacks,
  ForumPresenceMember,
  ForumPresenceMeta,
  ForumStatsPayload,
  ForumThreadPayload,
  ForumUserPayload,
  ThreadVotePayload,
  CommentVotePayload,
  ThreadCommentPayload,
  ThreadTypingPayload,
  ThreadPollPayload,
  ThreadPresenceMeta,
  ThreadViewerPayload,
  ThreadChannelCallbacks,
} from './types';

// Re-export for convenience
export type { ForumChannelCallbacks, ThreadChannelCallbacks };

/** Shared channel state maps from the parent SocketManager */
export interface ChannelMaps {
  channels: Map<string, Channel>;
  presences: Map<string, Presence>;
  channelHandlersSetUp: Set<string>;
}

/**
 * Set up event handlers for a forum channel.
 *
 * @param channel  - The Phoenix channel instance
 * @param topic    - Channel topic string (e.g. "forum:abc123")
 * @param forumId  - Forum ID
 * @param maps     - Shared channel state maps
 * @param getCallbacks - Getter for the forum callbacks map
 */
export function setupForumHandlers(
  channel: Channel,
  topic: string,
  forumId: string,
  maps: ChannelMaps,
  getCallbacks: () => Map<string, ForumChannelCallbacks>
): void {
  if (maps.channelHandlersSetUp.has(topic)) return;
  maps.channelHandlersSetUp.add(topic);

  // Presence tracking
  const presence = new Presence(channel);
  maps.presences.set(topic, presence);

  presence.onSync(() => {
    const members: ForumPresenceMember[] = [];
    presence.list((userId: string, pres: unknown) => {
       
      const { metas } = pres as { metas: ForumPresenceMeta[] }; // safe downcast – Phoenix Presence shape
      const meta = metas?.[0];
      if (meta) {
        members.push({
          user_id: userId,
          username: meta.username,
          display_name: meta.display_name,
          avatar_url: meta.avatar_url,
          online_at: meta.online_at,
          is_member: meta.is_member,
        });
      }
      return userId;
    });

    getCallbacks().get(forumId)?.onPresenceSync?.(members);
  });

  // Forum event handlers
  channel.on('new_thread', (payload) => {
     
    const data = payload as { thread: ForumThreadPayload }; // safe downcast – Phoenix channel event
    getCallbacks().get(forumId)?.onNewThread?.(data.thread);
  });

  channel.on('thread_pinned', (payload) => {
     
    const data = payload as { thread_id: string; is_pinned: boolean }; // safe downcast – Phoenix channel event
    getCallbacks().get(forumId)?.onThreadPinned?.(data);
  });

  channel.on('thread_locked', (payload) => {
     
    const data = payload as { thread_id: string; is_locked: boolean }; // safe downcast – Phoenix channel event
    getCallbacks().get(forumId)?.onThreadLocked?.(data);
  });

  channel.on('thread_deleted', (payload) => {
     
    const data = payload as { thread_id: string }; // safe downcast – Phoenix channel event
    getCallbacks().get(forumId)?.onThreadDeleted?.(data);
  });

  channel.on('member_joined', (payload) => {
     
    const data = payload as { user: ForumUserPayload }; // safe downcast – Phoenix channel event
    getCallbacks().get(forumId)?.onMemberJoined?.(data.user);
  });

  channel.on('member_left', (payload) => {
     
    const data = payload as { user_id: string }; // safe downcast – Phoenix channel event
    getCallbacks().get(forumId)?.onMemberLeft?.(data);
  });

  channel.on('stats_update', (payload) => {
     
    const data = payload as ForumStatsPayload; // safe downcast – Phoenix channel event
    getCallbacks().get(forumId)?.onStatsUpdate?.(data);
  });

  channel.on('forum_stats', (payload) => {
     
    const data = payload as ForumStatsPayload; // safe downcast – Phoenix channel event
    getCallbacks().get(forumId)?.onStatsUpdate?.(data);
  });
}

/**
 * Set up event handlers for a thread channel.
 *
 * @param channel  - The Phoenix channel instance
 * @param topic    - Channel topic string (e.g. "thread:abc123")
 * @param threadId - Thread ID
 * @param maps     - Shared channel state maps
 * @param getCallbacks - Getter for the thread callbacks map
 */
export function setupThreadHandlers(
  channel: Channel,
  topic: string,
  threadId: string,
  maps: ChannelMaps,
  getCallbacks: () => Map<string, ThreadChannelCallbacks>
): void {
  if (maps.channelHandlersSetUp.has(topic)) return;
  maps.channelHandlersSetUp.add(topic);

  // Presence tracking
  const presence = new Presence(channel);
  maps.presences.set(topic, presence);

  presence.onSync(() => {
    const viewers: ThreadViewerPayload[] = [];
    presence.list((userId: string, pres: unknown) => {
       
      const { metas } = pres as { metas: ThreadPresenceMeta[] }; // safe downcast – Phoenix Presence shape
      const meta = metas?.[0];
      if (meta) {
        viewers.push({
          user_id: userId,
          username: meta.username,
          display_name: meta.display_name,
          avatar_url: meta.avatar_url,
          typing: meta.typing,
        });
      }
      return userId;
    });

    getCallbacks().get(threadId)?.onPresenceSync?.(viewers);
  });

  // Thread event handlers
  channel.on('new_comment', (payload) => {
     
    const data = payload as { comment: ThreadCommentPayload }; // safe downcast – Phoenix channel event
    getCallbacks().get(threadId)?.onNewComment?.(data.comment);
  });

  channel.on('comment_edited', (payload) => {
     
    const data = payload as { comment: ThreadCommentPayload }; // safe downcast – Phoenix channel event
    getCallbacks().get(threadId)?.onCommentEdited?.(data.comment);
  });

  channel.on('comment_deleted', (payload) => {
     
    const data = payload as { comment_id: string }; // safe downcast – Phoenix channel event
    getCallbacks().get(threadId)?.onCommentDeleted?.(data);
  });

  channel.on('vote_changed', (payload) => {
     
    const data = payload as ThreadVotePayload; // safe downcast – Phoenix channel event
    getCallbacks().get(threadId)?.onVoteChanged?.(data);
  });

  channel.on('comment_vote_changed', (payload) => {
     
    const data = payload as CommentVotePayload; // safe downcast – Phoenix channel event
    getCallbacks().get(threadId)?.onCommentVoteChanged?.(data);
  });

  channel.on('typing', (payload) => {
     
    const data = payload as ThreadTypingPayload; // safe downcast – Phoenix channel event
    getCallbacks().get(threadId)?.onTyping?.(data);
  });

  channel.on('poll_updated', (payload) => {
     
    const data = payload as ThreadPollPayload; // safe downcast – Phoenix channel event
    getCallbacks().get(threadId)?.onPollUpdated?.(data);
  });

  channel.on('post_edited', (payload) => {
     
    const data = payload as {
      post: {
        id: string;
        content: string;
        content_html: string;
        is_edited: boolean;
        edit_count: number;
        edited_at: string;
      };
    };
    getCallbacks().get(threadId)?.onPostEdited?.(data.post);
  });

  channel.on('thread_status_changed', (payload) => {
     
    const data = payload as { thread_id: string; is_locked: boolean; is_pinned: boolean }; // safe downcast – Phoenix channel event
    getCallbacks().get(threadId)?.onThreadStatusChanged?.(data);
  });

  channel.on('thread_stats', (payload) => {
     
    const data = payload as ThreadVotePayload; // safe downcast – Phoenix channel event
    getCallbacks().get(threadId)?.onVoteChanged?.(data);
  });
}
