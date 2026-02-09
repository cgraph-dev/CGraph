import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { StreakTracker } from '../streak-tracker/StreakTracker';
import type { StreakDay, StreakMilestone } from '../streak-tracker/types';

// ── Mocks ──────────────────────────────────────────────────────────────

vi.mock('@/stores/theme', () => ({
  useThemeStore: vi.fn(() => ({
    theme: { colorPreset: 'emerald' },
  })),
  THEME_COLORS: {
    emerald: { primary: '#10B981' },
  },
}));

vi.mock('framer-motion', () => ({
  motion: {
    button: ({ children, whileHover, whileTap, disabled, ...rest }: any) => (
      <button disabled={disabled} {...rest}>
        {children}
      </button>
    ),
    span: ({ children, ...rest }: any) => <span {...rest}>{children}</span>,
    div: ({ children, ...rest }: any) => <div {...rest}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
  Reorder: {
    Group: ({ children }: any) => <div>{children}</div>,
    Item: ({ children }: any) => <div>{children}</div>,
  },
}));

vi.mock('@/shared/components/ui', () => ({
  GlassCard: ({ children, className }: any) => (
    <div data-testid="glass-card" className={className}>
      {children}
    </div>
  ),
}));

vi.mock('@/lib/animations/AnimationEngine', () => ({
  HapticFeedback: { success: vi.fn(), light: vi.fn(), warning: vi.fn() },
}));

vi.mock('canvas-confetti', () => ({ default: vi.fn() }));

vi.mock('../streak-tracker/FireAnimation', () => ({
  FireAnimation: ({ currentStreak }: any) => (
    <div data-testid="fire-animation">{currentStreak}</div>
  ),
}));

vi.mock('../streak-tracker/WeeklyCalendar', () => ({
  WeeklyCalendar: () => <div data-testid="weekly-calendar" />,
}));

vi.mock('../streak-tracker/MilestoneProgress', () => ({
  MilestoneProgress: () => <div data-testid="milestone-progress" />,
}));

vi.mock('../streak-tracker/ClaimableMilestones', () => ({
  ClaimableMilestones: ({ onClaim }: any) => (
    <div data-testid="claimable-milestones">
      <button data-testid="claim-milestone" onClick={() => onClaim(7)}>
        Claim 7
      </button>
    </div>
  ),
}));

vi.mock('../streak-tracker/MilestonesList', () => ({
  MilestonesList: ({ isVisible }: any) =>
    isVisible ? <div data-testid="milestones-list" /> : null,
}));

vi.mock('../streak-tracker/StreakVariants', () => ({
  StreakWidgetVariant: ({ currentStreak, onClaimDaily }: any) => (
    <div data-testid="widget-variant">
      <span>{currentStreak}</span>
      <button data-testid="widget-claim" onClick={onClaimDaily}>
        Claim
      </button>
    </div>
  ),
  StreakCompactVariant: ({ currentStreak }: any) => (
    <div data-testid="compact-variant">{currentStreak}</div>
  ),
}));

vi.mock('@heroicons/react/24/outline', () => ({
  GiftIcon: (p: any) => <svg data-testid="gift-icon" {...p} />,
  CheckCircleIcon: (p: any) => <svg data-testid="check-icon" {...p} />,
  LockClosedIcon: (p: any) => <svg data-testid="lock-icon" {...p} />,
}));

// ── Helpers ────────────────────────────────────────────────────────────

const weeklyProgress: StreakDay[] = Array.from({ length: 7 }, (_, i) => ({
  date: `2026-02-0${i + 1}`,
  completed: i < 4,
}));

const baseMilestones: StreakMilestone[] = [
  { days: 7, reward: { xp: 500, coins: 100 }, claimed: false },
  { days: 14, reward: { xp: 1000, coins: 250 }, claimed: false },
];

const baseProps = {
  currentStreak: 5,
  longestStreak: 12,
  weeklyProgress,
  milestones: baseMilestones,
};

// ── Tests ──────────────────────────────────────────────────────────────

describe('StreakTracker', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders default variant with streak count', () => {
    render(<StreakTracker {...baseProps} />);
    expect(screen.getAllByText('5').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('day streak')).toBeInTheDocument();
  });

  it('shows longest streak', () => {
    render(<StreakTracker {...baseProps} />);
    expect(screen.getByText('12')).toBeInTheDocument();
  });

  it('shows XP multiplier when > 1', () => {
    render(<StreakTracker {...baseProps} streakMultiplier={2.0} />);
    expect(screen.getByText('2x XP Bonus')).toBeInTheDocument();
  });

  it('hides XP multiplier when 1', () => {
    render(<StreakTracker {...baseProps} streakMultiplier={1.0} />);
    expect(screen.queryByText(/XP Bonus/)).not.toBeInTheDocument();
  });

  it('shows freeze indicator when available', () => {
    render(<StreakTracker {...baseProps} hasFreeze freezesRemaining={2} />);
    expect(screen.getByText(/2 freezes/)).toBeInTheDocument();
    expect(screen.getByTestId('lock-icon')).toBeInTheDocument();
  });

  it('shows singular freeze text for 1 freeze', () => {
    render(<StreakTracker {...baseProps} hasFreeze freezesRemaining={1} />);
    expect(screen.getByText(/1 freeze$/)).toBeInTheDocument();
  });

  it('shows claim button when not yet claimed', () => {
    const onClaimDaily = vi.fn().mockResolvedValue(undefined);
    render(<StreakTracker {...baseProps} todayClaimed={false} onClaimDaily={onClaimDaily} />);
    expect(screen.getByText('Claim Daily Reward')).toBeInTheDocument();
  });

  it('shows claimed message when todayClaimed is true', () => {
    render(<StreakTracker {...baseProps} todayClaimed />);
    expect(screen.getByText("Today's reward claimed!")).toBeInTheDocument();
    expect(screen.getByTestId('check-icon')).toBeInTheDocument();
  });

  it('calls onClaimDaily on claim button click', async () => {
    const onClaimDaily = vi.fn().mockResolvedValue(undefined);
    render(<StreakTracker {...baseProps} todayClaimed={false} onClaimDaily={onClaimDaily} />);
    fireEvent.click(screen.getByText('Claim Daily Reward'));
    await waitFor(() => expect(onClaimDaily).toHaveBeenCalledOnce());
  });

  it('toggles milestones list visibility', () => {
    render(<StreakTracker {...baseProps} />);
    expect(screen.queryByTestId('milestones-list')).not.toBeInTheDocument();
    fireEvent.click(screen.getByText('View All Milestones'));
    expect(screen.getByTestId('milestones-list')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Hide All Milestones'));
    expect(screen.queryByTestId('milestones-list')).not.toBeInTheDocument();
  });

  it('renders widget variant', () => {
    render(<StreakTracker {...baseProps} variant="widget" />);
    expect(screen.getByTestId('widget-variant')).toBeInTheDocument();
  });

  it('renders compact variant', () => {
    render(<StreakTracker {...baseProps} variant="compact" />);
    expect(screen.getByTestId('compact-variant')).toBeInTheDocument();
  });

  it('renders fire animation', () => {
    render(<StreakTracker {...baseProps} />);
    expect(screen.getByTestId('fire-animation')).toBeInTheDocument();
  });

  it('renders sub-components in default variant', () => {
    render(<StreakTracker {...baseProps} />);
    expect(screen.getByTestId('weekly-calendar')).toBeInTheDocument();
    expect(screen.getByTestId('milestone-progress')).toBeInTheDocument();
    expect(screen.getByTestId('claimable-milestones')).toBeInTheDocument();
  });

  it('handles milestone claim', async () => {
    const onClaimMilestone = vi.fn().mockResolvedValue(undefined);
    render(<StreakTracker {...baseProps} onClaimMilestone={onClaimMilestone} />);
    fireEvent.click(screen.getByTestId('claim-milestone'));
    await waitFor(() => expect(onClaimMilestone).toHaveBeenCalledWith(7));
  });

  it('applies custom className', () => {
    const { container } = render(<StreakTracker {...baseProps} className="my-class" />);
    expect(container.firstChild).toHaveClass('my-class');
  });
});
