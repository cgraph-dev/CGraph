/**
 * @file profile-stats.test.tsx
 * @description Tests for ProfileStatsGrid and ProfileSidebar components —
 *   profile statistic displays including level, XP, streak, friends, and karma.
 * @module social/components/__tests__/ProfileStats
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

// ── framer-motion mock ───────────────────────────────────────────────
vi.mock('framer-motion', () => {
  const cache = new Map<string | symbol, (p: React.PropsWithChildren<Record<string, unknown>>) => React.ReactElement>();
  return {
    motion: new Proxy({} as Record<string, (p: React.PropsWithChildren<Record<string, unknown>>) => React.ReactElement>, {
      get: (_target, prop) => {
        if (!cache.has(prop)) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const Tag = (typeof prop === 'string' ? prop : 'div') as any;
          cache.set(prop, function MotionMock({ children, className, onClick }) {
            return <Tag className={className as string} onClick={onClick as React.MouseEventHandler}>{children}</Tag>;
          });
        }
        return cache.get(prop);
      },
    }),
    AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
  };
});

vi.mock('@/lib/animation-presets', () => ({ tweens: { standard: {} }, springs: { snappy: {}, bouncy: {} }, loop: () => ({}), loopWithDelay: () => ({}) }));
vi.mock('@/stores/theme', () => ({ useThemeStore: () => ({ theme: { colorPreset: 'blue' } }), THEME_COLORS: { blue: { primary: '#3b82f6', accent: '#8b5cf6' } } }));

vi.mock('@heroicons/react/24/outline', () => ({
  UserPlusIcon: (p: React.SVGProps<SVGSVGElement>) => <svg data-testid="user-plus-icon" {...p} />,
  StarIcon: (p: React.SVGProps<SVGSVGElement>) => <svg data-testid="star-icon" {...p} />,
  SparklesIcon: (p: React.SVGProps<SVGSVGElement>) => <svg data-testid="sparkles-icon" {...p} />,
  BoltIcon: (p: React.SVGProps<SVGSVGElement>) => <svg data-testid="bolt-icon" {...p} />,
  FireIcon: (p: React.SVGProps<SVGSVGElement>) => <svg data-testid="fire-icon" {...p} />,
  ChartBarIcon: (p: React.SVGProps<SVGSVGElement>) => <svg data-testid="chart-icon" {...p} />,
  ArrowTrendingUpIcon: (p: React.SVGProps<SVGSVGElement>) => <svg data-testid="trending-icon" {...p} />,
  CalendarDaysIcon: (p: React.SVGProps<SVGSVGElement>) => <svg {...p} />,
  MapPinIcon: (p: React.SVGProps<SVGSVGElement>) => <svg {...p} />,
  LinkIcon: (p: React.SVGProps<SVGSVGElement>) => <svg {...p} />,
}));

vi.mock('@/shared/components/ui', () => ({
  GlassCard: ({ children, className }: React.PropsWithChildren<{ className?: string }>) => (
    <div data-testid="glass-card" className={className}>{children}</div>
  ),
}));

vi.mock('@/lib/animations/animation-engine', () => ({
  HapticFeedback: { light: vi.fn(), medium: vi.fn() },
}));

import { ProfileStatsGrid, ProfileSidebar } from '../profile-stats';

// ── Helpers ────────────────────────────────────────────────────────────
const makeProfile = (overrides?: Record<string, unknown>) => ({
  id: 'u-1',
  username: 'testuser',
  displayName: 'Test User',
  level: 15,
  totalXP: 12500,
  loginStreak: 7,
  friendsCount: 42,
  karma: 1500,
  createdAt: '2024-06-15T00:00:00Z',
  ...overrides,
});

// ── Tests — ProfileStatsGrid ───────────────────────────────────────────
describe('ProfileStatsGrid', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders Statistics heading', () => {
    render(<ProfileStatsGrid profile={makeProfile()} />);
    expect(screen.getByText('Statistics')).toBeInTheDocument();
  });

  it('renders level value', () => {
    render(<ProfileStatsGrid profile={makeProfile({ level: 25 })} />);
    expect(screen.getByText('25')).toBeInTheDocument();
  });

  it('renders total XP', () => {
    render(<ProfileStatsGrid profile={makeProfile({ totalXP: 5000 })} />);
    expect(screen.getByText('5,000')).toBeInTheDocument();
  });

  it('renders login streak', () => {
    render(<ProfileStatsGrid profile={makeProfile({ loginStreak: 10 })} />);
    expect(screen.getByText('10')).toBeInTheDocument();
  });

  it('renders friends count', () => {
    render(<ProfileStatsGrid profile={makeProfile({ friendsCount: 100 })} />);
    expect(screen.getByText('100')).toBeInTheDocument();
  });

  it('shows "Level" label', () => {
    render(<ProfileStatsGrid profile={makeProfile()} />);
    expect(screen.getByText('Level')).toBeInTheDocument();
  });

  it('shows "Total XP" label', () => {
    render(<ProfileStatsGrid profile={makeProfile()} />);
    expect(screen.getByText('Total XP')).toBeInTheDocument();
  });

  it('shows "Day Streak" label', () => {
    render(<ProfileStatsGrid profile={makeProfile()} />);
    expect(screen.getByText('Day Streak')).toBeInTheDocument();
  });

  it('shows "Friends" label', () => {
    render(<ProfileStatsGrid profile={makeProfile()} />);
    expect(screen.getByText('Friends')).toBeInTheDocument();
  });
});

// ── Tests — ProfileSidebar ────────────────────────────────────────────
describe('ProfileSidebar', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders Karma value', () => {
    render(<ProfileSidebar profile={makeProfile({ karma: 2500 })} />);
    expect(screen.getByText('2,500')).toBeInTheDocument();
  });

  it('shows "Top contributor" for karma > 1000', () => {
    render(<ProfileSidebar profile={makeProfile({ karma: 5000 })} />);
    expect(screen.getByText('Top contributor')).toBeInTheDocument();
  });

  it('shows "Legendary contributor" for karma > 10000', () => {
    render(<ProfileSidebar profile={makeProfile({ karma: 15000 })} />);
    expect(screen.getByText('Legendary contributor')).toBeInTheDocument();
  });

  it('shows "Active contributor" for karma 101-1000', () => {
    render(<ProfileSidebar profile={makeProfile({ karma: 500 })} />);
    expect(screen.getByText('Active contributor')).toBeInTheDocument();
  });

  it('renders Karma label', () => {
    render(<ProfileSidebar profile={makeProfile()} />);
    expect(screen.getByText('Karma')).toBeInTheDocument();
  });

  it('renders join date', () => {
    render(<ProfileSidebar profile={makeProfile({ createdAt: '2024-06-15T00:00:00Z' })} />);
    expect(screen.getByText(/June 2024/)).toBeInTheDocument();
  });
});
