/**
 * Yjs Provider for CGraph Phoenix Channels
 *
 * Synchronizes Yjs CRDT state via Phoenix WebSocket channels.
 * Handles initial state sync, incremental updates, and awareness
 * (cursor positions, user presence).
 *
 * @module collaboration/PhoenixProvider
 */

import * as Y from 'yjs';
import { Awareness } from 'y-protocols/awareness';
import { createLogger } from '@/lib/logger';

const logger = createLogger('PhoenixProvider');

export interface PhoenixProviderOptions {
  /** Yjs document instance */
  doc: Y.Doc;
  /** Phoenix channel connected to document:{id} */
  channel: PhoenixChannel;
  /** Awareness protocol instance */
  awareness?: Awareness;
  /** Current user info for awareness */
  user?: {
    id: string;
    name: string;
    color: string;
  };
}

interface PhoenixChannel {
  push: (
    event: string,
    payload: Record<string, unknown>
  ) => { receive: (status: string, cb: (resp: unknown) => void) => unknown };
  on: (event: string, callback: (payload: Record<string, unknown>) => void) => number;
  off: (event: string, ref: number) => void;
  leave: () => void;
}

/**
 * Phoenix Channel provider for Yjs — bridges CGraph's real-time
 * infrastructure with the Yjs CRDT.
 */
export class PhoenixProvider {
  readonly doc: Y.Doc;
  readonly awareness: Awareness;
  private channel: PhoenixChannel;
  private synced = false;
  private destroyed = false;
  private eventRefs: { event: string; ref: number }[] = [];
  private user?: { id: string; name: string; color: string };
  private docUpdateHandler: ((update: Uint8Array, origin: unknown) => void) | null = null;
  /** Maps remote user IDs to their awareness data (for non-Yjs-binary awareness) */
  private remoteAwarenessStates = new Map<string, Record<string, unknown>>();

  constructor(options: PhoenixProviderOptions) {
    this.doc = options.doc;
    this.channel = options.channel;
    this.awareness = options.awareness || new Awareness(this.doc);
    this.user = options.user;

    this.setupDocListener();
    this.setupChannelListeners();
    this.setupAwareness();

    logger.info('PhoenixProvider initialized');
  }

  /**
   *
   */
  get isSynced(): boolean {
    return this.synced;
  }

  // ---------------------------------------------------------------------------
  // Document sync
  // ---------------------------------------------------------------------------

  private setupDocListener(): void {
    // Listen for local Yjs updates and send to server
    this.docUpdateHandler = (update: Uint8Array, origin: unknown) => {
      // Don't re-send updates that came from the server
      if (origin === this) return;
      if (this.destroyed) return;

      const base64 = uint8ArrayToBase64(update);
      this.channel.push('yjs_update', { update: base64 });
    };

    this.doc.on('update', this.docUpdateHandler);
  }

