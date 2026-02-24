/**
 * Collaborative Editor Hook
 *
 * React hook for Yjs-powered collaborative editing with Phoenix Channels.
 * Provides document state, awareness, and connection management.
 *
 * @module collaboration/useCollaborativeEditor
 */

import { useEffect, useRef, useState, useMemo } from 'react';
import * as Y from 'yjs';
import { PhoenixProvider, getUserColor, type PhoenixProviderOptions } from './phoenix-provider';
import { useSocket } from '@/lib/socket';
import type { Awareness } from 'y-protocols/awareness';

export interface CollaboratorInfo {
  userId: string;
  name: string;
  color: string;
  cursor?: { anchor: number; head: number };
}

export interface UseCollaborativeEditorOptions {
  /** Document ID to connect to */
  documentId: string;
  /** Current user info */
  user: {
    id: string;
    name: string;
  };
  /** Called when connection status changes */
  onConnectionChange?: (connected: boolean) => void;
  /** Called when collaborators change */
  onCollaboratorsChange?: (collaborators: CollaboratorInfo[]) => void;
}

export interface UseCollaborativeEditorResult {
  /** Yjs document instance — bind to your editor */
  doc: Y.Doc;
  /** Yjs awareness for cursor/presence sync */
  awareness: Awareness | null;
  /** Whether initial state has been synced */
  synced: boolean;
  /** Whether connected to the collaboration server */
  connected: boolean;
  /** List of active collaborators */
  collaborators: CollaboratorInfo[];
  /** Provider instance for advanced usage */
  provider: PhoenixProvider | null;
}

/**
 * Hook for real-time collaborative editing.
 *
 * Usage:
 * ```tsx
 * const { doc, awareness, synced, collaborators } = useCollaborativeEditor({
 *   documentId: 'abc-123',
 *   user: { id: userId, name: displayName },
 * });
 *
 * // Bind doc to your rich text editor (Tiptap, Slate, ProseMirror, etc.)
 * ```
 */
export function useCollaborativeEditor(
  options: UseCollaborativeEditorOptions
): UseCollaborativeEditorResult {
  const { documentId, user, onConnectionChange, onCollaboratorsChange } = options;
  const { socket } = useSocket();

  const docRef = useRef<Y.Doc>(new Y.Doc());
  const providerRef = useRef<PhoenixProvider | null>(null);

  const [synced, setSynced] = useState(false);
  const [connected, setConnected] = useState(false);
  const [collaborators, setCollaborators] = useState<CollaboratorInfo[]>([]);

  const userColor = useMemo(() => getUserColor(user.id), [user.id]);

  // Connect to document channel
  useEffect(() => {
    if (!socket || !documentId) return;

    const doc = docRef.current;
    let syncCheckInterval: ReturnType<typeof setInterval> | null = null;

    // Join the document channel
    const channel = socket.channel(`document:${documentId}`, {});

    channel
      .join()
      .receive('ok', () => {
        setConnected(true);
        onConnectionChange?.(true);

        // Create Yjs provider
        const provider = new PhoenixProvider({
          doc,
          channel: channel as unknown as PhoenixProviderOptions['channel'], // safe downcast – structural boundary
          user: { id: user.id, name: user.name, color: userColor },
        });

        providerRef.current = provider;

        // Track sync status — store interval for cleanup
        syncCheckInterval = setInterval(() => {
          if (provider.isSynced) {
            setSynced(true);
            if (syncCheckInterval) clearInterval(syncCheckInterval);
            syncCheckInterval = null;
          }
        }, 100);

        // Track collaborators via awareness
        provider.awareness.on('change', () => {
          const states = provider.awareness.getStates();
          const collabs: CollaboratorInfo[] = [];

          states.forEach((state, clientId) => {
            if (clientId === doc.clientID) return; // Skip self
            const userData = state.user;
            if (userData) {
              collabs.push({
                userId: userData.id || `client-${clientId}`,
                name: userData.name || 'Anonymous',
                color: userData.color || '#ccc',
                cursor: state.cursor,
              });
            }
          });

          setCollaborators(collabs);
          onCollaboratorsChange?.(collabs);
        });
      })
      .receive('error', (reason: unknown) => {
        console.error('Failed to join document channel:', reason);
        setConnected(false);
        onConnectionChange?.(false);
      });

    return () => {
      if (syncCheckInterval) clearInterval(syncCheckInterval);
      providerRef.current?.destroy();
      providerRef.current = null;
      channel.leave();
      setConnected(false);
      setSynced(false);
      onConnectionChange?.(false);
    };
  }, [
    socket,
    documentId,
    user.id,
    user.name,
    userColor,
    onConnectionChange,
    onCollaboratorsChange,
  ]);

  return {
    doc: docRef.current,
    awareness: providerRef.current?.awareness ?? null,
    synced,
    connected,
    collaborators,
    provider: providerRef.current,
  };
}
