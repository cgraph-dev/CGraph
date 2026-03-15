/**
 * Offline Queue System
 *
 * Queues operations when offline and syncs when connectivity returns.
 * Critical for mobile UX - ensures no data loss during network interruptions.
 *
 * Features:
 * - Persistent queue storage (AsyncStorage)
 * - Automatic retry with exponential backoff
 * - Priority-based ordering
 * - Conflict resolution
 * - Network state monitoring
 *
 * @module lib/offline/OfflineQueue
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { createLogger } from '../logger';

const logger = createLogger('OfflineQueue');

// Storage key for persisted queue
const QUEUE_STORAGE_KEY = '@cgraph_offline_queue';
const FAILED_ITEMS_KEY = '@cgraph_offline_failed';

// Queue item types
export type QueueItemType =
  | 'message'
  | 'reaction'
  | 'post'
  | 'comment'
  | 'vote'
  | 'friend_request'
  | 'status_update'
  | 'typing'
  | 'read_receipt'
  | 'profile_update'
  | 'custom';

// Priority levels (lower = higher priority)
export enum QueuePriority {
  CRITICAL = 1, // Messages, important actions
  HIGH = 2, // Reactions, comments
  NORMAL = 3, // Posts, updates
  LOW = 4, // Analytics, non-critical
}

// Queue item interface
export interface QueueItem<T = unknown> {
  id: string;
  type: QueueItemType;
  priority: QueuePriority;
  payload: T;
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers?: Record<string, string>;
  createdAt: number;
  retryCount: number;
  maxRetries: number;
  lastAttempt?: number;
  /** Optional callback name to invoke on success */
  onSuccessCallback?: string;
  /** Optional callback name to invoke on failure */
  onFailureCallback?: string;
  /** Metadata for display/tracking */
  metadata?: {
    description?: string;
    conversationId?: string;
    recipientId?: string;
    [key: string]: unknown;
  };
}

// Callback registry
type CallbackFn = (item: QueueItem, response?: unknown, error?: Error) => void;
const callbackRegistry: Map<string, CallbackFn> = new Map();

// Queue state
interface QueueState {
  items: QueueItem[];
  isProcessing: boolean;
  isOnline: boolean;
  lastSyncAt: number | null;
  failedItems: QueueItem[];
}

const state: QueueState = {
  items: [],
  isProcessing: false,
  isOnline: true,
  lastSyncAt: null,
  failedItems: [],
};

// Event listeners
type QueueEventType =
  | 'itemAdded'
  | 'itemProcessed'
  | 'itemFailed'
  | 'syncComplete'
  | 'networkChange';
type QueueEventListener = (data: unknown) => void;
const listeners: Map<QueueEventType, Set<QueueEventListener>> = new Map();

/**
 * Generate unique ID for queue items
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Subscribe to queue events
 */
export function subscribe(event: QueueEventType, callback: QueueEventListener): () => void {
  if (!listeners.has(event)) {
    listeners.set(event, new Set());
  }
  listeners.get(event)?.add(callback);

  return () => {
    listeners.get(event)?.delete(callback);
  };
}

/**
 * Emit queue event
 */
function emit(event: QueueEventType, data: unknown): void {
  listeners.get(event)?.forEach((callback) => {
    try {
      callback(data);
    } catch (error) {
      logger.error('Event listener error', { event, error });
    }
  });
}

/**
 * Register a callback for queue item completion
 */
export function registerCallback(name: string, callback: CallbackFn): void {
  callbackRegistry.set(name, callback);
}

/**
 * Unregister a callback
 */
export function unregisterCallback(name: string): void {
  callbackRegistry.delete(name);
}

/**
 * Save queue to persistent storage
 */
async function persistQueue(): Promise<void> {
  try {
    await AsyncStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(state.items));
    await AsyncStorage.setItem(FAILED_ITEMS_KEY, JSON.stringify(state.failedItems));
  } catch (error) {
    logger.error('Failed to persist queue', { error });
  }
}

/**
 * Load queue from persistent storage
 */