  private setupChannelListeners(): void {
    // Receive initial state on join
    const ref1 = this.channel.on('initial_state', (payload: Record<string, unknown>) => {
      const stateBase64 = payload.state as string; // type assertion: Phoenix channel payload field
      if (stateBase64) {
        const state = base64ToUint8Array(stateBase64);
        Y.applyUpdate(this.doc, state, this);
        this.synced = true;
        logger.info('Initial state applied');
      }
    });
    this.eventRefs.push({ event: 'initial_state', ref: ref1 });

    // Receive incremental updates from other clients
    const ref2 = this.channel.on('yjs_update', (payload: Record<string, unknown>) => {
      const updateBase64 = payload.update as string; // type assertion: Phoenix channel payload field
      if (updateBase64) {
        const update = base64ToUint8Array(updateBase64);
        Y.applyUpdate(this.doc, update, this);
      }
    });
    this.eventRefs.push({ event: 'yjs_update', ref: ref2 });

    // Receive awareness updates — apply remote state
    const ref3 = this.channel.on('awareness_update', (payload: Record<string, unknown>) => {
      const userId = payload.user_id as string; // type assertion: Phoenix channel payload field
      const data = payload.data as Record<string, unknown> | undefined; // safe downcast – structural boundary
      if (userId && data) {
        // Store the remote awareness state keyed by userId
        this.remoteAwarenessStates.set(userId, data);
        // Emit change so consumers (cursor overlays, presence lists) can react
        this.awareness.emit('change', [{ added: [], updated: [userId], removed: [] }, 'remote']);
        logger.debug(`Awareness update applied from ${userId}`);
      }
    });
    this.eventRefs.push({ event: 'awareness_update', ref: ref3 });

    // Handle awareness removal (user disconnected)
    const ref4 = this.channel.on('awareness_remove', (payload: Record<string, unknown>) => {
      const userId = payload.user_id as string; // type assertion: Phoenix channel payload field
      if (userId) {
        this.remoteAwarenessStates.delete(userId);
        this.awareness.emit('change', [{ added: [], updated: [], removed: [userId] }, 'remote']);
        logger.debug(`User disconnected: ${userId}`);
      }
    });
    this.eventRefs.push({ event: 'awareness_remove', ref: ref4 });

    // User joined/left notifications
    const ref5 = this.channel.on('user_joined', (payload: Record<string, unknown>) => {
      logger.info(`User joined: ${payload.username}`);
    });
    this.eventRefs.push({ event: 'user_joined', ref: ref5 });

    const ref6 = this.channel.on('user_left', (payload: Record<string, unknown>) => {
      logger.info(`User left: ${payload.user_id}`);
    });
    this.eventRefs.push({ event: 'user_left', ref: ref6 });
  }

  // ---------------------------------------------------------------------------
  // Awareness (cursors, selections)
  // ---------------------------------------------------------------------------

  private setupAwareness(): void {
    if (!this.user) return;

    // Set local awareness state
    this.awareness.setLocalStateField('user', {
      name: this.user.name,
      color: this.user.color,
    });

    // Send awareness changes to server
    this.awareness.on('change', () => {
      if (this.destroyed) return;

      const localState = this.awareness.getLocalState();
      if (localState) {
        this.channel.push('awareness_update', {
          data: localState,
        });
      }
    });
  }

  /**
   * Update local cursor position.
   */
  setCursor(anchor: number, head: number): void {
    this.awareness.setLocalStateField('cursor', { anchor, head });
  }

  /**
   * Get all remote users' awareness states (cursors, selections, presence).
   * Returns a Map of userId → state data from the Phoenix channel relay.
   */
  getRemoteAwarenessStates(): ReadonlyMap<string, Record<string, unknown>> {
    return this.remoteAwarenessStates;
  }

  /**
   * Request full state resync from server.
   */
  requestState(): void {
    this.channel.push('request_state', {});
  }

  /**
   * Clean up all listeners and leave the channel.
   */
  destroy(): void {
    this.destroyed = true;

    // Remove channel event listeners (off requires event name + ref)
    for (const er of this.eventRefs) {
      this.channel.off(er.event, er.ref);
    }
    this.eventRefs = [];

    // Remove doc update listener
    if (this.docUpdateHandler) {
      this.doc.off('update', this.docUpdateHandler);
      this.docUpdateHandler = null;
    }

    // Clear awareness
    this.awareness.destroy();

    // Clear remote states
    this.remoteAwarenessStates.clear();

    // Leave channel
    this.channel.leave();

    logger.info('PhoenixProvider destroyed');
  }
}

// =============================================================================
// Helpers
// =============================================================================

function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary);
}

function base64ToUint8Array(base64: string): Uint8Array {
  const binary: string = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// =============================================================================
// Color generation for user cursors
// =============================================================================

const CURSOR_COLORS = [
  '#FF6B6B',
  '#4ECDC4',
  '#45B7D1',
  '#96CEB4',
  '#FFEAA7',
  '#DDA0DD',
  '#98D8C8',
  '#F7DC6F',
  '#BB8FCE',
  '#85C1E9',
  '#F0B27A',
  '#82E0AA',
];

/**
 * Retrieves user color.
 */
export function getUserColor(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return CURSOR_COLORS[Math.abs(hash) % CURSOR_COLORS.length]!;
}
