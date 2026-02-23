/**
 * Hook for forum real-time socket connection.
 * @module
 */
import { useEffect, useCallback, useState, useRef } from 'react';
import {
  socketManager,
  ForumPresenceMember,
  ForumStatsPayload,
  ForumThreadPayload,
  ForumUserPayload,
} from '@/lib/socket';

export interface UseForumSocketOptions {
  /** Called when a new thread is created in the forum */
  onNewThread?: (thread: ForumThreadPayload) => void;
  /** Called when a thread is pinned/unpinned */
  onThreadPinned?: (data: { thread_id: string; is_pinned: boolean }) => void;
  /** Called when a thread is locked/unlocked */
  onThreadLocked?: (data: { thread_id: string; is_locked: boolean }) => void;
  /** Called when a thread is deleted */
  onThreadDeleted?: (data: { thread_id: string }) => void;
  /** Called when a new member joins the forum */
  onMemberJoined?: (user: ForumUserPayload) => void;
  /** Called when a member leaves the forum */
  onMemberLeft?: (data: { user_id: string }) => void;
  /** Called when forum stats change */
  onStatsUpdate?: (stats: ForumStatsPayload) => void;
}

export interface UseForumSocketReturn {
  /** List of online members in the forum */
  onlineMembers: ForumPresenceMember[];
  /** Current forum stats */
  stats: ForumStatsPayload | null;
  /** Whether connected to the forum channel */
  isConnected: boolean;
  /** Subscribe to the forum for notifications */
  subscribe: () => Promise<void>;
  /** Unsubscribe from the forum */
  unsubscribe: () => Promise<void>;
}

/**
 * Hook for real-time forum updates via WebSocket.
 *
 * Automatically joins the forum channel when mounted and leaves when unmounted.
 * Provides real-time updates for:
 * - New threads
 * - Thread pinned/locked/deleted
 * - Member join/leave
 * - Online presence
 * - Forum stats
 *
 * @param forumId - The forum ID to connect to (undefined to skip connection)
 * @param options - Callbacks for forum events
 * @returns Forum socket state and methods
 *
 * @example
 * ```tsx
 * const { onlineMembers, stats, subscribe } = useForumSocket(forumId, {
 *   onNewThread: (thread) => {
 *     // Prepend new thread to list
 *     setThreads(prev => [thread, ...prev]);
 *   },
 *   onStatsUpdate: (newStats) => {
 *     // Update displayed stats
 *     setStats(newStats);
 *   }
 * });
 * ```
 */
export function useForumSocket(
  forumId: string | undefined,
  options: UseForumSocketOptions = {}
): UseForumSocketReturn {
  const [onlineMembers, setOnlineMembers] = useState<ForumPresenceMember[]>([]);
  const [stats, setStats] = useState<ForumStatsPayload | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Use refs to avoid stale closures in callbacks
  const optionsRef = useRef(options);
  optionsRef.current = options;

  useEffect(() => {
    if (!forumId) {
      setOnlineMembers([]);
      setStats(null);
      setIsConnected(false);
      return;
    }

    // Ensure socket is connected
    socketManager.connect().then(() => {
      const channel = socketManager.joinForum(forumId, {
        onNewThread: (thread) => {
          optionsRef.current.onNewThread?.(thread);
        },
        onThreadPinned: (data) => {
          optionsRef.current.onThreadPinned?.(data);
        },
        onThreadLocked: (data) => {
          optionsRef.current.onThreadLocked?.(data);
        },
        onThreadDeleted: (data) => {
          optionsRef.current.onThreadDeleted?.(data);
        },
        onMemberJoined: (user) => {
          optionsRef.current.onMemberJoined?.(user);
        },
        onMemberLeft: (data) => {
          optionsRef.current.onMemberLeft?.(data);
        },
        onStatsUpdate: (newStats) => {
          setStats(newStats);
          optionsRef.current.onStatsUpdate?.(newStats);
        },
        onPresenceSync: (members) => {
          setOnlineMembers(members);
        },
      });

      if (channel) {
        setIsConnected(true);
      }
    });

    return () => {
      socketManager.leaveForum(forumId);
      setIsConnected(false);
    };
  }, [forumId]);

  const subscribe = useCallback(async () => {
    if (!forumId) return;
    await socketManager.subscribeToForum(forumId);
  }, [forumId]);

  const unsubscribe = useCallback(async () => {
    if (!forumId) return;
    await socketManager.unsubscribeFromForum(forumId);
  }, [forumId]);

  return {
    onlineMembers,
    stats,
    isConnected,
    subscribe,
    unsubscribe,
  };
}

export default useForumSocket;
