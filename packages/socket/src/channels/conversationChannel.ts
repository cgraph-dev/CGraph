/**
 * Conversation Channel
 *
 * Handles real-time messaging events:
 * - New messages
 * - Message edits/deletes
 * - Typing indicators
 * - Read receipts
 * - Reactions
 */

import { Channel, Presence } from 'phoenix';
import type { PhoenixClient } from '../phoenixClient';
import { createChannelHandler, pushToChannel } from '../phoenixClient';
import type { PresenceState, PresenceDiff } from '../types';

export interface Message {
  id: string;
  content: string;
  sender_id: string;
  conversation_id: string;
  created_at: string;
  updated_at: string;
  attachments?: MessageAttachment[];
  reactions?: MessageReaction[];
  reply_to_id?: string;
  encrypted?: boolean;
}

export interface MessageAttachment {
  id: string;
  type: 'image' | 'file' | 'audio' | 'video';
  url: string;
  name: string;
  size: number;
}

export interface MessageReaction {
  emoji: string;
  user_ids: string[];
}

export interface ConversationChannelEvents {
  new_message: Message;
  message_updated: { id: string; content: string; updated_at: string };
  message_deleted: { id: string };
  typing: { user_id: string };
  stop_typing: { user_id: string };
  reaction_added: { message_id: string; emoji: string; user_id: string };
  reaction_removed: { message_id: string; emoji: string; user_id: string };
  read_receipt: { user_id: string; last_read_at: string; last_read_message_id: string };
}

export class ConversationChannel {
  private channel: Channel | null = null;
  private presence: Presence | null = null;
  private conversationId: string;
  private client: PhoenixClient;

  constructor(client: PhoenixClient, conversationId: string) {
    this.client = client;
    this.conversationId = conversationId;
  }

  /**
   * Join the conversation channel
   */
  join(): Channel | null {
    this.channel = this.client.joinChannel({
      topic: `conversation:${this.conversationId}`,
    });

    if (this.channel) {
      this.presence = new Presence(this.channel);
    }

    return this.channel;
  }

  /**
   * Leave the conversation channel
   */
  leave(): void {
    this.client.leaveChannel(`conversation:${this.conversationId}`);
    this.channel = null;
    this.presence = null;
  }

  /**
   * Subscribe to new messages
   */
  onMessage(handler: (message: Message) => void): () => void {
    if (!this.channel) {
      return () => {};
    }
    return createChannelHandler(this.channel, 'new_message', handler);
  }

  /**
   * Subscribe to message updates
   */
  onMessageUpdated(
    handler: (event: ConversationChannelEvents['message_updated']) => void
  ): () => void {
    if (!this.channel) {
      return () => {};
    }
    return createChannelHandler(this.channel, 'message_updated', handler);
  }

  /**
   * Subscribe to message deletions
   */
  onMessageDeleted(
    handler: (event: ConversationChannelEvents['message_deleted']) => void
  ): () => void {
    if (!this.channel) {
      return () => {};
    }
    return createChannelHandler(this.channel, 'message_deleted', handler);
  }

  /**
   * Subscribe to typing indicators
   */
  onTyping(handler: (event: ConversationChannelEvents['typing']) => void): () => void {
    if (!this.channel) {
      return () => {};
    }
    return createChannelHandler(this.channel, 'typing', handler);
  }

  /**
   * Subscribe to reactions
   */
  onReactionAdded(
    handler: (event: ConversationChannelEvents['reaction_added']) => void
  ): () => void {
    if (!this.channel) {
      return () => {};
    }
    return createChannelHandler(this.channel, 'reaction_added', handler);
  }

  /**
   * Subscribe to presence changes
   */
  onPresenceChange(
    onSync: (presences: PresenceState) => void,
    onDiff?: (diff: PresenceDiff) => void
  ): void {
    if (!this.presence) {
      return;
    }

    this.presence.onSync(() => {
      const presences = this.presence?.list() || {};
      onSync(presences as PresenceState);
    });

    if (onDiff) {
      this.presence.onDiff((diff) => {
        onDiff(diff as unknown as PresenceDiff);
      });
    }
  }

  /**
   * Send a message
   */
  async sendMessage(
    content: string,
    options?: {
      attachments?: MessageAttachment[];
      replyToId?: string;
      encrypted?: boolean;
    }
  ): Promise<Message> {
    if (!this.channel) {
      throw new Error('Channel not joined');
    }
    return pushToChannel(this.channel, 'send_message', {
      content,
      ...options,
    });
  }

  /**
   * Edit a message
   */
  async editMessage(messageId: string, content: string): Promise<void> {
    if (!this.channel) {
      throw new Error('Channel not joined');
    }
    await pushToChannel(this.channel, 'edit_message', {
      message_id: messageId,
      content,
    });
  }

  /**
   * Delete a message
   */
  async deleteMessage(messageId: string): Promise<void> {
    if (!this.channel) {
      throw new Error('Channel not joined');
    }
    await pushToChannel(this.channel, 'delete_message', {
      message_id: messageId,
    });
  }

  /**
   * Send typing indicator
   */
  startTyping(): void {
    if (!this.channel) {
      return;
    }
    this.channel.push('typing', {});
  }

  /**
   * Stop typing indicator
   */
  stopTyping(): void {
    if (!this.channel) {
      return;
    }
    this.channel.push('stop_typing', {});
  }

  /**
   * Add reaction to message
   */
  async addReaction(messageId: string, emoji: string): Promise<void> {
    if (!this.channel) {
      throw new Error('Channel not joined');
    }
    await pushToChannel(this.channel, 'add_reaction', {
      message_id: messageId,
      emoji,
    });
  }

  /**
   * Remove reaction from message
   */
  async removeReaction(messageId: string, emoji: string): Promise<void> {
    if (!this.channel) {
      throw new Error('Channel not joined');
    }
    await pushToChannel(this.channel, 'remove_reaction', {
      message_id: messageId,
      emoji,
    });
  }

  /**
   * Mark messages as read
   */
  async markRead(lastReadMessageId: string): Promise<void> {
    if (!this.channel) {
      throw new Error('Channel not joined');
    }
    await pushToChannel(this.channel, 'mark_read', {
      last_read_message_id: lastReadMessageId,
    });
  }
}
