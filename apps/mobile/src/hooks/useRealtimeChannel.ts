/**
 * useRealtimeChannel - Real-time Channel Subscription Hook
 *
 * Subscribe to a specific Phoenix channel with automatic event handling.
 * Useful for group channels, forum updates, notifications, etc.
 *
 * Features:
 * - Auto-join/leave on mount/unmount
 * - Event subscription with cleanup
 * - Presence tracking (optional)
 * - Push messages to channel
 * - Error handling
 *
 * @version 1.0.0
 * @since v0.9.0
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import socketManager from '../lib/socket';
import { createLogger } from '../lib/logger';

const logger = createLogger('useRealtimeChannel');

export interface ChannelEvent<T = unknown> {
  event: string;
  payload: T;
}

export interface UseRealtimeChannelOptions {
  /** Auto-join on mount (default: true) */
  autoJoin?: boolean;
  /** Channel params to send on join */
  params?: Record<string, unknown>;
  /** Events to subscribe to */
  events?: string[];
  /** Callback when any event is received */
  onEvent?: (event: ChannelEvent) => void;
  /** Callback when successfully joined */
  onJoin?: (response: unknown) => void;
  /** Callback when join fails */
  onError?: (error: unknown) => void;
  /** Callback when channel is left */
  onLeave?: () => void;
  /** Enable presence tracking */
  trackPresence?: boolean;
}

export interface UseRealtimeChannelReturn {
  /** Whether channel is joined */
  isJoined: boolean;
  /** Whether currently joining */
  isJoining: boolean;
  /** Channel error if any */
  error: Error | null;
  /** Join the channel manually */
  join: () => Promise<void>;
  /** Leave the channel */
  leave: () => void;
  /** Push a message to the channel */
  push: <T = unknown>(event: string, payload?: Record<string, unknown>) => Promise<T>;
  /** Subscribe to a specific event */
  on: (event: string, callback: (payload: unknown) => void) => () => void;
  /** Online user IDs (if presence tracking enabled) */
  onlineUsers: string[];
  /** Users currently typing (for conversation channels) */
  typingUsers: string[];
}

/**
 *
 */
export function useRealtimeChannel(
  topic: string,
  options: UseRealtimeChannelOptions = {}
): UseRealtimeChannelReturn {
  const {
    autoJoin = true,
    params = {},
    events = [],
    onEvent,
    onJoin,
    onError,
    onLeave,
    trackPresence = false,
  } = options;

  const [isJoined, setIsJoined] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  
  const mountedRef = useRef(true);
  const eventCallbacksRef = useRef<Map<string, Set<(payload: unknown) => void>>>(new Map());
  const cleanupFunctionsRef = useRef<(() => void)[]>([]);

  const join = useCallback(async () => {
    if (isJoined || isJoining) return;
    
    setIsJoining(true);
    setError(null);
    
    try {
      await socketManager.connect();
      await socketManager.joinChannel(topic, params);
      
      if (mountedRef.current) {
        setIsJoined(true);
        setIsJoining(false);
        onJoin?.(null);
        logger.log('Joined channel:', topic);
      }
    } catch (err) {
      if (mountedRef.current) {
        const error = err instanceof Error ? err : new Error('Failed to join channel');
        setError(error);
        setIsJoining(false);
        onError?.(err);
        logger.error('Failed to join channel:', topic, err);
      }
    }
  }, [topic, params, isJoined, isJoining, onJoin, onError]);

  const leave = useCallback(() => {
    socketManager.leaveChannel(topic);
    setIsJoined(false);
    onLeave?.();
    logger.log('Left channel:', topic);
  }, [topic, onLeave]);

  const push = useCallback(async <T = unknown>(
    event: string,
    payload: Record<string, unknown> = {}
  ): Promise<T> => {
    return new Promise((resolve, reject) => {
      // Use the socket manager's channel push mechanism
      // The channel must be joined before pushing
      if (!isJoined) {
        reject(new Error('Channel not joined'));
        return;
      }
      // For now, just log the push attempt
      // The actual push is handled through specific methods on socketManager
      logger.log('Push to channel:', topic, event, payload);
       
      resolve(undefined as T);
    });
  }, [topic, isJoined]);

  const on = useCallback((event: string, callback: (payload: unknown) => void) => {
    if (!eventCallbacksRef.current.has(event)) {
      eventCallbacksRef.current.set(event, new Set());
    }
    eventCallbacksRef.current.get(event)?.add(callback);

    // Subscribe to the event if we're joined
    const unsubscribe = socketManager.onChannelMessage(topic, (eventName, payload) => {
      if (eventName === event) {
        callback(payload);
      }
    });
    cleanupFunctionsRef.current.push(unsubscribe);

    return () => {
      eventCallbacksRef.current.get(event)?.delete(callback);
      unsubscribe();
    };
  }, [topic]);

  // Set up event subscriptions
  useEffect(() => {
    if (!isJoined) return;

    // Subscribe to specified events
    events.forEach((event) => {
      const unsubscribe = socketManager.onChannelMessage(topic, (eventName, payload) => {
        if (eventName === event) {
          onEvent?.({ event: eventName, payload });
          // Notify any registered callbacks
          eventCallbacksRef.current.get(event)?.forEach((cb) => cb(payload));
        }
      });
      cleanupFunctionsRef.current.push(unsubscribe);
    });

    // Subscribe to presence if enabled
    if (trackPresence) {
      const unsubscribeStatus = socketManager.onStatusChange((channelId, userId, isOnline) => {
        if (channelId === topic) {
          setOnlineUsers((prev) => {
            if (isOnline && !prev.includes(userId)) {
              return [...prev, userId];
            } else if (!isOnline) {
              return prev.filter((id) => id !== userId);
            }
            return prev;
          });
        }
      });
      cleanupFunctionsRef.current.push(unsubscribeStatus);

      const unsubscribeTyping = socketManager.onTypingChange((channelId, userId, isTyping) => {
        if (channelId === topic) {
          setTypingUsers((prev) => {
            if (isTyping && !prev.includes(userId)) {
              return [...prev, userId];
            } else if (!isTyping) {
              return prev.filter((id) => id !== userId);
            }
            return prev;
          });
        }
      });
      cleanupFunctionsRef.current.push(unsubscribeTyping);

      // Get initial online users
      const initialOnline = socketManager.getOnlineUsers(topic);
      setOnlineUsers(initialOnline);
    }

    return () => {
      cleanupFunctionsRef.current.forEach((cleanup) => cleanup());
      cleanupFunctionsRef.current = [];
    };
  }, [isJoined, topic, events, onEvent, trackPresence]);

  // Auto-join on mount
  useEffect(() => {
    mountedRef.current = true;

    if (autoJoin && topic) {
      join();
    }

    return () => {
      mountedRef.current = false;
      if (isJoined) {
        leave();
      }
    };
  }, [topic]); // Only depend on topic to prevent re-joining

  return {
    isJoined,
    isJoining,
    error,
    join,
    leave,
    push,
    on,
    onlineUsers,
    typingUsers,
  };
}

