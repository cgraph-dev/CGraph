import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { StreakTracker } from '../streak-tracker/streak-tracker';
import type { StreakDay, StreakMilestone } from '../streak-tracker/types';

// ── Mocks ──────────────────────────────────────────────────────────────

vi.mock('@/stores/theme', () => ({
  useThemeStore: vi.fn((sel?: (s: Record<string, unknown>) => unknown) => {
    const __ts = {
      colorPreset: 'emerald',
      avatarBorder: 'none',
      avatarBorderColor: 'emerald',
      effectPreset: 'minimal',
      animationSpeed: 'normal',
      particlesEnabled: false,
      glowEnabled: false,
      animatedBackground: false,
      isPremium: false,
      chatBubble: {
        ownMessageBg: '#10b981',
        otherMessageBg: '#1f2937',
        borderRadius: 12,
        bubbleShape: 'rounded',
        showTail: true,
      },
      chatBubbleStyle: 'default',
      chatBubbleColor: 'emerald',
      profileThemeId: 'default',
      profileCardLayout: 'default',
      theme: {
        colorPreset: 'emerald',
        avatarBorder: 'none',
        avatarBorderColor: 'emerald',
        chatBubbleStyle: 'default',
        chatBubbleColor: 'emerald',
        bubbleBorderRadius: 12,
        bubbleShadowIntensity: 0,
        bubbleGlassEffect: false,
        glowEnabled: false,
        particlesEnabled: false,
        effectPreset: 'minimal',
        animationSpeed: 'normal',
        isPremium: false,
      },
      getColors: () => ({
        primary: '#10b981',
        secondary: '#34d399',
        glow: 'rgba(16,185,129,0.5)',
        name: 'Emerald',
        gradient: 'from-emerald-500 to-emerald-600',
      }),
      setColorPreset: vi.fn(),
      setEffectPreset: vi.fn(),
      setAnimationSpeed: vi.fn(),
      toggleParticles: vi.fn(),
      toggleGlow: vi.fn(),
      toggleBlur: vi.fn(),
      toggleAnimatedBackground: vi.fn(),
      updateChatBubble: vi.fn(),
      applyChatBubblePreset: vi.fn(),
      resetChatBubble: vi.fn(),
      updateTheme: vi.fn(),
      setAvatarBorder: vi.fn(),
      setChatBubbleStyle: vi.fn(),
      setEffect: vi.fn(),
      resetTheme: vi.fn(),
      reset: vi.fn(),
      applyPreset: vi.fn(),
      exportTheme: vi.fn(() => '{}'),
      importTheme: vi.fn(() => true),
      setProfileTheme: vi.fn(),
      setProfileCardLayout: vi.fn(),
      getProfileCardConfig: () => ({
        layout: 'default',
        showLevel: true,
        showXp: true,
        showKarma: true,
        showStreak: true,
        showBadges: true,
        maxBadges: 6,
        showTitle: true,
        showBio: true,
        showStats: true,
        showRecentActivity: false,
        showMutualFriends: false,
        showForumsInCommon: false,
        showAchievements: false,
        showSocialLinks: false,
      }),
      syncWithBackend: vi.fn(),
      saveToBackend: vi.fn(),
      clearError: vi.fn(),
      syncWithServer: vi.fn(),
    };
    return typeof sel === 'function' ? sel(__ts) : __ts;
  }),
  THEME_COLORS: {
    free: { primary: '#9ca3af', secondary: '#6b7280', accent: '#d1d5db' },
    premium: { primary: '#10b981', secondary: '#059669', accent: '#34d399' },
    emerald: { primary: '#10b981', secondary: '#059669', accent: '#34d399' },
    purple: { primary: '#8b5cf6', secondary: '#7c3aed', accent: '#a78bfa' },
    blue: { primary: '#3b82f6', secondary: '#2563eb', accent: '#60a5fa' },
  },
  COLORS: {
    emerald: {
      primary: '#10b981',
      secondary: '#34d399',
      glow: 'rgba(16,185,129,0.5)',
      name: 'Emerald',
      gradient: 'from-emerald-500 to-emerald-600',
    },
    purple: {
      primary: '#8b5cf6',
      secondary: '#a78bfa',
      glow: 'rgba(139,92,246,0.5)',
      name: 'Purple',
      gradient: 'from-purple-500 to-purple-600',
    },
  },
  useColorPreset: () => 'emerald',
  useProfileThemeId: () => 'default',
  useProfileCardLayout: () => 'default',
  useEffectPresetValue: () => 'minimal',
  useAnimationSpeedValue: () => 'normal',
  useParticlesEnabledValue: () => false,
  useGlowEnabledValue: () => false,
  useAnimatedBackgroundValue: () => false,
  useChatBubbleTheme: () => ({
    ownMessageBg: '#10b981',
    otherMessageBg: '#1f2937',
    borderRadius: 12,
    bubbleShape: 'rounded',
    showTail: true,
  }),
  useColorTheme: () => ({
    primary: '#10b981',
    secondary: '#34d399',
    glow: 'rgba(16,185,129,0.5)',
    name: 'Emerald',
    gradient: 'from-emerald-500 to-emerald-600',
  }),
  useProfileTheme: () => ({
    preset: 'minimalist-dark',
    cardConfig: {
      layout: 'default',
      showLevel: true,
      showXp: true,
      showKarma: true,
      showStreak: true,
      showBadges: true,
      maxBadges: 6,
      showTitle: true,
      showBio: true,
      showStats: true,
      showRecentActivity: false,
      showMutualFriends: false,
      showForumsInCommon: false,
      showAchievements: false,
      showSocialLinks: false,
    },
  }),
  useThemeEffects: () => ({
    effectPreset: 'minimal',
    animationSpeed: 'normal',
    particlesEnabled: false,
    glowEnabled: false,
  }),
  useChatBubbleStore: () => ({ ownMessageBg: '#10b981', otherMessageBg: '#1f2937' }),
  useProfileThemeStore: () => ({ profileThemeId: 'default', profileCardLayout: 'default' }),
  getPresetCategory: () => 'basic',
  getColorsForPreset: () => ({
    primary: '#10b981',
    secondary: '#34d399',
    glow: 'rgba(16,185,129,0.5)',
    name: 'Emerald',
    gradient: 'from-emerald-500 to-emerald-600',
  }),
  getProfileCardConfigForLayout: () => ({}),
  getThemePreset: () => ({}),
  useActiveProfileTheme: () => 'minimalist-dark',
  useProfileCardConfig: () => ({ layout: 'default' }),
  useForumThemeStore: () => ({}),
  useActiveForumTheme: () => null,
}));

