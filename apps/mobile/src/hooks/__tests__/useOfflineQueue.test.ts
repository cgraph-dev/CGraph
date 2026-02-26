/**
 * useOfflineQueue Hook Tests
 *
 * Tests for the offline queue hook functionality.
 */

import { renderHook, act } from '@testing-library/react-native';
import { useOfflineQueue } from '../useOfflineQueue';
import * as OfflineQueue from '../../lib/offline/offline-queue';

// Mock the OfflineQueue module
jest.mock('../../lib/offline/offline-queue', () => ({
  enqueue: jest.fn(),
  dequeue: jest.fn(),
  getQueue: jest.fn(),
  getFailedItems: jest.fn(),
  getStats: jest.fn(),
  clearQueue: jest.fn(),
  retryFailedItems: jest.fn(),
  subscribe: jest.fn(),
  QueuePriority: {
    CRITICAL: 1,
    HIGH: 2,
    NORMAL: 3,
    LOW: 4,
  },
}));

// Mock expo-haptics
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium' },
  NotificationFeedbackType: { Success: 'success', Warning: 'warning', Error: 'error' },
}));

const mockQueueItem = {
  id: 'item-123',
  type: 'message' as const,
  priority: 1,
  payload: { content: 'Hello' },
  endpoint: '/api/v1/conversations/123/messages',
  method: 'POST' as const,
  createdAt: Date.now(),
  retryCount: 0,
  maxRetries: 5,
};

const mockStats = {
  pending: 2,
  failed: 1,
  isProcessing: false,
  isOnline: true,
  lastSyncAt: Date.now(),
};

