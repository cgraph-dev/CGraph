/** @module LeaderboardWidget tests */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

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

vi.mock('@/lib/animation-presets', () => ({
  tweens: { standard: {} },
  springs: { snappy: {}, bouncy: {} },
  loop: () => ({}),
  staggerConfigs: { fast: {} },
}));

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

vi.mock('@/stores/theme', () => ({
  useThemeStore: () => ({ theme: { colorPreset: 'blue' } }),
  THEME_COLORS: { blue: { primary: '#3b82f6' } },
}));

vi.mock('@/modules/auth/store', () => ({
  useAuthStore: () => ({
    user: { id: 'user-3' },
  }),
}));

vi.mock('./constants', () => ({
  LEADERBOARD_TYPES: [
    { value: 'xp', label: 'XP', icon: ({ className }: { className?: string }) => <span className={className} /> },
    { value: 'karma', label: 'Karma', icon: ({ className }: { className?: string }) => <span className={className} /> },
  ],
  TIME_PERIODS: [
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'allTime', label: 'All Time' },
  ],
}));

vi.mock('./podium', () => ({
  Podium: ({ entries }: { entries: unknown[] }) => <div data-testid="podium">Podium</div>,
}));

vi.mock('./leaderboard-entry-row', () => ({
  LeaderboardEntryRow: ({ entry }: { entry: { username: string } }) => (
    <div data-testid="leaderboard-entry">{entry.username}</div>
  ),
}));

vi.mock('./sidebar-variant', () => ({
  SidebarVariant: () => <div data-testid="sidebar-variant">Sidebar</div>,
}));

import { LeaderboardWidget } from '../leaderboard-widget/leaderboard-widget';

function makeEntry(rank: number, username: string, score: number, userId = `user-${rank}`) {
  return {
    rank,
    userId,
    username,
    displayName: username,
    avatarUrl: null,
    level: rank * 5,
    score,
  };
}

describe('LeaderboardWidget', () => {
  let onUserClick: ReturnType<typeof vi.fn>;
  let onTypeChange: ReturnType<typeof vi.fn>;
  let onTimePeriodChange: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onUserClick = vi.fn();
    onTypeChange = vi.fn();
    onTimePeriodChange = vi.fn();
  });

  it('renders GlassCard wrapper', () => {
    render(<LeaderboardWidget entries={[]} />);
    expect(screen.getByTestId('glass-card')).toBeInTheDocument();
  });

  it('renders type filter buttons when showFilters is true', () => {
    render(<LeaderboardWidget entries={[]} showFilters={true} />);
    expect(screen.getByText('XP')).toBeInTheDocument();
    expect(screen.getByText('Karma')).toBeInTheDocument();
  });

  it('renders time period buttons', () => {
    render(<LeaderboardWidget entries={[]} showFilters={true} />);
    expect(screen.getByText('Weekly')).toBeInTheDocument();
    expect(screen.getByText('Monthly')).toBeInTheDocument();
    expect(screen.getByText('All Time')).toBeInTheDocument();
  });

  it('calls onTypeChange when type button is clicked', () => {
    render(<LeaderboardWidget entries={[]} onTypeChange={onTypeChange} showFilters={true} />);
    fireEvent.click(screen.getByText('Karma'));
    expect(onTypeChange).toHaveBeenCalledWith('karma');
  });

  it('calls onTimePeriodChange when period button is clicked', () => {
    render(<LeaderboardWidget entries={[]} onTimePeriodChange={onTimePeriodChange} showFilters={true} />);
    fireEvent.click(screen.getByText('Monthly'));
    expect(onTimePeriodChange).toHaveBeenCalledWith('monthly');
  });

  it('renders the podium by default', () => {
    const entries = [makeEntry(1, 'alice', 1000), makeEntry(2, 'bob', 800), makeEntry(3, 'carol', 600)];
    render(<LeaderboardWidget entries={entries} showPodium={true} />);
    expect(screen.getByTestId('podium')).toBeInTheDocument();
  });

  it('hides filters when showFilters is false', () => {
    render(<LeaderboardWidget entries={[]} showFilters={false} />);
    expect(screen.queryByText('XP')).not.toBeInTheDocument();
  });

  it('renders sidebar variant when variant is sidebar', () => {
    render(<LeaderboardWidget entries={[makeEntry(1, 'alice', 100)]} variant="sidebar" />);
    expect(screen.getByTestId('sidebar-variant')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<LeaderboardWidget entries={[]} className="my-custom-class" />);
    expect(container.firstChild).toHaveClass('my-custom-class');
  });
});
