/**
 * Hook for thread real-time socket connection.
 * @module
 */
import { useEffect, useCallback, useState, useRef } from 'react';
import {
  socketManager,
  ThreadCommentPayload,
  ThreadVotePayload,
  CommentVotePayload,
  ThreadTypingPayload,
  ThreadPollPayload,
  ThreadPollData,
  ThreadViewerPayload,
} from '@/lib/socket';

export interface UseThreadSocketOptions {
  /** Called when a new comment is posted */
  onNewComment?: (comment: ThreadCommentPayload) => void;
  /** Called when a comment is edited */
  onCommentEdited?: (comment: ThreadCommentPayload) => void;
  /** Called when a comment is deleted */
  onCommentDeleted?: (data: { comment_id: string }) => void;
  /** Called when thread votes change */
  onVoteChanged?: (data: ThreadVotePayload) => void;
  /** Called when comment votes change */
  onCommentVoteChanged?: (data: CommentVotePayload) => void;
  /** Called when poll is updated */
  onPollUpdated?: (data: ThreadPollPayload) => void;
  /** Called when thread is locked/pinned */
  onThreadStatusChanged?: (data: {
    thread_id: string;
    is_locked: boolean;
    is_pinned: boolean;
  }) => void;
}

export interface UseThreadSocketReturn {
  /** List of users currently viewing the thread */
  viewers: ThreadViewerPayload[];
  /** Users currently typing */
  typingUsers: ThreadTypingPayload[];
  /** Current vote counts */
  votes: ThreadVotePayload | null;
  /** Whether connected to the thread channel */
  isConnected: boolean;
  /** Vote on the thread (1 = upvote, -1 = downvote, 0 = remove vote) */
  vote: (value: 1 | -1 | 0) => Promise<ThreadVotePayload>;
  /** Vote on a comment */
  voteComment: (commentId: string, value: 1 | -1 | 0) => Promise<CommentVotePayload>;
  /** Post a comment */
  postComment: (content: string, parentId?: string) => Promise<{ comment_id: string }>;
  /** Send typing indicator */
  sendTyping: (isTyping: boolean) => void;
  /** Vote on a poll option */
  votePoll: (optionId: string) => Promise<{ poll: ThreadPollData }>;
}

/**
 * Hook for real-time thread updates via WebSocket.
 *
 * Automatically joins the thread channel when mounted and leaves when unmounted.
 * Provides real-time updates for:
 * - New comments
 * - Comment edits/deletions
 * - Vote changes (thread and comments)
 * - Typing indicators
 * - Poll updates
 * - Viewer presence
 *
 * @param threadId - The thread ID to connect to (undefined to skip connection)
 * @param options - Callbacks for thread events
 * @returns Thread socket state and methods
 *
 * @example
 * ```tsx
 * const { viewers, votes, vote, postComment, sendTyping } = useThreadSocket(threadId, {
 *   onNewComment: (comment) => {
 *     // Add comment to tree
 *     setComments(prev => [...prev, comment]);
 *   },
 *   onVoteChanged: (data) => {
 *     // Update vote display
 *     setVotes(data);
 *   }
 * });
 *
 * // Vote on thread
 * await vote(1); // upvote
 *
 * // Post a comment
 * await postComment("Great thread!", parentCommentId);
 *
 * // Send typing indicator
 * sendTyping(true);
 * ```
 */
