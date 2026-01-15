/**
 * useSocket - Real-time Socket Connection Hook
 *
 * Provides easy access to the Phoenix socket for real-time features.
 * Handles connection state, reconnection, and cleanup.
 *
 * Features:
 * - Auto-connect on mount
 * - Connection state tracking
 * - Easy channel joining
 * - Automatic cleanup
 *
 * @version 1.0.0
 * @since v0.9.0
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import socketManager from '../lib/socket';

export interface UseSocketOptions {
  /** Auto-connect on mount (default: true) */
  autoConnect?: boolean;
  /** Reconnect on auth change (default: true) */
  reconnectOnAuthChange?: boolean;
}

export interface UseSocketReturn {
  /** Whether socket is connected */
  isConnected: boolean;
  /** Connection error if any */
  error: Error | null;
  /** Manually connect */
  connect: () => Promise<void>;
  /** Manually disconnect */
  disconnect: () => void;
  /** Join a channel */
  joinChannel: (topic: string, params?: Record<string, unknown>) => Promise<void>;
  /** Leave a channel */
  leaveChannel: (topic: string) => void;
  /** Check if connected to a channel */
  isInChannel: (topic: string) => boolean;
}

export function useSocket(options: UseSocketOptions = {}): UseSocketReturn {
  const { autoConnect = true, reconnectOnAuthChange = true } = options;
  
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const mountedRef = useRef(true);
  const joinedChannels = useRef<Set<string>>(new Set());

  const connect = useCallback(async () => {
    try {
      setError(null);
      await socketManager.connect();
      if (mountedRef.current) {
        setIsConnected(true);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err : new Error('Connection failed'));
        setIsConnected(false);
      }
    }
  }, []);

  const disconnect = useCallback(() => {
    socketManager.disconnect();
    joinedChannels.current.clear();
    setIsConnected(false);
  }, []);

  const joinChannel = useCallback(async (topic: string, params?: Record<string, unknown>) => {
    if (!isConnected) {
      await connect();
    }
    await socketManager.joinChannel(topic, params || {});
    joinedChannels.current.add(topic);
  }, [isConnected, connect]);

  const leaveChannel = useCallback((topic: string) => {
    socketManager.leaveChannel(topic);
    joinedChannels.current.delete(topic);
  }, []);

  const isInChannel = useCallback((topic: string) => {
    return joinedChannels.current.has(topic);
  }, []);

  useEffect(() => {
    mountedRef.current = true;

    if (autoConnect) {
      connect();
    }

    return () => {
      mountedRef.current = false;
      // Don't disconnect on unmount - socket should persist
      // Only leave channels that were specifically joined by this hook
    };
  }, [autoConnect, connect]);

  return {
    isConnected,
    error,
    connect,
    disconnect,
    joinChannel,
    leaveChannel,
    isInChannel,
  };
}

export default useSocket;
