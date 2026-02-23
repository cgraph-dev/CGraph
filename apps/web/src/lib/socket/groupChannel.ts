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
 * Join a group channel and wire up message/typing handlers.
 */
export function joinGroupChannel(
  socket: Socket | null,
  channelId: string,
  channels: Map<string, Channel>,
  connectFn: () => Promise<void>
): Channel | null {
  const topic = `channel:${channelId}`;

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
    const normalized = normalizeMessage(data.message) as unknown as ChannelMessage; // safe downcast – structural boundary
    useGroupStore.getState().addChannelMessage(normalized);
  });

  channel.on('message_updated', (payload) => {
    const data = payload as { message: Record<string, unknown> };
    const normalized = normalizeMessage(data.message) as unknown as ChannelMessage; // safe downcast – structural boundary
    useGroupStore.getState().updateChannelMessage(normalized);
  });

  channel.on('message_deleted', (payload) => {
    const data = payload as { message_id: string };
    useGroupStore.getState().removeChannelMessage(data.message_id, channelId);
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
  const topic = `channel:${channelId}`;
  const channel = channels.get(topic);
  if (channel) {
    channel.leave();
    channels.delete(topic);
  }
}