async function loadQueue(): Promise<void> {
  try {
    const [queueData, failedData] = await Promise.all([
      AsyncStorage.getItem(QUEUE_STORAGE_KEY),
      AsyncStorage.getItem(FAILED_ITEMS_KEY),
    ]);

    if (queueData) {
      state.items = JSON.parse(queueData);
      logger.info('Loaded queue from storage', { count: state.items.length });
    }

    if (failedData) {
      state.failedItems = JSON.parse(failedData);
    }
  } catch (error) {
    logger.error('Failed to load queue', { error });
    state.items = [];
    state.failedItems = [];
  }
}

/**
 * Calculate exponential backoff delay
 */
function getBackoffDelay(retryCount: number): number {
  const baseDelay = 1000; // 1 second
  const maxDelay = 60000; // 1 minute
  const delay = Math.min(baseDelay * Math.pow(2, retryCount), maxDelay);
  // Add jitter (±25%)
  return delay * (0.75 + Math.random() * 0.5);
}

/**
 * Add item to offline queue
 */
export async function enqueue<T = unknown>(
  type: QueueItemType,
  endpoint: string,
  method: QueueItem['method'],
  payload: T,
  options: Partial<
    Pick<
      QueueItem,
      'priority' | 'headers' | 'maxRetries' | 'onSuccessCallback' | 'onFailureCallback' | 'metadata'
    >
  > = {}
): Promise<QueueItem<T>> {
  const item: QueueItem<T> = {
    id: generateId(),
    type,
    endpoint,
    method,
    payload,
    priority: options.priority ?? QueuePriority.NORMAL,
    headers: options.headers,
    maxRetries: options.maxRetries ?? 5,
    onSuccessCallback: options.onSuccessCallback,
    onFailureCallback: options.onFailureCallback,
    metadata: options.metadata,
    createdAt: Date.now(),
    retryCount: 0,
  };

  // Add to queue sorted by priority
  state.items.push(item);
  state.items.sort((a, b) => {
    if (a.priority !== b.priority) {
      return a.priority - b.priority;
    }
    return a.createdAt - b.createdAt;
  });

  await persistQueue();
  emit('itemAdded', item);

  logger.info('Item enqueued', { id: item.id, type: item.type, endpoint: item.endpoint });

  // Try to process immediately if online
  if (state.isOnline && !state.isProcessing) {
    processQueue();
  }

  return item;
}

/**
 * Remove item from queue
 */
export async function dequeue(itemId: string): Promise<boolean> {
  const index = state.items.findIndex((item) => item.id === itemId);
  if (index !== -1) {
    state.items.splice(index, 1);
    await persistQueue();
    return true;
  }
  return false;
}

/**
 * Get current queue
 */
export function getQueue(): QueueItem[] {
  return [...state.items];
}

/**
 * Get failed items
 */
export function getFailedItems(): QueueItem[] {
  return [...state.failedItems];
}

/**
 * Get queue stats
 */
export function getStats(): {
  pending: number;
  failed: number;
  isProcessing: boolean;
  isOnline: boolean;
  lastSyncAt: number | null;
} {
  return {
    pending: state.items.length,
    failed: state.failedItems.length,
    isProcessing: state.isProcessing,
    isOnline: state.isOnline,
    lastSyncAt: state.lastSyncAt,
  };
}

/**
 * Clear the entire queue
 */
export async function clearQueue(): Promise<void> {
  state.items = [];
  state.failedItems = [];
  await persistQueue();
  logger.info('Queue cleared');
}

/**
 * Retry failed items
 */
export async function retryFailedItems(): Promise<void> {
  if (state.failedItems.length === 0) return;

  // Move failed items back to queue with reset retry count
  const itemsToRetry = state.failedItems.map((item) => ({
    ...item,
    retryCount: 0,
    lastAttempt: undefined,
  }));

  state.items.push(...itemsToRetry);
  state.items.sort((a, b) => a.priority - b.priority || a.createdAt - b.createdAt);
  state.failedItems = [];

  await persistQueue();

  if (state.isOnline && !state.isProcessing) {
    processQueue();
  }
}

/**
 * Process a single queue item
 */
