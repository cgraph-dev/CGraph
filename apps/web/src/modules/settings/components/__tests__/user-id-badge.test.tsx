/** @module user-id-badge tests */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('@/shared/components/ui', () => ({
  GlassCard: ({ children, className }: React.PropsWithChildren<{ className?: string }>) => (
    <div data-testid="glass-card" className={className}>
      {children}
    </div>
  ),
}));

vi.mock('@/components/theme/themed-avatar', () => ({
  ThemedAvatar: ({ alt }: { alt: string }) => <img data-testid="themed-avatar" alt={alt} />,
}));

vi.mock('@/lib/utils', () => ({
  getAvatarBorderId: vi.fn(() => 'border-1'),
}));

import { UserIdBadge } from '../user-id-badge';

const mockUser = {
  id: 'user-1',
  displayName: 'Test User',
  username: 'testuser',
  avatarUrl: 'https://example.com/avatar.jpg',
  isVerified: true,
  userIdDisplay: '#1234',
  karma: 5000,
};

describe('UserIdBadge', () => {
  it('renders user display name', () => {
    render(<UserIdBadge user={mockUser as never} />);
    expect(screen.getByText('Test User')).toBeInTheDocument();
  });

  it('renders username with @ prefix', () => {
    render(<UserIdBadge user={mockUser as never} />);
    expect(screen.getByText('@testuser')).toBeInTheDocument();
  });

  it('renders user ID display', () => {
    render(<UserIdBadge user={mockUser as never} />);
    expect(screen.getByText('#1234')).toBeInTheDocument();
  });

  it('renders verification badge when verified', () => {
    render(<UserIdBadge user={mockUser as never} />);
    expect(screen.getByText('✓')).toBeInTheDocument();
  });

  it('does not render verification badge when not verified', () => {
    const unverified = { ...mockUser, isVerified: false };
    render(<UserIdBadge user={unverified as never} />);
    expect(screen.queryByText('✓')).not.toBeInTheDocument();
  });

  it('renders themed avatar when user has avatarUrl', () => {
    render(<UserIdBadge user={mockUser as never} />);
    expect(screen.getByTestId('themed-avatar')).toBeInTheDocument();
  });

  it('renders initial fallback when no avatarUrl', () => {
    const noAvatar = { ...mockUser, avatarUrl: '' };
    render(<UserIdBadge user={noAvatar as never} />);
    expect(screen.getByText('T')).toBeInTheDocument();
  });

  it('renders karma count when karma > 0', () => {
    render(<UserIdBadge user={mockUser as never} />);
    expect(screen.getByText(/5,000/)).toBeInTheDocument();
  });

  it('does not render karma when karma is 0', () => {
    const noKarma = { ...mockUser, karma: 0 };
    render(<UserIdBadge user={noKarma as never} />);
    expect(screen.queryByText(/karma/)).not.toBeInTheDocument();
  });

  it('renders fallback for null user', () => {
    render(<UserIdBadge user={null} />);
    expect(screen.getByText('Anonymous User')).toBeInTheDocument();
    expect(screen.getByText('#0000')).toBeInTheDocument();
  });

  it('renders inside a GlassCard', () => {
    render(<UserIdBadge user={mockUser as never} />);
    expect(screen.getByTestId('glass-card')).toBeInTheDocument();
  });
});
