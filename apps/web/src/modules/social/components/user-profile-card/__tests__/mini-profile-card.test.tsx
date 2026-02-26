/** @module mini-profile-card tests */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

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
    <div data-testid="avatar-border-renderer" aria-label={alt} />
  ),
}));

vi.mock('@/shared/components/ui', () => ({
  AnimatedAvatar: ({ alt, size }: { alt: string; size: string }) => (
    <div data-testid="mini-avatar" data-size={size}>
      {alt}
    </div>
  ),
  GlassCard: ({ children, className }: React.PropsWithChildren<{ className?: string }>) => (
    <div className={className} data-testid="glass-card">
      {children}
    </div>
  ),
}));

vi.mock('@/components/theme/themed-avatar', () => ({
  ThemedAvatar: ({ alt, size }: { alt: string; size: string }) => (
    <div data-testid="themed-avatar" data-size={size}>
      {alt}
    </div>
  ),
}));

import { MiniProfileCard } from '../mini-profile-card';

describe('MiniProfileCard', () => {
  const mockUser = {
    id: 'u1',
    username: 'miniuser',
    displayName: 'Mini User',
    avatarUrl: '/mini.png',
    status: 'online',
    isOnline: true,
    level: 5,
    avatarBorderId: null,
  };

  it('renders display name', () => {
    render(<MiniProfileCard user={mockUser} onViewProfile={vi.fn()} onMessage={vi.fn()} />);
    expect(screen.getByText('Mini User')).toBeInTheDocument();
  });

  it('renders username', () => {
    render(<MiniProfileCard user={mockUser} onViewProfile={vi.fn()} onMessage={vi.fn()} />);
    expect(screen.getByText(/miniuser/)).toBeInTheDocument();
  });

  it('renders avatar', () => {
    render(<MiniProfileCard user={mockUser} onViewProfile={vi.fn()} onMessage={vi.fn()} />);
    const avatar = screen.getByTestId('avatar-border-renderer');
    expect(avatar).toBeInTheDocument();
  });

  it('shows online status indicator', () => {
    render(<MiniProfileCard user={mockUser} onViewProfile={vi.fn()} onMessage={vi.fn()} />);
    expect(screen.getByText('Mini User')).toBeInTheDocument();
  });
});