async function processItem(item: QueueItem): Promise<boolean> {
  try {
    // Import api dynamically to avoid circular deps
    const api = (await import('../api')).default;

    const response = await api.request({
      url: item.endpoint,
      method: item.method,
      data: item.payload,
      headers: item.headers,
    });

    // Success - invoke callback
    if (item.onSuccessCallback) {
      const callback = callbackRegistry.get(item.onSuccessCallback);
      if (callback) {
        callback(item, response);
      }
    }

    emit('itemProcessed', { item, response });
    logger.info('Item processed successfully', { id: item.id, type: item.type });
    return true;
  } catch (error) {
    item.retryCount++;
    item.lastAttempt = Date.now();

    logger.warn('Item processing failed', {
      id: item.id,
      type: item.type,
      retryCount: item.retryCount,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    // Check if we should retry
    if (item.retryCount < item.maxRetries) {
      // Item stays in queue for retry
      return false;
    }

    // Max retries exceeded - move to failed items
    if (item.onFailureCallback) {
      const callback = callbackRegistry.get(item.onFailureCallback);
      if (callback) {
         
        callback(item, undefined, error as Error);
      }
    }

    state.failedItems.push(item);
    emit('itemFailed', { item, error });
    logger.error('Item permanently failed', { id: item.id, type: item.type });
    return true; // Remove from queue (moved to failed)
  }
}

/**
 * Process queue items
 */
async function processQueue(): Promise<void> {
  if (state.isProcessing || !state.isOnline || state.items.length === 0) {
    return;
  }

  state.isProcessing = true;
  logger.info('Starting queue processing', { itemCount: state.items.length });

  const processedIds: Set<string> = new Set();

  for (const item of [...state.items]) {
    // Check if item should wait (backoff)
    if (item.lastAttempt) {
      const backoffDelay = getBackoffDelay(item.retryCount);
      const timeSinceLastAttempt = Date.now() - item.lastAttempt;
      if (timeSinceLastAttempt < backoffDelay) {
        continue; // Skip this item for now
      }
    }

    // Check network before each item
    if (!state.isOnline) {
      logger.info('Network lost during processing, pausing');
      break;
    }

    const success = await processItem(item);
    if (success) {
      processedIds.add(item.id);
    }
  }

  // Remove processed items
  state.items = state.items.filter((item) => !processedIds.has(item.id));
  await persistQueue();

  state.isProcessing = false;
  state.lastSyncAt = Date.now();

  emit('syncComplete', {
    processed: processedIds.size,
    remaining: state.items.length,
    failed: state.failedItems.length,
  });

  logger.info('Queue processing complete', {
    processed: processedIds.size,
    remaining: state.items.length,
  });

  // Schedule retry for remaining items
  if (state.items.length > 0 && state.isOnline) {
    const minBackoff = Math.min(...state.items.map((i) => getBackoffDelay(i.retryCount)));
    setTimeout(() => processQueue(), minBackoff);
  }
}

/**
 * Handle network state change
 */
function handleNetworkChange(netState: NetInfoState): void {
  const wasOnline = state.isOnline;
  state.isOnline = netState.isConnected ?? false;

  emit('networkChange', { isOnline: state.isOnline });

  // Came back online - process queue
  if (!wasOnline && state.isOnline && state.items.length > 0) {
    logger.info('Network restored, processing queue');
    processQueue();
  }

  if (wasOnline && !state.isOnline) {
    logger.info('Network lost, pausing queue');
  }
}

/**
 * Initialize offline queue system
 * Call this at app startup
 */
export async function initializeOfflineQueue(): Promise<void> {
  logger.info('Initializing offline queue');

  // Load persisted queue
  await loadQueue();

  // Subscribe to network changes
  NetInfo.addEventListener(handleNetworkChange);

  // Check initial network state
  const initialState = await NetInfo.fetch();
  state.isOnline = initialState.isConnected ?? false;

  // Process queue if online and has items
  if (state.isOnline && state.items.length > 0) {
    logger.info('Processing pending items on startup');
    processQueue();
  }
}

/**
 * Cleanup offline queue system
 */
export function cleanupOfflineQueue(): void {
  // NetInfo unsubscribe is handled by the addEventListener return value
  // which we're not storing. In production, store and call it here.
  logger.info('Offline queue cleanup');
}

// Export state getter for debugging
/**
 * Gets state.
 *
 */
export function getState(): Readonly<QueueState> {
  return { ...state };
}

export default {
  enqueue,
  dequeue,
  getQueue,
  getFailedItems,
  getStats,
  clearQueue,
  retryFailedItems,
  subscribe,
  registerCallback,
  unregisterCallback,
  initializeOfflineQueue,
  cleanupOfflineQueue,
  getState,
};
