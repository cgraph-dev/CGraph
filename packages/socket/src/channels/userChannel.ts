/**
 * User Channel
 *
 * Handles user-specific real-time events like:
 * - Notifications
 * - Friend requests
 * - DM updates
 * - Presence
 */

import { Channel } from 'phoenix';
import type { PhoenixClient } from '../phoenixClient';
import { createChannelHandler, pushToChannel } from '../phoenixClient';

export interface UserChannelEvents {
  new_notification: { id: string; type: string; message: string; created_at: string };
  friend_request: { id: string; from_user: { id: string; username: string; avatar_url: string } };
  friend_request_accepted: { id: string; user: { id: string; username: string } };
  dm_update: { conversation_id: string; unread_count: number };
  status_update: { user_id: string; status: 'online' | 'away' | 'busy' | 'offline' };
}

export class UserChannel {
  private channel: Channel | null = null;
  private userId: string;
  private client: PhoenixClient;

  constructor(client: PhoenixClient, userId: string) {
    this.client = client;
    this.userId = userId;
  }

  /**
   * Join the user channel
   */
  join(): Channel | null {
    this.channel = this.client.joinChannel({
      topic: `user:${this.userId}`,
    });
    return this.channel;
  }

  /**
   * Leave the user channel
   */
  leave(): void {
    this.client.leaveChannel(`user:${this.userId}`);
    this.channel = null;
  }

  /**
   * Subscribe to new notifications
   */
  onNotification(
    handler: (notification: UserChannelEvents['new_notification']) => void
  ): () => void {
    if (!this.channel) {
      console.warn('Channel not joined');
      return () => {};
    }
    return createChannelHandler(this.channel, 'new_notification', handler);
  }

  /**
   * Subscribe to friend requests
   */
  onFriendRequest(handler: (request: UserChannelEvents['friend_request']) => void): () => void {
    if (!this.channel) {
      return () => {};
    }
    return createChannelHandler(this.channel, 'friend_request', handler);
  }

  /**
   * Subscribe to friend request acceptances
   */
  onFriendRequestAccepted(
    handler: (event: UserChannelEvents['friend_request_accepted']) => void
  ): () => void {
    if (!this.channel) {
      return () => {};
    }
    return createChannelHandler(this.channel, 'friend_request_accepted', handler);
  }

  /**
   * Subscribe to DM updates
   */
  onDMUpdate(handler: (event: UserChannelEvents['dm_update']) => void): () => void {
    if (!this.channel) {
      return () => {};
    }
    return createChannelHandler(this.channel, 'dm_update', handler);
  }

  /**
   * Update user status
   */
  async updateStatus(status: 'online' | 'away' | 'busy' | 'offline'): Promise<void> {
    if (!this.channel) {
      throw new Error('Channel not joined');
    }
    await pushToChannel(this.channel, 'update_status', { status });
  }

  /**
   * Mark notifications as read
   */
  async markNotificationsRead(notificationIds: string[]): Promise<void> {
    if (!this.channel) {
      throw new Error('Channel not joined');
    }
    await pushToChannel(this.channel, 'mark_read', { notification_ids: notificationIds });
  }
}
