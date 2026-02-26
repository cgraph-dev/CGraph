/**
 * Forum Channel Module
 *
 * Handles joining/leaving forum channels and forum subscription actions.
 * Extracted from SocketManager for maintainability.
 *
 * @module lib/socket/forumChannel
 */

import type { Socket, Channel, Presence } from 'phoenix';
import { socketLogger as logger } from '../logger';
import { setupForumHandlers } from './channelHandlers';
import type { ForumChannelCallbacks } from './types';

interface ForumChannelState {
  channels: Map<string, Channel>;
  presences: Map<string, Presence>;
  channelHandlersSetUp: Set<string>;
}

/**
 * Join a forum channel and set up handlers.
 */
export function joinForum(
  socket: Socket | null,
  forumId: string,
  state: ForumChannelState,
  forumCallbacks: Map<string, ForumChannelCallbacks>,
  callbacks?: ForumChannelCallbacks
): Channel | null {
  const topic = `forum:${forumId}`;

  if (callbacks) {
    forumCallbacks.set(forumId, callbacks);
  }

  const existingChannel = state.channels.get(topic);
  if (existingChannel) {
    const channelState = existingChannel.state;
    if (channelState === 'joined' || channelState === 'joining') return existingChannel;
    state.channels.delete(topic);
    state.channelHandlersSetUp.delete(topic);
    state.presences.delete(topic);
  }

  if (!socket?.isConnected()) {
    logger.warn('Cannot join forum: socket not connected');
    return null;
  }

  const channel = socket.channel(topic, {});
  state.channels.set(topic, channel);

  setupForumHandlers(
    channel,
    topic,
    forumId,
    {
      channels: state.channels,
      presences: state.presences,
      channelHandlersSetUp: state.channelHandlersSetUp,
    },
    () => forumCallbacks
  );

  channel
    .join()
    .receive('ok', () => logger.log(`Joined forum channel: ${forumId}`))
    .receive('error', (resp: unknown) => {
      logger.error(`Failed to join forum channel ${forumId}:`, resp);
      state.channels.delete(topic);
      state.channelHandlersSetUp.delete(topic);
      forumCallbacks.delete(forumId);
    });

  return channel;
}

/**
 * Leave a forum channel and clean up state.
 */
export function leaveForum(
  forumId: string,
  state: ForumChannelState,
  forumCallbacks: Map<string, ForumChannelCallbacks>
) {
  const topic = `forum:${forumId}`;
  const channel = state.channels.get(topic);
  if (channel) {
    logger.log(`Leaving forum: ${forumId}`);
    channel.leave();
    state.channels.delete(topic);
    state.channelHandlersSetUp.delete(topic);
    state.presences.delete(topic);
    forumCallbacks.delete(forumId);
  }
}

/**
 * Subscribe to a forum for notifications.
 */
export function subscribeToForum(
  forumId: string,
  channels: Map<string, Channel>
): Promise<{ subscribed: boolean }> {
  const topic = `forum:${forumId}`;
  const channel = channels.get(topic);
  if (!channel || channel.state !== 'joined') {
    return Promise.reject(new Error('Not connected to forum channel'));
  }
  return new Promise((resolve, reject) => {
    channel
      .push('subscribe', {})
       
      .receive('ok', (resp: unknown) => resolve(resp as { subscribed: boolean }))
      .receive('error', (resp: unknown) => reject(resp));
  });
}

/**
 * Unsubscribe from a forum.
 */
export function unsubscribeFromForum(
  forumId: string,
  channels: Map<string, Channel>
): Promise<{ subscribed: boolean }> {
  const topic = `forum:${forumId}`;
  const channel = channels.get(topic);
  if (!channel || channel.state !== 'joined') {
    return Promise.reject(new Error('Not connected to forum channel'));
  }
  return new Promise((resolve, reject) => {
    channel
      .push('unsubscribe', {})
       
      .receive('ok', (resp: unknown) => resolve(resp as { subscribed: boolean }))
      .receive('error', (resp: unknown) => reject(resp));
  });
}
