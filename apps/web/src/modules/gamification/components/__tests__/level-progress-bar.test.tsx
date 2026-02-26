/** @module LevelProgress tests */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('@/lib/animation-presets', () => ({
  tweens: { standard: {} },
  springs: { snappy: {}, bouncy: {} },
  loop: () => ({}),
  staggerConfigs: { fast: {} },
}));

vi.mock('@heroicons/react/24/outline', () => ({
  SparklesIcon: ({ className }: { className?: string }) => (
    <span data-testid="sparkles-icon" className={className} />
  ),
  FireIcon: ({ className }: { className?: string }) => (
    <span data-testid="fire-icon" className={className} />
  ),
}));

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

vi.mock('@/lib/animations/animation-engine', () => ({
  HapticFeedback: { light: vi.fn(), medium: vi.fn(), success: vi.fn(), error: vi.fn() },
}));

const mockGamificationStore = {
  level: 5,
  currentXP: 350,
  totalXP: 2350,
  loginStreak: 7,
};

vi.mock('@/modules/gamification/store', () => ({
  useGamificationStore: () => mockGamificationStore,
}));

vi.mock('@/modules/gamification/components/level-progress.constants', () => ({
  calculateXPForLevel: (level: number) => level * 500,
  getStreakMultiplier: (streak: number) => (streak >= 7 ? 2 : streak >= 3 ? 1.5 : 1),
  XP_NOTIFICATION_DURATION: 3000,
  glowPulseCompact: { opacity: [0.3, 0.6, 0.3] },
  glowPulseExpanded: { opacity: [0.3, 0.6, 0.3] },
  glowTransitionCompact: { duration: 2 },
  glowTransitionExpanded: { duration: 2 },
  shimmerTransition: { duration: 1.5 },
  progressBarTransitionCompact: { duration: 1 },
  progressBarTransitionExpanded: { duration: 1 },
  barShimmerTransition: { repeat: Infinity, duration: 2 },
}));

import LevelProgress from '../level-progress';

describe('LevelProgress', () => {
  beforeEach(() => {
    mockGamificationStore.level = 5;
    mockGamificationStore.currentXP = 350;
    mockGamificationStore.totalXP = 2350;
    mockGamificationStore.loginStreak = 7;
  });

  it('renders the current level', () => {
    render(<LevelProgress />);
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('Level 5')).toBeInTheDocument();
  });

  it('renders XP progress text', () => {
    render(<LevelProgress />);
    expect(screen.getByText(/350/)).toBeInTheDocument();
  });

  it('renders GlassCard wrapper', () => {
    render(<LevelProgress />);
    expect(screen.getByTestId('glass-card')).toBeInTheDocument();
  });

  it('renders streak indicator when showStreak is true and streak > 0', () => {
    render(<LevelProgress showStreak={true} />);
    expect(screen.getByTestId('fire-icon')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();
  });

  it('hides streak indicator when showStreak is false', () => {
    render(<LevelProgress showStreak={false} />);
    expect(screen.queryByTestId('fire-icon')).not.toBeInTheDocument();
  });

  it('hides streak indicator when streak is 0', () => {
    mockGamificationStore.loginStreak = 0;
    render(<LevelProgress showStreak={true} />);
    expect(screen.queryByTestId('fire-icon')).not.toBeInTheDocument();
  });

  it('renders expanded variant with "Your Progress" heading', () => {
    render(<LevelProgress variant="expanded" />);
    expect(screen.getByText('Your Progress')).toBeInTheDocument();
  });

  it('renders total XP in expanded variant', () => {
    render(<LevelProgress variant="expanded" />);
    expect(screen.getByText('2,350 Total XP')).toBeInTheDocument();
  });

  it('renders sparkles icon in expanded variant', () => {
    render(<LevelProgress variant="expanded" />);
    expect(screen.getByTestId('sparkles-icon')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<LevelProgress className="my-custom-class" />);
    expect(container.firstChild).toHaveClass('my-custom-class');
  });
});
