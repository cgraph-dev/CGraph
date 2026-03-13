/**
 * UserWarnings Component Tests
 * @module moderation/components/user-warnings
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UserWarnings } from '../user-warnings';

const mockFetchUserWarnings = vi.fn();
const mockRevokeWarning = vi.fn();

vi.mock('../../store', () => ({
  useModerationStore: vi.fn(() => ({
    currentUserWarnings: [],
    currentUserStats: null,
    fetchUserWarnings: mockFetchUserWarnings,
    revokeWarning: mockRevokeWarning,
  })),
}));

import { useModerationStore } from '../../store';

describe('UserWarnings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the heading', () => {
    render(<UserWarnings userId="user-1" />);
    expect(screen.getByText('User Warnings')).toBeInTheDocument();
  });

  it('calls fetchUserWarnings on mount with userId', () => {
    render(<UserWarnings userId="user-1" />);
    expect(mockFetchUserWarnings).toHaveBeenCalledWith('user-1');
  });

  it('shows empty state when no warnings', () => {
    render(<UserWarnings userId="user-1" />);
    expect(screen.getByText('No warnings issued')).toBeInTheDocument();
  });

  it('renders user stats when available', () => {
    vi.mocked(useModerationStore).mockReturnValue({
      currentUserWarnings: [],
      currentUserStats: { warningPoints: 15, activeWarnings: 2 },
      fetchUserWarnings: mockFetchUserWarnings,
      revokeWarning: mockRevokeWarning,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    render(<UserWarnings userId="user-1" />);
    expect(screen.getByText('15')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('renders active warnings', () => {
    vi.mocked(useModerationStore).mockReturnValue({
      currentUserWarnings: [
        {
          id: 'w1',
          userId: 'user-1',
          username: 'TestUser',
          warningTypeId: 'wt1',
          warningTypeName: 'Spam Warning',
          points: 5,
          reason: 'Excessive spam',
          issuedById: 'mod1',
          issuedByUsername: 'Moderator',
          issuedAt: '2025-01-01',
          expiresAt: null,
          isActive: true,
          isRevoked: false,
        },
      ],
      currentUserStats: null,
      fetchUserWarnings: mockFetchUserWarnings,
      revokeWarning: mockRevokeWarning,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    render(<UserWarnings userId="user-1" />);
    expect(screen.getByText('Active Warnings')).toBeInTheDocument();
    expect(screen.getByText('Spam Warning')).toBeInTheDocument();
    expect(screen.getByText('Excessive spam')).toBeInTheDocument();
    expect(screen.getByText('Revoke')).toBeInTheDocument();
  });

  it('calls revokeWarning when Revoke is clicked', async () => {
    const user = userEvent.setup();
    vi.mocked(useModerationStore).mockReturnValue({
      currentUserWarnings: [
        {
          id: 'w1',
          userId: 'user-1',
          username: 'TestUser',
          warningTypeId: 'wt1',
          warningTypeName: 'Spam Warning',
          points: 5,
          reason: 'Excessive spam',
          issuedById: 'mod1',
          issuedByUsername: 'Moderator',
          issuedAt: '2025-01-01',
          expiresAt: null,
          isActive: true,
          isRevoked: false,
        },
      ],
      currentUserStats: null,
      fetchUserWarnings: mockFetchUserWarnings,
      revokeWarning: mockRevokeWarning,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    render(<UserWarnings userId="user-1" />);
    await user.click(screen.getByText('Revoke'));
    expect(mockRevokeWarning).toHaveBeenCalledWith('w1', 'Revoked by moderator');
  });
});
