/** @module ConversationModals tests */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

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

vi.mock('@/lib/logger', () => ({
  createLogger: () => ({ debug: vi.fn(), error: vi.fn(), warn: vi.fn() }),
  chatLogger: { debug: vi.fn() },
}));

vi.mock('@/modules/chat/components/e2-ee-connection-tester', () => ({
  __esModule: true,
  default: ({ onClose }: { onClose: () => void }) => (
    <div data-testid="e2ee-tester">
      <button onClick={onClose}>close</button>
    </div>
  ),
}));

vi.mock('@/modules/chat/components/e2-ee-error-modal', () => ({
  E2EEErrorModal: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div data-testid="e2ee-error-modal" /> : null,
}));

vi.mock('@/modules/chat/components/forward-message-modal', () => ({
  ForwardMessageModal: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div data-testid="forward-modal" /> : null,
}));

vi.mock('@/modules/chat/components/message-search', () => ({
  MessageSearch: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div data-testid="message-search" /> : null,
}));

vi.mock('@/modules/chat/components/schedule-message-modal', () => ({
  ScheduleMessageModal: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div data-testid="schedule-modal" /> : null,
}));

vi.mock('@/modules/chat/components/scheduled-messages-list', () => ({
  ScheduledMessagesList: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div data-testid="scheduled-list" /> : null,
}));

vi.mock('@/modules/calls/components/voice-call-modal', () => ({
  VoiceCallModal: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div data-testid="voice-call-modal" /> : null,
}));

vi.mock('@/modules/calls/components/video-call-modal', () => ({
  VideoCallModal: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div data-testid="video-call-modal" /> : null,
}));

vi.mock('@/modules/chat/components/chat-info-panel', () => ({
  __esModule: true,
  default: () => <div data-testid="chat-info-panel" />,
}));

import { ConversationModals } from '../conversation-modals';

const baseProps = {
  conversationId: 'conv-1',
  showE2EETester: false,
  setShowE2EETester: vi.fn(),
  otherParticipantUserId: 'u2',
  conversationName: 'Alice',
  showE2EEError: false,
  setShowE2EEError: vi.fn(),
  e2eeErrorMessage: '',
  onRetryE2EE: vi.fn(),
  onSendUnencrypted: vi.fn(),
  setPendingMessage: vi.fn(),
  showForwardModal: false,
  setShowForwardModal: vi.fn(),
  messageToForward: null,
  setMessageToForward: vi.fn(),
  onForwardMessage: vi.fn(),
  showMessageSearch: false,
  setShowMessageSearch: vi.fn(),
  onSearchResultClick: vi.fn(),
  showScheduledList: false,
  setShowScheduledList: vi.fn(),
  onRescheduleClick: vi.fn(),
  showScheduleModal: false,
  setShowScheduleModal: vi.fn(),
  messageToSchedule: '',
  setMessageToSchedule: vi.fn(),
  messageToReschedule: null,
  setMessageToReschedule: vi.fn(),
  onSchedule: vi.fn(),
  showVoiceCallModal: false,
  setShowVoiceCallModal: vi.fn(),
  showVideoCallModal: false,
  setShowVideoCallModal: vi.fn(),
  incomingRoomId: undefined,
  setIncomingRoomId: vi.fn(),
  otherParticipantAvatar: undefined,
  showInfoPanel: false,
  setShowInfoPanel: vi.fn(),
  showSafetyNumber: false,
  setShowSafetyNumber: vi.fn(),
  otherParticipant: {
    user: { id: 'u2', username: 'alice', displayName: 'Alice' },
  },
  isOtherUserOnline: true,
  mutualFriends: [],
};

describe('ConversationModals', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing with all modals closed', () => {
    const { container } = render(<ConversationModals {...baseProps} />);
    expect(container).toBeTruthy();
  });

  it('shows E2EE tester when showE2EETester is true', () => {
    render(<ConversationModals {...baseProps} showE2EETester />);
    expect(screen.getByTestId('e2ee-tester')).toBeInTheDocument();
  });

  it('hides E2EE tester when otherParticipantUserId is undefined', () => {
    render(<ConversationModals {...baseProps} showE2EETester otherParticipantUserId={undefined} />);
    expect(screen.queryByTestId('e2ee-tester')).not.toBeInTheDocument();
  });

  it('shows message search when showMessageSearch is true', () => {
    render(<ConversationModals {...baseProps} showMessageSearch />);
    expect(screen.getByTestId('message-search')).toBeInTheDocument();
  });

  it('shows voice call modal when showVoiceCallModal is true', () => {
    render(<ConversationModals {...baseProps} showVoiceCallModal />);
    expect(screen.getByTestId('voice-call-modal')).toBeInTheDocument();
  });

  it('shows video call modal when showVideoCallModal is true', () => {
    render(<ConversationModals {...baseProps} showVideoCallModal />);
    expect(screen.getByTestId('video-call-modal')).toBeInTheDocument();
  });

  it('shows schedule modal when showScheduleModal is true', () => {
    render(<ConversationModals {...baseProps} showScheduleModal />);
    expect(screen.getByTestId('schedule-modal')).toBeInTheDocument();
  });

  it('shows info panel when showInfoPanel is true', () => {
    render(<ConversationModals {...baseProps} showInfoPanel />);
    expect(screen.getByTestId('chat-info-panel')).toBeInTheDocument();
  });

  it('hides info panel when otherParticipant is null', () => {
    render(<ConversationModals {...baseProps} showInfoPanel otherParticipant={null} />);
    expect(screen.queryByTestId('chat-info-panel')).not.toBeInTheDocument();
  });

  it('shows scheduled list when showScheduledList is true', () => {
    render(<ConversationModals {...baseProps} showScheduledList />);
    expect(screen.getByTestId('scheduled-list')).toBeInTheDocument();
  });
});
