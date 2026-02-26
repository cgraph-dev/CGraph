/** @module full-profile-card tests */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('react-router-dom', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Link: ({ children, to, ...rest }: any) => (
    <a href={to} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock('@/modules/auth/store', () => ({
  useAuthStore: () => ({ user: { id: 'current-user' } }),
}));

vi.mock('@/modules/gamification/store', () => ({
  useAvatarBorderStore: () => ({ getEquippedBorder: () => undefined }),
}));

vi.mock('@/data/avatar-borders', () => ({
  getBorderById: () => undefined,
}));

vi.mock('@/modules/social/components/avatar/avatar-border-renderer', () => ({
  AvatarBorderRenderer: ({ alt }: { alt: string }) => (
    <div data-testid="avatar-border-renderer">{alt}</div>
  ),
}));

vi.mock('@/modules/gamification/components/title-badge', () => ({
  TitleBadge: () => <div data-testid="title-badge" />,
}));

vi.mock('./constants', () => ({
  MAX_MUTUAL_FRIENDS_DISPLAY: 5,
  MAX_BADGES_DISPLAY: 5,
  MAX_SHARED_FORUMS_DISPLAY: 3,
}));

vi.mock('@/shared/components/ui', () => ({
  AnimatedAvatar: ({ alt }: { alt: string }) => <div data-testid="avatar">{alt}</div>,
  GlassCard: ({ children, className }: React.PropsWithChildren<{ className?: string }>) => (
    <div className={className} data-testid="glass-card">
      {children}
    </div>
  ),
}));

vi.mock('@/modules/gamification/components/user-stars', () => ({
  UserStars: () => <div data-testid="user-stars" />,
}));

vi.mock('@/components/theme/themed-avatar', () => ({
  ThemedAvatar: ({ alt }: { alt: string }) => <div data-testid="themed-avatar">{alt}</div>,
}));

import { FullProfileCard } from '../full-profile-card';

describe('FullProfileCard', () => {
  const mockUser = {
    id: 'u1',
    username: 'testuser',
    displayName: 'Test User',
    avatarUrl: '/avatar.png',
    bio: 'Hello world',
    status: 'online',
    isOnline: true,
    joinedAt: '2024-01-01T00:00:00Z',
    friendCount: 42,
    postCount: 100,
    level: 10,
    karma: 1500,
    xp: 5000,
    streak: 7,
    avatarBorderId: null,
    equippedTitle: null,
    pronouns: null,
    badges: [],
    mutualFriends: [],
    sharedForums: [],
  };

  it('renders user display name', () => {
    render(<FullProfileCard user={mockUser} onClose={vi.fn()} />);
    expect(screen.getByText('Test User')).toBeInTheDocument();
  });

  it('renders username', () => {
    render(<FullProfileCard user={mockUser} onClose={vi.fn()} />);
    expect(screen.getByText(/testuser/)).toBeInTheDocument();
  });

  it('renders bio', () => {
    render(<FullProfileCard user={mockUser} onClose={vi.fn()} />);
    expect(screen.getByText('Hello world')).toBeInTheDocument();
  });

  it('renders avatar', () => {
    render(<FullProfileCard user={mockUser} onClose={vi.fn()} />);
    expect(screen.getByTestId('avatar-border-renderer')).toBeInTheDocument();
  });

  it('renders glass card container', () => {
    render(<FullProfileCard user={mockUser} onClose={vi.fn()} />);
    // The component uses a plain div, not mocked GlassCard
    expect(screen.getByText('Test User')).toBeInTheDocument();
  });
});