export function useThreadSocket(
  threadId: string | undefined,
  options: UseThreadSocketOptions = {}
): UseThreadSocketReturn {
  const [viewers, setViewers] = useState<ThreadViewerPayload[]>([]);
  const [typingUsers, setTypingUsers] = useState<ThreadTypingPayload[]>([]);
  const [votes, setVotes] = useState<ThreadVotePayload | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Use refs to avoid stale closures in callbacks
  const optionsRef = useRef(options);
  optionsRef.current = options;

  // Track typing users with timeout for auto-removal
  const typingTimeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  useEffect(() => {
    if (!threadId) {
      setViewers([]);
      setTypingUsers([]);
      setVotes(null);
      setIsConnected(false);
      return;
    }

    // Ensure socket is connected
    socketManager.connect().then(() => {
      const channel = socketManager.joinThread(threadId, {
        onNewComment: (comment) => {
          optionsRef.current.onNewComment?.(comment);
        },
        onCommentEdited: (comment) => {
          optionsRef.current.onCommentEdited?.(comment);
        },
        onCommentDeleted: (data) => {
          optionsRef.current.onCommentDeleted?.(data);
        },
        onVoteChanged: (data) => {
          setVotes(data);
          optionsRef.current.onVoteChanged?.(data);
        },
        onCommentVoteChanged: (data) => {
          optionsRef.current.onCommentVoteChanged?.(data);
        },
        onTyping: (data) => {
          // Update typing users with auto-timeout
          if (data.is_typing) {
            // Clear existing timeout for this user
            const existingTimeout = typingTimeoutsRef.current.get(data.user_id);
            if (existingTimeout) {
              clearTimeout(existingTimeout);
            }

            // Add user to typing list
            setTypingUsers((prev) => {
              const filtered = prev.filter((u) => u.user_id !== data.user_id);
              return [...filtered, data];
            });

            // Set timeout to remove after 5 seconds if no update
            const timeout = setTimeout(() => {
              setTypingUsers((prev) => prev.filter((u) => u.user_id !== data.user_id));
              typingTimeoutsRef.current.delete(data.user_id);
            }, 5000);
            typingTimeoutsRef.current.set(data.user_id, timeout);
          } else {
            // Remove user from typing list
            setTypingUsers((prev) => prev.filter((u) => u.user_id !== data.user_id));
            const timeout = typingTimeoutsRef.current.get(data.user_id);
            if (timeout) {
              clearTimeout(timeout);
              typingTimeoutsRef.current.delete(data.user_id);
            }
          }
        },
        onPollUpdated: (data) => {
          optionsRef.current.onPollUpdated?.(data);
        },
        onThreadStatusChanged: (data) => {
          optionsRef.current.onThreadStatusChanged?.(data);
        },
        onPresenceSync: (viewersList) => {
          setViewers(viewersList);
          // Update typing based on presence
          const typingFromPresence = viewersList
            .filter((v) => v.typing)
            .map((v) => ({
              user_id: v.user_id,
              username: v.username,
              display_name: v.display_name,
              is_typing: true,
            }));
          if (typingFromPresence.length > 0) {
            setTypingUsers(typingFromPresence);
          }
        },
      });

      if (channel) {
        setIsConnected(true);
      }
    });

    return () => {
      // Clear all typing timeouts
      typingTimeoutsRef.current.forEach((timeout) => clearTimeout(timeout));
      typingTimeoutsRef.current.clear();

      socketManager.leaveThread(threadId);
      setIsConnected(false);
    };
  }, [threadId]);

  const vote = useCallback(
    async (value: 1 | -1 | 0): Promise<ThreadVotePayload> => {
      if (!threadId) throw new Error('No thread ID');
      const result = await socketManager.voteOnThread(threadId, value);
      setVotes(result);
      return result;
    },
    [threadId]
  );

  const voteComment = useCallback(
    async (commentId: string, value: 1 | -1 | 0): Promise<CommentVotePayload> => {
      if (!threadId) throw new Error('No thread ID');
      return socketManager.voteOnComment(threadId, commentId, value);
    },
    [threadId]
  );

  const postComment = useCallback(
    async (content: string, parentId?: string): Promise<{ comment_id: string }> => {
      if (!threadId) throw new Error('No thread ID');
      return socketManager.sendComment(threadId, content, parentId);
    },
    [threadId]
  );

  const sendTyping = useCallback(
    (isTyping: boolean) => {
      if (!threadId) return;
      socketManager.sendThreadTyping(threadId, isTyping);
    },
    [threadId]
  );

  const votePoll = useCallback(
    async (optionId: string): Promise<{ poll: ThreadPollData }> => {
      if (!threadId) throw new Error('No thread ID');
      return socketManager.voteOnPoll(threadId, optionId);
    },
    [threadId]
  );

  return {
    viewers,
    typingUsers,
    votes,
    isConnected,
    vote,
    voteComment,
    postComment,
    sendTyping,
    votePoll,
  };
}

export default useThreadSocket;
