/**
 * ModerationLog Component Tests
 * @module moderation/components/moderation-log
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ModerationLog } from '../moderation-log';

const mockFetchModerationLog = vi.fn();

vi.mock('../../store', () => ({
  useModerationStore: vi.fn(() => ({
    moderationLog: [],
    isLoadingLog: false,
    fetchModerationLog: mockFetchModerationLog,
  })),
}));

import { useModerationStore } from '../../store';

describe('ModerationLog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useModerationStore).mockReturnValue({
      moderationLog: [],
      isLoadingLog: false,
      fetchModerationLog: mockFetchModerationLog,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
  });

  it('renders the heading', () => {
    render(<ModerationLog />);
    expect(screen.getByText('Moderation Log')).toBeInTheDocument();
  });

  it('calls fetchModerationLog on mount', () => {
    render(<ModerationLog />);
    expect(mockFetchModerationLog).toHaveBeenCalled();
  });

  it('shows loading state', () => {
    vi.mocked(useModerationStore).mockReturnValue({
      moderationLog: [],
      isLoadingLog: true,
      fetchModerationLog: mockFetchModerationLog,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    render(<ModerationLog />);
    expect(screen.getByText('Loading log…')).toBeInTheDocument();
  });

  it('shows empty state when no log entries', () => {
    render(<ModerationLog />);
    expect(screen.getByText('No moderation actions recorded')).toBeInTheDocument();
  });

  it('renders log entries', () => {
    vi.mocked(useModerationStore).mockReturnValue({
      moderationLog: [
        {
          id: 'log-1',
          action: 'ban',
          targetType: 'user',
          targetId: 'u1',
          targetTitle: 'SpamUser',
          moderatorId: 'mod1',
          moderatorUsername: 'AdminMod',
          reason: 'Repeated violations',
          createdAt: '2025-06-15T10:30:00Z',
        },
      ],
      isLoadingLog: false,
      fetchModerationLog: mockFetchModerationLog,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    render(<ModerationLog />);
    expect(screen.getByText('AdminMod')).toBeInTheDocument();
    expect(screen.getByText('ban')).toBeInTheDocument();
    expect(screen.getByText('user')).toBeInTheDocument();
    expect(screen.getByText('Reason: Repeated violations')).toBeInTheDocument();
  });
});
