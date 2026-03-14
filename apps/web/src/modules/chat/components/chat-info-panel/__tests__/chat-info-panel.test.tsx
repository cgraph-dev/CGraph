/** @module ChatInfoPanel tests */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
  useLocation: () => ({ pathname: '/', search: '', hash: '', state: null }),
  useParams: () => ({}),
  Link: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
    <a {...props}>{children}</a>
  ),
  NavLink: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
    <a {...props}>{children}</a>
  ),
}));

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
        showPulse: true,
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
      showPulse: true,
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

vi.mock('@/lib/logger', () => ({
  createLogger: () => ({ debug: vi.fn(), error: vi.fn(), warn: vi.fn() }),
  chatLogger: { debug: vi.fn() },
}));

vi.mock('@/shared/components/ui', () => ({
  GlassCard: ({ children, className }: React.PropsWithChildren<{ className?: string }>) => (
    <div data-testid="glass-card" className={className}>
      {children}
    </div>
  ),
}));

vi.mock('@/lib/animations/transitions', () => ({
  springs: { smooth: { type: 'spring' } },
}));

vi.mock('../useChatInfoPanel', () => ({
  useChatInfoPanel: () => ({
    isMuted: false,
    isBlocking: false,
    isBlockLoading: false,
    isReporting: false,
    showBlockConfirm: false,
    setShowBlockConfirm: vi.fn(),
    showReportModal: false,
    setShowReportModal: vi.fn(),
    reportReason: '',
    setReportReason: vi.fn(),
    messageTTL: null,
    handleMuteToggle: vi.fn(),
    handleBlock: vi.fn(),
    handleReport: vi.fn(),
    handleViewProfile: vi.fn(),
    handleCustomizeChat: vi.fn(),
    handleNavigateToUser: vi.fn(),
    handleNavigateToForum: vi.fn(),
    handleUpdateTTL: vi.fn(),
  }),
}));

vi.mock('../profile-section', () => ({
  ProfileSection: ({ user }: { user: { displayName?: string } }) => (
    <div data-testid="profile-section">{user.displayName}</div>
  ),
}));

vi.mock('../stats-grid', () => ({
  StatsGrid: ({ pulse, streak }: { pulse: number; streak: number }) => (
    <div data-testid="stats-grid">
      pulse:{pulse} streak:{streak}
    </div>
  ),
}));

vi.mock('../badges-list', () => ({
  BadgesList: ({ badges }: { badges: unknown[] }) => (
    <div data-testid="badges-list">{badges.length} badges</div>
  ),
}));

vi.mock('../mutual-friends-list', () => ({
  MutualFriendsList: ({ friends }: { friends: unknown[] }) => (
    <div data-testid="mutual-friends">{friends.length} mutual friends</div>
  ),
}));

vi.mock('../shared-forums-list', () => ({
  SharedForumsList: ({ forums }: { forums: unknown[] }) => (
    <div data-testid="shared-forums">{forums.length} shared forums</div>
  ),
}));

vi.mock('../quick-actions', () => ({
  QuickActions: () => <div data-testid="quick-actions" />,
}));

vi.mock('../confirmation-modals', () => ({
  BlockConfirmModal: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div data-testid="block-confirm-modal" /> : null,
  ReportModal: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div data-testid="report-modal" /> : null,
}));

vi.mock('../../disappearing-messages-toggle', () => ({
  DisappearingMessagesToggle: () => <div data-testid="disappearing-messages" />,
}));

import ChatInfoPanel from '../chat-info-panel';

const defaultUser = {
  id: 'u1',
  username: 'testuser',
  displayName: 'Test User',
  avatarUrl: 'https://example.com/avatar.png',
  level: 5,
  xp: 1200,
  pulse: 42,
  streak: 7,
  onlineStatus: 'online' as const,
  bio: 'Hello world',
  badges: [{ id: 'b1', name: 'Pioneer', emoji: '🌟', rarity: 'rare' }],
};

const defaultProps = {
  userId: 'u1',
  conversationId: 'conv-1',
  user: defaultUser,
  mutualFriends: [{ id: 'f1', username: 'friend1' }],
  sharedForums: [{ id: 'fo1', name: 'General' }],
  onClose: vi.fn(),
  onMuteToggle: vi.fn(),
  onBlock: vi.fn(),
  onReport: vi.fn(),
};

describe('ChatInfoPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the header with "User Info" text', () => {
    render(<ChatInfoPanel {...defaultProps} />);
    expect(screen.getByText('User Info')).toBeInTheDocument();
  });

  it('renders profile section with user display name', () => {
    render(<ChatInfoPanel {...defaultProps} />);
    expect(screen.getByTestId('profile-section')).toHaveTextContent('Test User');
  });

  it('renders stats grid with pulse and streak', () => {
    render(<ChatInfoPanel {...defaultProps} />);
    expect(screen.getByTestId('stats-grid')).toHaveTextContent('pulse:42 streak:7');
  });

  it('renders bio when present', () => {
    render(<ChatInfoPanel {...defaultProps} />);
    expect(screen.getByText('Hello world')).toBeInTheDocument();
  });

  it('does not render bio when absent', () => {
    const user = { ...defaultUser, bio: undefined };
    render(<ChatInfoPanel {...defaultProps} user={user} />);
    expect(screen.queryByText('Hello world')).not.toBeInTheDocument();
  });

  it('renders badges list with correct count', () => {
    render(<ChatInfoPanel {...defaultProps} />);
    expect(screen.getByTestId('badges-list')).toHaveTextContent('1 badges');
  });

  it('renders mutual friends list', () => {
    render(<ChatInfoPanel {...defaultProps} />);
    expect(screen.getByTestId('mutual-friends')).toHaveTextContent('1 mutual friends');
  });

  it('renders shared forums list', () => {
    render(<ChatInfoPanel {...defaultProps} />);
    expect(screen.getByTestId('shared-forums')).toHaveTextContent('1 shared forums');
  });

  it('renders quick actions section', () => {
    render(<ChatInfoPanel {...defaultProps} />);
    expect(screen.getByTestId('quick-actions')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    render(<ChatInfoPanel {...defaultProps} />);
    const closeBtn = screen.getByTestId('icon-XMarkIcon').closest('button');
    if (closeBtn) fireEvent.click(closeBtn);
    expect(defaultProps.onClose).toHaveBeenCalled();
  });
});