describe('useOfflineQueue', () => {
  let mockUnsubscribers: Array<() => void>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUnsubscribers = [];

    // Default mocks
    (OfflineQueue.getQueue as jest.Mock).mockReturnValue([mockQueueItem]);
    (OfflineQueue.getFailedItems as jest.Mock).mockReturnValue([]);
    (OfflineQueue.getStats as jest.Mock).mockReturnValue(mockStats);
    (OfflineQueue.enqueue as jest.Mock).mockResolvedValue(mockQueueItem);
    (OfflineQueue.dequeue as jest.Mock).mockResolvedValue(true);
    (OfflineQueue.clearQueue as jest.Mock).mockResolvedValue(undefined);
    (OfflineQueue.retryFailedItems as jest.Mock).mockResolvedValue(undefined);

    // Mock subscribe to return unsubscribe functions
    (OfflineQueue.subscribe as jest.Mock).mockImplementation(() => {
      const unsub = jest.fn();
      mockUnsubscribers.push(unsub);
      return unsub;
    });
  });

  describe('initialization', () => {
    it('should load queue state on mount', () => {
      const { result } = renderHook(() => useOfflineQueue());

      expect(result.current.queue).toEqual([mockQueueItem]);
      expect(result.current.pendingCount).toBe(2);
      expect(result.current.isOnline).toBe(true);
    });

    it('should subscribe to queue events', () => {
      renderHook(() => useOfflineQueue());

      expect(OfflineQueue.subscribe).toHaveBeenCalledWith('itemAdded', expect.any(Function));
      expect(OfflineQueue.subscribe).toHaveBeenCalledWith('itemProcessed', expect.any(Function));
      expect(OfflineQueue.subscribe).toHaveBeenCalledWith('itemFailed', expect.any(Function));
      expect(OfflineQueue.subscribe).toHaveBeenCalledWith('syncComplete', expect.any(Function));
      expect(OfflineQueue.subscribe).toHaveBeenCalledWith('networkChange', expect.any(Function));
    });

    it('should unsubscribe on unmount', () => {
      const { unmount } = renderHook(() => useOfflineQueue());

      unmount();

      mockUnsubscribers.forEach((unsub) => {
        expect(unsub).toHaveBeenCalled();
      });
    });
  });

  describe('computed values', () => {
    it('should compute hasPendingItems correctly', () => {
      const { result } = renderHook(() => useOfflineQueue());

      expect(result.current.hasPendingItems).toBe(true);
    });

    it('should compute hasFailedItems correctly', () => {
      (OfflineQueue.getFailedItems as jest.Mock).mockReturnValue([mockQueueItem]);

      const { result } = renderHook(() => useOfflineQueue());

      expect(result.current.hasFailedItems).toBe(true);
    });

    it('should convert lastSyncAt to Date', () => {
      const { result } = renderHook(() => useOfflineQueue());

      expect(result.current.lastSyncAt).toBeInstanceOf(Date);
    });

    it('should return null lastSyncAt when not synced', () => {
      (OfflineQueue.getStats as jest.Mock).mockReturnValue({
        ...mockStats,
        lastSyncAt: null,
      });

      const { result } = renderHook(() => useOfflineQueue());

      expect(result.current.lastSyncAt).toBeNull();
    });
  });

  describe('addToQueue', () => {
    it('should add item to queue', async () => {
      const { result } = renderHook(() => useOfflineQueue());

      let item = null;
      await act(async () => {
        item = await result.current.addToQueue(
          'message',
          '/api/v1/test',
          'POST',
          { content: 'test' }
        );
      });

      expect(item).toEqual(mockQueueItem);
      expect(OfflineQueue.enqueue).toHaveBeenCalledWith(
        'message',
        '/api/v1/test',
        'POST',
        { content: 'test' },
        undefined
      );
    });

    it('should pass priority and metadata options', async () => {
      const { result } = renderHook(() => useOfflineQueue());

      await act(async () => {
        await result.current.addToQueue(
          'reaction',
          '/api/v1/reactions',
          'POST',
          { emoji: '👍' },
          {
            priority: OfflineQueue.QueuePriority.HIGH,
            metadata: { messageId: 'msg-123' },
          }
        );
      });

      expect(OfflineQueue.enqueue).toHaveBeenCalledWith(
        'reaction',
        '/api/v1/reactions',
        'POST',
        { emoji: '👍' },
        {
          priority: OfflineQueue.QueuePriority.HIGH,
          metadata: { messageId: 'msg-123' },
        }
      );
    });
  });

  describe('removeFromQueue', () => {
    it('should remove item from queue', async () => {
      const { result } = renderHook(() => useOfflineQueue());

      let success = false;
      await act(async () => {
        success = await result.current.removeFromQueue('item-123');
      });

      expect(success).toBe(true);
      expect(OfflineQueue.dequeue).toHaveBeenCalledWith('item-123');
    });

    it('should return false when item not found', async () => {
      (OfflineQueue.dequeue as jest.Mock).mockResolvedValue(false);

      const { result } = renderHook(() => useOfflineQueue());

      let success = true;
      await act(async () => {
        success = await result.current.removeFromQueue('nonexistent');
      });

      expect(success).toBe(false);
    });
  });

  describe('retryFailed', () => {
    it('should retry failed items', async () => {
      const { result } = renderHook(() => useOfflineQueue());

      await act(async () => {
        await result.current.retryFailed();
      });

      expect(OfflineQueue.retryFailedItems).toHaveBeenCalled();
    });
  });

  describe('clear', () => {
    it('should clear the queue', async () => {
      const { result } = renderHook(() => useOfflineQueue());

      await act(async () => {
        await result.current.clear();
      });

      expect(OfflineQueue.clearQueue).toHaveBeenCalled();
    });
  });

  describe('convenience methods', () => {
    it('should queue message with correct endpoint and priority', async () => {
      const { result } = renderHook(() => useOfflineQueue());

      await act(async () => {
        await result.current.queueMessage('conv-123', 'Hello world');
      });

      expect(OfflineQueue.enqueue).toHaveBeenCalledWith(
        'message',
        '/api/v1/conversations/conv-123/messages',
        'POST',
        { content: 'Hello world' },
        expect.objectContaining({
          priority: OfflineQueue.QueuePriority.CRITICAL,
          metadata: expect.objectContaining({
            conversationId: 'conv-123',
          }),
        })
      );
    });

    it('should queue reaction with correct endpoint and priority', async () => {
      const { result } = renderHook(() => useOfflineQueue());

      await act(async () => {
        await result.current.queueReaction('msg-123', '❤️');
      });

      expect(OfflineQueue.enqueue).toHaveBeenCalledWith(
        'reaction',
        '/api/v1/messages/msg-123/reactions',
        'POST',
        { emoji: '❤️' },
        expect.objectContaining({
          priority: OfflineQueue.QueuePriority.HIGH,
          metadata: expect.objectContaining({
            messageId: 'msg-123',
          }),
        })
      );
    });

    it('should queue post with correct endpoint and priority', async () => {
      const { result } = renderHook(() => useOfflineQueue());

      await act(async () => {
        await result.current.queuePost('forum-123', 'My Title', 'My content');
      });

      expect(OfflineQueue.enqueue).toHaveBeenCalledWith(
        'post',
        '/api/v1/forums/forum-123/posts',
        'POST',
        { title: 'My Title', content: 'My content' },
        expect.objectContaining({
          priority: OfflineQueue.QueuePriority.NORMAL,
          metadata: expect.objectContaining({
            forumId: 'forum-123',
          }),
        })
      );
    });
  });

  describe('refresh', () => {
    it('should refresh queue state', () => {
      const { result } = renderHook(() => useOfflineQueue());

      // Change the mock return values
      const newQueue = [{ ...mockQueueItem, id: 'item-456' }];
      (OfflineQueue.getQueue as jest.Mock).mockReturnValue(newQueue);
      (OfflineQueue.getStats as jest.Mock).mockReturnValue({
        ...mockStats,
        pending: 1,
      });

      act(() => {
        result.current.refresh();
      });

      expect(result.current.queue).toEqual(newQueue);
      expect(result.current.pendingCount).toBe(1);
    });
  });
});
