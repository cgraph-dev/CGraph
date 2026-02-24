// @ts-nocheck
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { ProfileCard } from '../profile-card/profile-card';
import type { ProfileCardUser } from '../profile-card/types';

// ── Mocks ──────────────────────────────────────────────────────────────

const mockTheme = {
  id: 'default',
  name: 'Default',
  colors: {
    primary: '#10B981',
    accent: '#8B5CF6',
    background: '#1a1a2e',
    surface: '#16213e',
    text: '#ffffff',
  },
  glassmorphism: true,
  borderRadius: 'md' as const,
  hoverEffect: 'scale' as const,
  fontFamily: 'Inter',
  background: { type: 'solid' as const, value: '#000' },
};

const mockConfig = {
  layout: 'minimal' as const,
  showBadges: true,
  showTitle: true,
  showStats: true,
  showActivity: false,
  showBio: true,
  maxBadges: 3,
};

vi.mock('@/stores/theme', () => ({
  useActiveProfileTheme: vi.fn(() => mockTheme),
  useProfileCardConfig: vi.fn(() => mockConfig),
}));

vi.mock('@/lib/utils', () => ({
  cn: (...args: any[]) => args.filter(Boolean).join(' '),
}));

vi.mock('../profile-card/MinimalLayout', () => ({
  MinimalLayout: ({ user }: any) => <div data-testid="minimal-layout">{user.displayName}</div>,
}));

vi.mock('../profile-card/CompactLayout', () => ({
  CompactLayout: ({ user }: any) => <div data-testid="compact-layout">{user.displayName}</div>,
}));

vi.mock('../profile-card/DetailedLayout', () => ({
  DetailedLayout: ({ user }: any) => <div data-testid="detailed-layout">{user.displayName}</div>,
}));

vi.mock('../profile-card/GamingLayout', () => ({
  GamingLayout: ({ user }: any) => <div data-testid="gaming-layout">{user.displayName}</div>,
}));

vi.mock('../profile-card/SocialLayout', () => ({
  SocialLayout: ({ user }: any) => <div data-testid="social-layout">{user.displayName}</div>,
}));

vi.mock('../profile-card/CreatorLayout', () => ({
  CreatorLayout: ({ user }: any) => <div data-testid="creator-layout">{user.displayName}</div>,
}));

// ── Helpers ────────────────────────────────────────────────────────────

const makeUser = (overrides?: Partial<ProfileCardUser>): ProfileCardUser => ({
  id: 'user-1',
  username: 'testuser',
  displayName: 'Test User',
  avatarUrl: '/avatar.png',
  level: 10,
  xp: 5000,
  xpToNextLevel: 10000,
  karma: 200,
  streak: 5,
  isOnline: false,
  ...overrides,
});

// ── Tests ──────────────────────────────────────────────────────────────

describe('ProfileCard', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders minimal layout by default', () => {
    render(<ProfileCard user={makeUser()} />);
    expect(screen.getByTestId('minimal-layout')).toBeInTheDocument();
    expect(screen.getByText('Test User')).toBeInTheDocument();
  });

  it('renders compact layout from config', () => {
    const config = { ...mockConfig, layout: 'compact' as const };
    render(<ProfileCard user={makeUser()} cardConfig={config} />);
    expect(screen.getByTestId('compact-layout')).toBeInTheDocument();
  });

  it('renders detailed layout from config', () => {
    const config = { ...mockConfig, layout: 'detailed' as const };
    render(<ProfileCard user={makeUser()} cardConfig={config} />);
    expect(screen.getByTestId('detailed-layout')).toBeInTheDocument();
  });

  it('renders gaming layout from config', () => {
    const config = { ...mockConfig, layout: 'gaming' as const };
    render(<ProfileCard user={makeUser()} cardConfig={config} />);
    expect(screen.getByTestId('gaming-layout')).toBeInTheDocument();
  });

  it('renders social layout from config', () => {
    const config = { ...mockConfig, layout: 'social' as const };
    render(<ProfileCard user={makeUser()} cardConfig={config} />);
    expect(screen.getByTestId('social-layout')).toBeInTheDocument();
  });

  it('renders creator layout from config', () => {
    const config = { ...mockConfig, layout: 'creator' as const };
    render(<ProfileCard user={makeUser()} cardConfig={config} />);
    expect(screen.getByTestId('creator-layout')).toBeInTheDocument();
  });

  it('falls back to detailed layout for custom layout', () => {
    const config = { ...mockConfig, layout: 'custom' as const };
    render(<ProfileCard user={makeUser()} cardConfig={config} />);
    expect(screen.getByTestId('detailed-layout')).toBeInTheDocument();
  });

  it('shows online indicator when user is online', () => {
    render(<ProfileCard user={makeUser({ isOnline: true })} />);
    const indicator = document.querySelector('.bg-green-500');
    expect(indicator).toBeTruthy();
  });

  it('hides online indicator when user is offline', () => {
    render(<ProfileCard user={makeUser({ isOnline: false })} />);
    const indicator = document.querySelector('.bg-green-500');
    expect(indicator).toBeNull();
  });

  it('fires onClick handler', () => {
    const onClick = vi.fn();
    const { container } = render(<ProfileCard user={makeUser()} onClick={onClick} />);
    fireEvent.click(container.firstChild!);
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('applies custom className', () => {
    const { container } = render(<ProfileCard user={makeUser()} className="my-card" />);
    expect(container.firstChild).toHaveClass('my-card');
  });

  it('accepts prop theme with glassmorphism disabled', () => {
    const customTheme = {
      ...mockTheme,
      glassmorphism: false,
      colors: { ...mockTheme.colors, surface: '#222' },
    };
    const { container } = render(<ProfileCard user={makeUser()} theme={customTheme} />);
    const card = container.firstChild as HTMLElement;
    expect(card.style.backdropFilter).toBe('none');
  });

  it('applies glassmorphism styles when enabled', () => {
    const { container } = render(<ProfileCard user={makeUser()} theme={mockTheme} />);
    const card = container.firstChild as HTMLElement;
    expect(card.style.backdropFilter).toBe('blur(12px)');
  });
});
