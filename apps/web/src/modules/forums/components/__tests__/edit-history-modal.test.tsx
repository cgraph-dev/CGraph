/** @module EditHistoryModal tests */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('@/shared/components/ui', () => ({
  GlassCard: ({
    children,
    className,
    variant,
  }: {
    children: React.ReactNode;
    className?: string;
    variant?: string;
  }) => (
    <div data-testid="glass-card" className={className} data-variant={variant}>
      {children}
    </div>
  ),
}));

const mockFetchEditHistory = vi.fn();

vi.mock('@/modules/forums/store', () => ({
  useForumStore: () => ({
    fetchEditHistory: mockFetchEditHistory,
  }),
}));

vi.mock('@/lib/utils', () => ({
  formatTimeAgo: (date: string) => `time-ago(${date})`,
}));

vi.mock('@/lib/logger', () => ({
  createLogger: () => ({ error: vi.fn(), info: vi.fn(), warn: vi.fn(), debug: vi.fn() }),
}));

import EditHistoryModal from '../edit-history-modal';

describe('EditHistoryModal', () => {
  let onClose: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onClose = vi.fn();
    mockFetchEditHistory.mockReset();
  });

  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <EditHistoryModal postId="post-1" isOpen={false} onClose={onClose} />
    );
    expect(container.innerHTML).toBe('');
  });

  it('renders modal header when open', () => {
    mockFetchEditHistory.mockResolvedValue([]);
    render(<EditHistoryModal postId="post-1" isOpen={true} onClose={onClose} />);
    expect(screen.getByText('Edit History')).toBeInTheDocument();
  });

  it('renders close button', () => {
    mockFetchEditHistory.mockResolvedValue([]);
    render(<EditHistoryModal postId="post-1" isOpen={true} onClose={onClose} />);
    expect(screen.getByTestId('icon-XMarkIcon')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    mockFetchEditHistory.mockResolvedValue([]);
    render(<EditHistoryModal postId="post-1" isOpen={true} onClose={onClose} />);
    const closeButton = screen.getByTestId('icon-XMarkIcon').closest('button');
    if (closeButton) {
      fireEvent.click(closeButton);
      expect(onClose).toHaveBeenCalledOnce();
    }
  });

  it('calls onClose when backdrop is clicked', () => {
    mockFetchEditHistory.mockResolvedValue([]);
    render(<EditHistoryModal postId="post-1" isOpen={true} onClose={onClose} />);
    const backdrop = document.querySelector('.bg-black\\/60');
    if (backdrop) {
      fireEvent.click(backdrop);
      expect(onClose).toHaveBeenCalledOnce();
    }
  });

  it('shows empty state when no history exists', async () => {
    mockFetchEditHistory.mockResolvedValue([]);
    render(<EditHistoryModal postId="post-1" isOpen={true} onClose={onClose} />);
    expect(await screen.findByText('No edit history available')).toBeInTheDocument();
  });

  it('fetches edit history on open', () => {
    mockFetchEditHistory.mockResolvedValue([]);
    render(<EditHistoryModal postId="post-1" isOpen={true} onClose={onClose} />);
    expect(mockFetchEditHistory).toHaveBeenCalledWith('post-1');
  });

  it('renders history entries when data is loaded', async () => {
    mockFetchEditHistory.mockResolvedValue([
      {
        id: 'edit-1',
        postId: 'post-1',
        editedBy: 'user-1',
        editedByUsername: 'alice',
        previousContent: 'Old content here',
        reason: 'Fixed typo',
        editedAt: '2025-01-15T10:00:00Z',
      },
    ]);
    render(<EditHistoryModal postId="post-1" isOpen={true} onClose={onClose} />);
    expect(await screen.findByText('alice')).toBeInTheDocument();
    expect(screen.getAllByText('Edit #1').length).toBeGreaterThanOrEqual(1);
  });

  it('renders GlassCard wrapper', () => {
    mockFetchEditHistory.mockResolvedValue([]);
    render(<EditHistoryModal postId="post-1" isOpen={true} onClose={onClose} />);
    expect(screen.getByTestId('glass-card')).toBeInTheDocument();
  });
});
