/**
 * @file group-settings.test.tsx
 * @description Tests for GroupSettings component — comprehensive group settings
 *   interface with tabs for overview, roles, members, channels, etc.
 * @module groups/components/__tests__/GroupSettings
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

// ── framer-motion mock ───────────────────────────────────────────────

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

vi.mock('../role-manager', () => ({
  RoleManager: () => <div data-testid="role-manager">RoleManager</div>,
}));

const mockSetActiveTab = vi.fn();
const mockUseGroupSettings = {
  activeGroup: {
    id: 'g-1',
    name: 'Test Group',
    description: 'desc',
    iconUrl: null,
    bannerUrl: null,
    roles: [],
    channels: [],
  },
  activeTab: 'overview',
  setActiveTab: mockSetActiveTab,
  isOwner: true,
  formData: { name: 'Test Group', description: 'desc' },
  handleFormChange: vi.fn(),
  hasChanges: false,
  isSaving: false,
  handleSave: vi.fn(),
  handleReset: vi.fn(),
  showLeaveConfirm: false,
  setShowLeaveConfirm: vi.fn(),
  showDeleteConfirm: false,
  setShowDeleteConfirm: vi.fn(),
  handleLeave: vi.fn(),
  handleDelete: vi.fn(),
};

vi.mock('../group-settings/useGroupSettings', () => ({
  useGroupSettings: () => mockUseGroupSettings,
}));

vi.mock('../group-settings/settings-sidebar', () => ({
  SettingsSidebar: ({ onTabChange }: { onTabChange: (tab: string) => void }) => (
    <div data-testid="settings-sidebar">
      <button onClick={() => onTabChange('overview')}>Overview</button>
      <button onClick={() => onTabChange('roles')}>Roles</button>
      <button onClick={() => onTabChange('danger')}>Danger</button>
    </div>
  ),
}));

vi.mock('../group-settings/overview-tab', () => ({
  OverviewTab: () => <div data-testid="overview-tab">Overview</div>,
}));
vi.mock('../group-settings/members-tab', () => ({
  MembersTab: () => <div data-testid="members-tab">Members</div>,
}));
vi.mock('../group-settings/invites-tab', () => ({
  InvitesTab: () => <div data-testid="invites-tab">Invites</div>,
}));
vi.mock('../group-settings/channels-tab', () => ({
  ChannelsTab: () => <div data-testid="channels-tab">Channels</div>,
}));
vi.mock('../group-settings/notifications-tab', () => ({
  NotificationsTab: () => <div data-testid="notifications-tab">Notifications</div>,
}));
vi.mock('../group-settings/audit-log-tab', () => ({
  AuditLogTab: () => <div data-testid="audit-log-tab">AuditLog</div>,
}));
vi.mock('../group-settings/emoji-tab', () => ({
  EmojiTab: () => <div data-testid="emoji-tab">Emoji</div>,
}));
vi.mock('../group-settings/danger-tab', () => ({
  DangerTab: () => <div data-testid="danger-tab">Danger</div>,
}));
vi.mock('../group-settings/confirm-modal', () => ({ ConfirmModal: () => null }));
vi.mock('../group-settings/save-bar', () => ({
  SaveBar: ({ hasChanges }: { hasChanges: boolean }) => (
    <div data-testid="save-bar">{hasChanges ? 'Unsaved' : 'Saved'}</div>
  ),
}));

import { GroupSettings } from '../group-settings/group-settings';

// ── Tests ──────────────────────────────────────────────────────────────
describe('GroupSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseGroupSettings.activeGroup = {
      id: 'g-1',
      name: 'Test Group',
      description: 'desc',
      iconUrl: null,
      bannerUrl: null,
      roles: [],
      channels: [],
    };
    mockUseGroupSettings.activeTab = 'overview';
  });

  it('renders settings sidebar', () => {
    render(<GroupSettings groupId="g-1" onClose={vi.fn()} />);
    expect(screen.getByTestId('settings-sidebar')).toBeInTheDocument();
  });

  it('renders overview tab by default', () => {
    render(<GroupSettings groupId="g-1" onClose={vi.fn()} />);
    expect(screen.getByTestId('overview-tab')).toBeInTheDocument();
  });

  it('shows "Group not found" when activeGroup is null', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUseGroupSettings.activeGroup = null as any;
    render(<GroupSettings groupId="g-999" onClose={vi.fn()} />);
    expect(screen.getByText('Group not found')).toBeInTheDocument();
  });

  it('renders save bar', () => {
    render(<GroupSettings groupId="g-1" onClose={vi.fn()} />);
    expect(screen.getByTestId('save-bar')).toBeInTheDocument();
  });

  it('save bar shows "Saved" when no changes', () => {
    render(<GroupSettings groupId="g-1" onClose={vi.fn()} />);
    expect(screen.getByText('Saved')).toBeInTheDocument();
  });

  it('renders roles tab when activeTab is roles', () => {
    mockUseGroupSettings.activeTab = 'roles';
    render(<GroupSettings groupId="g-1" onClose={vi.fn()} />);
    expect(screen.getByTestId('role-manager')).toBeInTheDocument();
  });

  it('renders danger tab when activeTab is danger', () => {
    mockUseGroupSettings.activeTab = 'danger';
    render(<GroupSettings groupId="g-1" onClose={vi.fn()} />);
    expect(screen.getByTestId('danger-tab')).toBeInTheDocument();
  });

  it('renders members tab when activeTab is members', () => {
    mockUseGroupSettings.activeTab = 'members';
    render(<GroupSettings groupId="g-1" onClose={vi.fn()} />);
    expect(screen.getByTestId('members-tab')).toBeInTheDocument();
  });
});
