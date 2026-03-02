/**
 * ModerationQueue Component Tests
 * @module moderation/components/moderation-queue
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ModerationQueue } from '../moderation-queue';

const mockFetchQueue = vi.fn();
const mockApproveItem = vi.fn();
const mockRejectItem = vi.fn();

vi.mock('../../store', () => ({
  useModerationStore: vi.fn(() => ({
    queue: [],
    isLoadingQueue: false,
    queueCounts: { pending: 0, flagged: 0, reported: 0 },
    fetchModerationQueue: mockFetchQueue,
    approveQueueItem: mockApproveItem,
    rejectQueueItem: mockRejectItem,
  })),
}));

import { useModerationStore } from '../../store';

describe('ModerationQueue', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useModerationStore).mockReturnValue({
      queue: [],
      isLoadingQueue: false,
      queueCounts: { pending: 0, flagged: 0, reported: 0 },
      fetchModerationQueue: mockFetchQueue,
      approveQueueItem: mockApproveItem,
      rejectQueueItem: mockRejectItem,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
  });

  it('renders the heading', () => {
    render(<ModerationQueue />);
    expect(screen.getByText('Moderation Queue')).toBeInTheDocument();
  });

  it('calls fetchModerationQueue on mount', () => {
    render(<ModerationQueue />);
    expect(mockFetchQueue).toHaveBeenCalled();
  });

  it('shows loading state', () => {
    vi.mocked(useModerationStore).mockReturnValue({
      queue: [],
      isLoadingQueue: true,
      queueCounts: { pending: 0, flagged: 0, reported: 0 },
      fetchModerationQueue: mockFetchQueue,
      approveQueueItem: mockApproveItem,
      rejectQueueItem: mockRejectItem,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    render(<ModerationQueue />);
    expect(screen.getByText('Loading queue…')).toBeInTheDocument();
  });

  it('shows empty state when no items', () => {
    render(<ModerationQueue />);
    expect(screen.getByText('No items in queue')).toBeInTheDocument();
  });

  it('renders queue items with priority and actions', () => {
    vi.mocked(useModerationStore).mockReturnValue({
      queue: [
        {
          id: 'qi-1',
          itemType: 'post',
          itemId: 'p1',
          authorId: 'u1',
          authorUsername: 'SuspiciousUser',
          title: 'Suspicious Post',
          content: 'Some flagged content',
          contentPreview: 'Some flagged content preview',
          reason: 'reported',
          status: 'pending',
          priority: 'high',
          reportCount: 3,
          createdAt: '2025-06-15T10:00:00Z',
        },
      ],
      isLoadingQueue: false,
      queueCounts: { pending: 1, flagged: 0, reported: 0 },
      fetchModerationQueue: mockFetchQueue,
      approveQueueItem: mockApproveItem,
      rejectQueueItem: mockRejectItem,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    render(<ModerationQueue />);
    expect(screen.getByText('high')).toBeInTheDocument();
    expect(screen.getByText('Suspicious Post')).toBeInTheDocument();
    expect(screen.getByText('Approve')).toBeInTheDocument();
    expect(screen.getByText('Reject')).toBeInTheDocument();
  });
});
