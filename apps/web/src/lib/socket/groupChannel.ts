/**
 * Group Channel Handlers
 *
 * Manages joining/leaving group (server) channels with
 * message events, typing indicators, and presence logging.
 *
 * @module lib/socket/groupChannel
 */

import type { Socket, Channel } from 'phoenix';
import { useGroupStore, type ChannelMessage } from '@/modules/groups/store';
import { socketLogger as logger } from '../logger';
import { normalizeMessage } from '../apiUtils';

/**
 * Convert a normalizeMessage() result to ChannelMessage shape.
 * normalizeMessage returns sender/senderId but ChannelMessage uses author/authorId.
 */
function toChannelMessage(raw: Record<string, unknown>): ChannelMessage {
  const normalized = normalizeMessage(raw);
  const sender = (normalized.sender ?? {}) as Record<string, unknown>;
  return {
    ...normalized,
    authorId: (normalized.senderId ?? sender.id ?? '') as string,
    author: {
      id: (sender.id ?? '') as string,
      username: (sender.username ?? '') as string,
      displayName: (sender.displayName ?? sender.display_name ?? null) as string | null,
      avatarUrl: (sender.avatarUrl ?? sender.avatar_url ?? null) as string | null,
      member: null,
    },
  } as unknown as ChannelMessage;
}

/**
 * Join a group channel and wire up message/typing handlers.
 */
export function joinGroupChannel(
  socket: Socket | null,
  channelId: string,
  channels: Map<string, Channel>,
  connectFn: () => Promise<void>
): Channel | null {
  const topic = `group:${channelId}`;

  if (channels.has(topic)) {
    return channels.get(topic)!;
  }

  if (!socket) {
    logger.warn('Cannot join group channel: socket not connected');
    connectFn();
    return null;
  }

  const channel = socket.channel(topic, {});

  channel.on('new_message', (payload) => {
     
    const data = payload as { message: Record<string, unknown> };
     
    const normalized = toChannelMessage(data.message);
    useGroupStore.getState().addChannelMessage(normalized);
  });

  channel.on('message_updated', (payload) => {
     
    const data = payload as { message: Record<string, unknown> };
     
    const normalized = toChannelMessage(data.message);
    useGroupStore.getState().updateChannelMessage(normalized);
  });

  channel.on('message_deleted', (payload) => {
     
    const data = payload as { message_id: string };
    useGroupStore.getState().removeChannelMessage(data.message_id, channelId);
  });

  channel.on('link_preview_updated', (payload) => {
     
    const data = payload as { message: Record<string, unknown> };
    if (data.message) {
      const normalized = toChannelMessage(data.message);
      useGroupStore.getState().updateChannelMessage(normalized);
    }
  });

  channel.on('typing', (payload) => {
     
    const data = payload as { user_id: string; is_typing: boolean };
    useGroupStore.getState().setTypingUser(channelId, data.user_id, data.is_typing);
  });

  channel.on('presence_state', (state) => logger.log('Channel presence state:', state));
  channel.on('presence_diff', (diff) => logger.log('Channel presence diff:', diff));

  channel
    .join()
    .receive('ok', () => logger.log(`Joined channel ${channelId}`))
    .receive('error', (resp: unknown) =>
      logger.error(`Failed to join channel ${channelId}:`, resp)
    );

  channels.set(topic, channel);
  return channel;
}

/**
 * Leave and clean up a group channel.
 */
export function leaveGroupChannel(channelId: string, channels: Map<string, Channel>): void {
  const topic = `group:${channelId}`;
  const channel = channels.get(topic);
  if (channel) {
    channel.leave();
    channels.delete(topic);
  }
}