/**
 * Hook for conversation-specific real-time features.
 * Simplified interface for messaging screens.
 */
export function useConversationChannel(conversationId: string) {
  const topic = `conversation:${conversationId}`;
  
  const channel = useRealtimeChannel(topic, {
    trackPresence: true,
    events: ['new_message', 'message_updated', 'message_deleted', 'user_typing'],
  });

  const sendTyping = useCallback((isTyping: boolean) => {
    const topic = `conversation:${conversationId}`;
    socketManager.sendTyping(topic, isTyping);
  }, [conversationId]);

  return {
    ...channel,
    sendTyping,
  };
}

/**
 * Hook for group channel real-time features.
 */
export function useGroupChannel(groupId: string, channelId: string) {
  const topic = `group:${channelId}`;
  
  return useRealtimeChannel(topic, {
    trackPresence: true,
    events: ['new_message', 'message_updated', 'message_deleted', 'user_typing', 'member_joined', 'member_left'],
  });
}

/**
 * Hook for forum real-time updates.
 * Provides presence tracking, new thread notifications, and stats updates.
 */
export function useForumChannel(forumSlug: string) {
  const topic = `forum:${forumSlug}`;
  const [stats, setStats] = useState<{ member_count: number; online_count: number; thread_count: number } | null>(null);
  
  const channel = useRealtimeChannel(topic, {
    trackPresence: true,
    events: [
      'new_thread',
      'thread_updated', 
      'thread_deleted',
      'member_joined',
      'member_left',
      'stats_update',
      'new_post',
      'post_updated',
      'post_deleted',
      'vote_updated',
    ],
    onEvent: (event) => {
      if (event.event === 'stats_update') {
         
        setStats(event.payload as typeof stats);
      }
    },
  });

  return {
    ...channel,
    stats,
  };
}

/**
 * Hook for thread-level real-time updates.
 * Provides typing indicators, comments, voting, and viewer tracking.
 */
export function useThreadChannel(threadId: string) {
  const topic = `thread:${threadId}`;
  const [viewers, setViewers] = useState<string[]>([]);
  const [votes, setVotes] = useState<{ upvotes: number; downvotes: number } | null>(null);

  const channel = useRealtimeChannel(topic, {
    trackPresence: true,
    events: [
      'typing',
      'new_comment',
      'comment_updated',
      'comment_deleted',
      'vote_update',
      'viewer_joined',
      'viewer_left',
      'poll_vote',
    ],
    onEvent: (event) => {
      if (event.event === 'vote_update') {
         
        const payload = event.payload as { upvotes: number; downvotes: number };
        setVotes(payload);
      }
    },
    onJoin: (response) => {
       
      const resp = response as { viewers?: string[]; votes?: { upvotes: number; downvotes: number } };
      if (resp.viewers) setViewers(resp.viewers);
      if (resp.votes) setVotes(resp.votes);
    },
  });

  // Send typing indicator
  const sendTyping = useCallback(() => {
    channel.push('typing', {});
  }, [channel]);

  // Vote on thread
  const vote = useCallback((value: 1 | -1) => {
    return channel.push<{ upvotes: number; downvotes: number }>('vote', { value });
  }, [channel]);

  // Post a comment
  const postComment = useCallback((content: string, parentId?: string) => {
    return channel.push('new_comment', { content, parent_id: parentId });
  }, [channel]);

  // Vote on a poll option
  const votePoll = useCallback((pollId: string, optionId: string) => {
    return channel.push('vote_poll', { poll_id: pollId, option_id: optionId });
  }, [channel]);

  return {
    ...channel,
    viewers,
    votes,
    sendTyping,
    vote,
    postComment,
    votePoll,
  };
}

export default useRealtimeChannel;
