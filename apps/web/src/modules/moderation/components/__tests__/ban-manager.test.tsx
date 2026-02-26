/**
 * BanManager Component Tests
 * @module moderation/components/ban-manager
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BanManager } from '../ban-manager';

const mockFetchBans = vi.fn();
const mockLiftBan = vi.fn();

vi.mock('../../store', () => ({
  useModerationStore: vi.fn(() => ({
    bans: [],
    isLoadingBans: false,
    fetchBans: mockFetchBans,
    liftBan: mockLiftBan,
  })),
}));

import { useModerationStore } from '../../store';

describe('BanManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useModerationStore).mockReturnValue({
      bans: [],
      isLoadingBans: false,
      fetchBans: mockFetchBans,
      liftBan: mockLiftBan,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
  });

  it('renders the heading', () => {
    render(<BanManager />);
    expect(screen.getByText('Ban Manager')).toBeInTheDocument();
  });

  it('calls fetchBans on mount', () => {
    render(<BanManager />);
    expect(mockFetchBans).toHaveBeenCalled();
  });

  it('shows loading state', () => {
    vi.mocked(useModerationStore).mockReturnValue({
      bans: [],
      isLoadingBans: true,
      fetchBans: mockFetchBans,
      liftBan: mockLiftBan,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    render(<BanManager />);
    expect(screen.getByText('Loading bans…')).toBeInTheDocument();
  });

  it('shows empty state when no bans', () => {
    render(<BanManager />);
    expect(screen.getByText('No bans recorded')).toBeInTheDocument();
  });

  it('renders active bans', () => {
    vi.mocked(useModerationStore).mockReturnValue({
      bans: [
        {
          id: 'ban-1',
          userId: 'u1',
          username: 'BadUser',
          email: null,
          ipAddress: null,
          reason: 'Spam',
          bannedById: 'mod1',
          bannedByUsername: 'Moderator',
          bannedAt: '2025-01-01',
          expiresAt: null,
          isActive: true,
          isLifted: false,
        },
      ],
      isLoadingBans: false,
      fetchBans: mockFetchBans,
      liftBan: mockLiftBan,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    render(<BanManager />);
    expect(screen.getByText('BadUser')).toBeInTheDocument();
    expect(screen.getByText('Spam')).toBeInTheDocument();
    expect(screen.getByText('Permanent')).toBeInTheDocument();
    expect(screen.getByText('Lift Ban')).toBeInTheDocument();
  });

  it('calls liftBan when Lift Ban button is clicked', async () => {
    const user = userEvent.setup();
    vi.mocked(useModerationStore).mockReturnValue({
      bans: [
        {
          id: 'ban-1',
          userId: 'u1',
          username: 'BadUser',
          email: null,
          ipAddress: null,
          reason: 'Spam',
          bannedById: 'mod1',
          bannedByUsername: 'Moderator',
          bannedAt: '2025-01-01',
          expiresAt: null,
          isActive: true,
          isLifted: false,
        },
      ],
      isLoadingBans: false,
      fetchBans: mockFetchBans,
      liftBan: mockLiftBan,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    render(<BanManager />);
    await user.click(screen.getByText('Lift Ban'));
    expect(mockLiftBan).toHaveBeenCalledWith('ban-1', 'Lifted by moderator');
  });
});
