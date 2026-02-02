/**
 * Group Channel
 *
 * Handles real-time group chat events:
 * - Group messages
 * - Member updates
 * - Channel management
 */

import { Channel, Presence } from 'phoenix';
import type { PhoenixClient } from '../phoenixClient';
import { createChannelHandler, pushToChannel } from '../phoenixClient';
import type { PresenceState } from '../types';

export interface GroupMessage {
  id: string;
  channel_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  attachments?: Array<{ type: string; url: string; name: string }>;
}

export interface GroupMember {
  id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'moderator' | 'member';
  joined_at: string;
}

export interface GroupChannelEvents {
  new_message: GroupMessage;
  message_updated: { id: string; content: string };
  message_deleted: { id: string };
  member_joined: { user_id: string; member: GroupMember };
  member_left: { user_id: string };
  member_updated: { user_id: string; role: string };
  typing: { user_id: string; channel_id: string };
}

export class GroupChannel {
  private channel: Channel | null = null;
  private presence: Presence | null = null;
  private groupId: string;
  private client: PhoenixClient;

  constructor(client: PhoenixClient, groupId: string) {
    this.client = client;
    this.groupId = groupId;
  }

  /**
   * Join the group channel
   */
  join(): Channel | null {
    this.channel = this.client.joinChannel({
      topic: `group:${this.groupId}`,
    });

    if (this.channel) {
      this.presence = new Presence(this.channel);
    }

    return this.channel;
  }

  /**
   * Leave the group channel
   */
  leave(): void {
    this.client.leaveChannel(`group:${this.groupId}`);
    this.channel = null;
    this.presence = null;
  }

  /**
   * Subscribe to new messages
   */
  onMessage(handler: (message: GroupMessage) => void): () => void {
    if (!this.channel) {
      return () => {};
    }
    return createChannelHandler(this.channel, 'new_message', handler);
  }

  /**
   * Subscribe to member updates
   */
  onMemberJoined(handler: (event: GroupChannelEvents['member_joined']) => void): () => void {
    if (!this.channel) {
      return () => {};
    }
    return createChannelHandler(this.channel, 'member_joined', handler);
  }

  /**
   * Subscribe to member leaving
   */
  onMemberLeft(handler: (event: GroupChannelEvents['member_left']) => void): () => void {
    if (!this.channel) {
      return () => {};
    }
    return createChannelHandler(this.channel, 'member_left', handler);
  }

  /**
   * Subscribe to typing indicators
   */
  onTyping(handler: (event: GroupChannelEvents['typing']) => void): () => void {
    if (!this.channel) {
      return () => {};
    }
    return createChannelHandler(this.channel, 'typing', handler);
  }

  /**
   * Subscribe to presence
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
   * Send a message to a channel
   */
  async sendMessage(channelId: string, content: string): Promise<GroupMessage> {
    if (!this.channel) {
      throw new Error('Channel not joined');
    }
    return pushToChannel(this.channel, 'send_message', {
      channel_id: channelId,
      content,
    });
  }

  /**
   * Send typing indicator
   */
  startTyping(channelId: string): void {
    if (!this.channel) {
      return;
    }
    this.channel.push('typing', { channel_id: channelId });
  }
}
