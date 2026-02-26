/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

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

vi.mock('framer-motion', () => ({
  motion: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    div: ({ children, whileHover, whileTap, animate, initial, exit, transition, ...rest }: any) => (
      <div {...rest}>{children}</div>
    ),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    button: ({ children, whileHover, whileTap, ...rest }: any) => (
      <button {...rest}>{children}</button>
    ),
  },
  AnimatePresence: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}));

vi.mock('@/shared/components/ui', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  GlassCard: ({ children, className, ...rest }: any) => (
    <div data-testid="glass-card" className={className}>
      {children}
    </div>
  ),
}));

vi.mock('@/lib/animations/AnimationEngine', () => ({
  HapticFeedback: { light: vi.fn(), medium: vi.fn() },
}));

vi.mock('date-fns', () => ({
  format: vi.fn((date: Date, fmt: string) => {
    if (fmt === 'h:mm a') return '3:00 PM';
    if (fmt === 'EEEE, MMMM d, yyyy') return 'Monday, March 15, 2027';
    return date.toISOString();
  }),
  formatDistanceToNow: vi.fn(() => 'in 2 hours'),
}));

import { ScheduledMessageCard } from '../scheduled-message-card';
import { TypingIndicator } from '../typing-indicator';

// ── Fixtures ───────────────────────────────────────────────────────────

const mockMessage = {
  id: 'msg-1',
  conversationId: 'conv-1',
  senderId: 'user-1',
  content: 'Hello scheduled message',
  encryptedContent: null,
  isEncrypted: false,
  messageType: 'text' as const,
  replyToId: null,
  replyTo: null,
  isPinned: false,
  isEdited: false,
  deletedAt: null,
  metadata: {},
  reactions: [],
  sender: {
    id: 'user-1',
    username: 'alice',
    displayName: 'Alice',
    avatarUrl: null,
  },
  createdAt: '2027-03-15T12:00:00Z',
  updatedAt: '2027-03-15T12:00:00Z',
  scheduledAt: '2027-03-15T15:00:00Z',
  scheduleStatus: 'scheduled' as const,
};

// ── Tests ──────────────────────────────────────────────────────────────

describe('ScheduledMessageCard', () => {
  const defaultProps = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    message: mockMessage as any,
    onCancel: vi.fn(),
    onReschedule: vi.fn(),
    isCanceling: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders message content', () => {
    render(<ScheduledMessageCard {...defaultProps} />);
    expect(screen.getByText('Hello scheduled message')).toBeInTheDocument();
  });

  it('displays formatted scheduled time', () => {
    render(<ScheduledMessageCard {...defaultProps} />);
    expect(screen.getByText('3:00 PM')).toBeInTheDocument();
  });

  it('displays formatted date', () => {
    render(<ScheduledMessageCard {...defaultProps} />);
    expect(screen.getByText('Monday, March 15, 2027')).toBeInTheDocument();
  });

  it('displays relative time', () => {
    render(<ScheduledMessageCard {...defaultProps} />);
    expect(screen.getByText('in 2 hours')).toBeInTheDocument();
  });

  it('calls onReschedule when pencil button is clicked', () => {
    render(<ScheduledMessageCard {...defaultProps} />);
    const rescheduleBtn = screen.getByTitle('Reschedule');
    fireEvent.click(rescheduleBtn);
    expect(defaultProps.onReschedule).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel with message id when cancel button is clicked', () => {
    render(<ScheduledMessageCard {...defaultProps} />);
    const cancelBtn = screen.getByTitle('Cancel');
    fireEvent.click(cancelBtn);
    expect(defaultProps.onCancel).toHaveBeenCalledWith('msg-1');
  });

  it('disables cancel button when isCanceling is true', () => {
    render(<ScheduledMessageCard {...defaultProps} isCanceling={true} />);
    const cancelBtn = screen.getByTitle('Cancel');
    expect(cancelBtn).toBeDisabled();
  });
});

describe('TypingIndicator', () => {
  it('returns null when no one is typing', () => {
    const { container } = render(<TypingIndicator typing={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('shows single user typing text', () => {
    render(<TypingIndicator typing={['Alice']} />);
    expect(screen.getByText('Alice is typing...')).toBeInTheDocument();
  });

  it('shows generic typing text for multiple users', () => {
    render(<TypingIndicator typing={['Alice', 'Bob']} />);
    expect(screen.getByText('typing...')).toBeInTheDocument();
  });

  it('renders three bouncing dots', () => {
    const { container } = render(<TypingIndicator typing={['Alice']} />);
    // 3 dot divs inside flex container
    const dotContainer = container.querySelector('.flex.space-x-1\\.5');
    expect(dotContainer).toBeInTheDocument();
    expect(dotContainer?.children.length).toBe(3);
  });

  it('renders inside a GlassCard', () => {
    render(<TypingIndicator typing={['Alice']} />);
    expect(screen.getByTestId('glass-card')).toBeInTheDocument();
  });
});