vi.mock('@/shared/components/ui', () => ({
  GlassCard: ({ children, className }: { children?: React.ReactNode; className?: string }) => (
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
  FireAnimation: ({ currentStreak }: { currentStreak?: number }) => (
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
  ClaimableMilestones: ({ onClaim }: { onClaim: (n: number) => void }) => (
    <div data-testid="claimable-milestones">
      <button data-testid="claim-milestone" onClick={() => onClaim(7)}>
        Claim 7
      </button>
    </div>
  ),
}));

vi.mock('../streak-tracker/MilestonesList', () => ({
  MilestonesList: ({ isVisible }: { isVisible?: boolean }) =>
    isVisible ? <div data-testid="milestones-list" /> : null,
}));

vi.mock('../streak-tracker/StreakVariants', () => ({
  StreakWidgetVariant: ({
    currentStreak,
    onClaimDaily,
  }: {
    currentStreak?: number;
    onClaimDaily?: () => void;
  }) => (
    <div data-testid="widget-variant">
      <span>{currentStreak}</span>
      <button data-testid="widget-claim" onClick={onClaimDaily}>
        Claim
      </button>
    </div>
  ),
  StreakCompactVariant: ({ currentStreak }: { currentStreak?: number }) => (
    <div data-testid="compact-variant">{currentStreak}</div>
  ),
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
