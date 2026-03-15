/**
 * Hook for board-level real-time socket connection.
 * @module
 */
import { useEffect, useState, useRef } from 'react';
import { socketManager } from '@/lib/socket';

/** Payload for a board thread broadcast */
export interface BoardThreadPayload {
  id: string;
  title: string;
  slug: string;
  author_id: string;
  inserted_at: string;
  is_pinned: boolean;
  is_locked: boolean;
}

export interface UseBoardSocketOptions {
  /** Called when a new thread is created in the board */
  onNewThread?: (thread: BoardThreadPayload) => void;
  /** Called when a thread is updated */
  onThreadUpdated?: (thread: BoardThreadPayload) => void;
  /** Called when a thread is deleted */
  onThreadDeleted?: (data: { thread_id: string }) => void;
}

export interface UseBoardSocketReturn {
  /** Number of viewers currently on the board */
  viewers: number;
  /** Whether connected to the board channel */
  isConnected: boolean;
}

/**
 * Hook for real-time board updates via WebSocket.
 *
 * Automatically joins the board channel when mounted and leaves when unmounted.
 * Provides real-time updates for:
 * - New threads
 * - Thread updates
 * - Thread deletions
 * - Viewer presence
 *
 * @param boardId - The board ID to connect to (undefined to skip connection)
 * @param options - Callbacks for board events
 * @returns Board socket state
 *
 * @example
 * ```tsx
 * const { viewers, isConnected } = useBoardSocket(boardId, {
 *   onNewThread: (thread) => {
 *     setThreads(prev => [thread, ...prev]);
 *   },
 *   onThreadDeleted: ({ thread_id }) => {
 *     setThreads(prev => prev.filter(t => t.id !== thread_id));
 *   }
 * });
 * ```
 */
export function useBoardSocket(
  boardId: string | undefined,
  options: UseBoardSocketOptions = {}
): UseBoardSocketReturn {
  const [viewers, setViewers] = useState(0);
  const [isConnected, setIsConnected] = useState(false);

  // Use refs to avoid stale closures in callbacks
  const optionsRef = useRef(options);
  optionsRef.current = options;

  useEffect(() => {
    if (!boardId) {
      setViewers(0);
      setIsConnected(false);
      return;
    }

    let channel: ReturnType<NonNullable<typeof socketManager.socket>['channel']> | null = null;

    socketManager.connect().then(() => {
      const socket = socketManager.socket;
      if (!socket) return;

      channel = socket.channel(`board:${boardId}`, {});

      channel.on('new_thread', (payload?: unknown) => {
         
        const data = payload as { thread: BoardThreadPayload } | undefined;
        if (data?.thread) optionsRef.current.onNewThread?.(data.thread);
      });

      channel.on('thread_updated', (payload?: unknown) => {
         
        const data = payload as { thread: BoardThreadPayload } | undefined;
        if (data?.thread) optionsRef.current.onThreadUpdated?.(data.thread);
      });

      channel.on('thread_deleted', (payload?: unknown) => {
         
        const data = payload as { thread_id: string } | undefined;
        if (data) optionsRef.current.onThreadDeleted?.(data);
      });

      channel.on('presence_state', (payload?: unknown) => {
         
        const state = payload as Record<string, unknown> | undefined;
        if (state) setViewers(Object.keys(state).length);
      });

      channel
        .join()
        .receive('ok', () => {
          setIsConnected(true);
        })
        .receive('error', () => {
          setIsConnected(false);
        });
    });

    return () => {
      if (channel) {
        channel.leave();
      }
      setIsConnected(false);
    };
  }, [boardId]);

  return { viewers, isConnected };
}

export default useBoardSocket;
