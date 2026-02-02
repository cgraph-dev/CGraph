/**
 * Forum Channel
 *
 * Handles real-time forum events:
 * - New posts/threads
 * - Post edits/deletes
 * - Voting updates
 * - Online members
 */

import { Channel, Presence } from 'phoenix';
import type { PhoenixClient } from '../phoenixClient';
import { createChannelHandler, pushToChannel } from '../phoenixClient';
import type { PresenceState } from '../types';

export interface ForumPost {
  id: string;
  thread_id: string;
  author_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  vote_count: number;
}

export interface ForumThread {
  id: string;
  forum_id: string;
  title: string;
  author_id: string;
  created_at: string;
  reply_count: number;
  view_count: number;
  is_pinned: boolean;
  is_locked: boolean;
}

export interface ForumChannelEvents {
  new_thread: ForumThread;
  thread_updated: { id: string; title?: string; is_pinned?: boolean; is_locked?: boolean };
  new_post: ForumPost;
  post_updated: { id: string; content: string; updated_at: string };
  post_deleted: { id: string };
  vote_update: { post_id: string; vote_count: number };
}

export class ForumChannel {
  private channel: Channel | null = null;
  private presence: Presence | null = null;
  private forumId: string;
  private client: PhoenixClient;

  constructor(client: PhoenixClient, forumId: string) {
    this.client = client;
    this.forumId = forumId;
  }

  /**
   * Join the forum channel
   */
  join(): Channel | null {
    this.channel = this.client.joinChannel({
      topic: `forum:${this.forumId}`,
    });

    if (this.channel) {
      this.presence = new Presence(this.channel);
    }

    return this.channel;
  }

  /**
   * Leave the forum channel
   */
  leave(): void {
    this.client.leaveChannel(`forum:${this.forumId}`);
    this.channel = null;
    this.presence = null;
  }

  /**
   * Subscribe to new threads
   */
  onNewThread(handler: (thread: ForumThread) => void): () => void {
    if (!this.channel) {
      return () => {};
    }
    return createChannelHandler(this.channel, 'new_thread', handler);
  }

  /**
   * Subscribe to thread updates
   */
  onThreadUpdated(handler: (event: ForumChannelEvents['thread_updated']) => void): () => void {
    if (!this.channel) {
      return () => {};
    }
    return createChannelHandler(this.channel, 'thread_updated', handler);
  }

  /**
   * Subscribe to new posts
   */
  onNewPost(handler: (post: ForumPost) => void): () => void {
    if (!this.channel) {
      return () => {};
    }
    return createChannelHandler(this.channel, 'new_post', handler);
  }

  /**
   * Subscribe to vote updates
   */
  onVoteUpdate(handler: (event: ForumChannelEvents['vote_update']) => void): () => void {
    if (!this.channel) {
      return () => {};
    }
    return createChannelHandler(this.channel, 'vote_update', handler);
  }

  /**
   * Subscribe to presence (online members)
   */
  onPresenceChange(onSync: (presences: PresenceState) => void): void {
    if (!this.presence) {
      return;
    }

    this.presence.onSync(() => {
      const presences = this.presence?.list() || {};
      onSync(presences as PresenceState);
    });
  }

  /**
   * Create a new thread
   */
  async createThread(title: string, content: string): Promise<ForumThread> {
    if (!this.channel) {
      throw new Error('Channel not joined');
    }
    return pushToChannel(this.channel, 'create_thread', { title, content });
  }

  /**
   * Vote on a post
   */
  async vote(postId: string, direction: 'up' | 'down'): Promise<void> {
    if (!this.channel) {
      throw new Error('Channel not joined');
    }
    await pushToChannel(this.channel, 'vote', {
      post_id: postId,
      direction,
    });
  }

  /**
   * Reply to a thread
   */
  async reply(threadId: string, content: string): Promise<ForumPost> {
    if (!this.channel) {
      throw new Error('Channel not joined');
    }
    return pushToChannel(this.channel, 'reply', {
      thread_id: threadId,
      content,
    });
  }
}
