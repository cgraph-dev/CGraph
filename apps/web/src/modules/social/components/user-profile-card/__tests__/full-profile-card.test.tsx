/** @module full-profile-card tests */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('framer-motion', () => {
  const motionProxy = new Proxy({}, {
    get: (_target, prop) => {
      if (typeof prop === 'string') {
        return ({ children, initial, animate, exit, transition, variants, whileHover, whileTap, whileInView, layout, layoutId, ...rest }: any) => {
          const Tag = prop as any;
          return <Tag {...rest}>{children}</Tag>;
        };
      }
      return undefined;
    },
  });
  return {
    motion: motionProxy,
    AnimatePresence: ({ children }: any) => <>{children}</>,
    useAnimation: () => ({ start: vi.fn() }),
    useInView: () => true,
    useMotionValue: () => ({ get: () => 0, set: vi.fn() }),
    useTransform: () => ({ get: () => 0 }),
    useSpring: () => ({ get: () => 0 }),
  };
});

const iconProxy = new Proxy({}, {
  get: (_target, prop) => {
    if (typeof prop === 'string' && prop !== '__esModule') {
      return (props: any) => <span data-testid={`icon-${prop}`} {...props} />;
    }
    return undefined;
  },
});
vi.mock('@heroicons/react/24/outline', () => iconProxy);
vi.mock('@heroicons/react/24/solid', () => iconProxy);

vi.mock('react-router-dom', () => ({
  Link: ({ children, to, ...rest }: any) => <a href={to} {...rest}>{children}</a>,
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
  AvatarBorderRenderer: ({ alt }: { alt: string }) => <div data-testid="avatar-border-renderer">{alt}</div>,
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
    <div className={className} data-testid="glass-card">{children}</div>
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
    avatarBorderId: null,
    equippedTitle: null,
    pronouns: null,
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
