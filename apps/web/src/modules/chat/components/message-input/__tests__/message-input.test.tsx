/** @module MessageInput tests */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

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

vi.mock('@/shared/components/ui', () => ({
  GlassCard: ({ children, className }: React.PropsWithChildren<{ className?: string }>) => (
    <div data-testid="glass-card" className={className}>
      {children}
    </div>
  ),
}));

const mockHandleSend = vi.fn();
const mockHandleChange = vi.fn();
const mockHandleKeyDown = vi.fn();

vi.mock('../useMessageInput', () => ({
  useMessageInput: () => ({
    message: '',
    attachments: [],
    attachmentMode: 'none',
    isRecording: false,
    showMentions: false,
    mentionQuery: '',
    inputRef: { current: null },
    fileInputRef: { current: null },
    handleChange: mockHandleChange,
    handleSend: mockHandleSend,
    handleKeyDown: mockHandleKeyDown,
    handleFileSelect: vi.fn(),
    handleDrop: vi.fn(),
    removeAttachment: vi.fn(),
    handleVoiceMessage: vi.fn(),
    handleStickerSelect: vi.fn(),
    handleGifSelect: vi.fn(),
    handleMentionSelect: vi.fn(),
    toggleAttachmentMode: vi.fn(),
    setIsRecording: vi.fn(),
    setAttachmentMode: vi.fn(),
    setShowMentions: vi.fn(),
  }),
}));

vi.mock('../reply-preview', () => ({
  ReplyPreview: ({ replyTo }: { replyTo?: { content: string } | null }) =>
    replyTo ? <div data-testid="reply-preview">{replyTo.content}</div> : null,
}));

vi.mock('../attachments-preview', () => ({
  AttachmentsPreview: ({ attachments }: { attachments: unknown[] }) => (
    <div data-testid="attachments-preview">{attachments.length} attachments</div>
  ),
}));

vi.mock('../attachment-menu', () => ({
  AttachmentMenu: () => <div data-testid="attachment-menu" />,
}));

vi.mock('../input-toolbar', () => ({
  InputToolbar: () => <div data-testid="input-toolbar" />,
}));

vi.mock('../mention-autocomplete', () => ({
  MentionAutocomplete: () => <div data-testid="mention-autocomplete" />,
}));

vi.mock('@/components/media/voice-message-recorder', () => ({
  VoiceMessageRecorder: () => <div data-testid="voice-recorder" />,
}));

vi.mock('@/modules/chat/components/sticker-picker', () => ({
  StickerPicker: () => <div data-testid="sticker-picker" />,
}));

vi.mock('@/modules/chat/components/gif-picker', () => ({
  GifPicker: () => <div data-testid="gif-picker" />,
}));

import { MessageInput } from '../message-input';

const defaultProps = {
  onSend: vi.fn(),
  onCancelReply: vi.fn(),
  onTyping: vi.fn(),
};

describe('MessageInput', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the message input textarea', () => {
    render(<MessageInput {...defaultProps} />);
    expect(screen.getByPlaceholderText('Type a message...')).toBeInTheDocument();
  });

  it('renders with custom placeholder', () => {
    render(<MessageInput {...defaultProps} placeholder="Write here..." />);
    expect(screen.getByPlaceholderText('Write here...')).toBeInTheDocument();
  });

  it('renders attachment menu', () => {
    render(<MessageInput {...defaultProps} />);
    expect(screen.getByTestId('attachment-menu')).toBeInTheDocument();
  });

  it('renders input toolbar', () => {
    render(<MessageInput {...defaultProps} />);
    expect(screen.getByTestId('input-toolbar')).toBeInTheDocument();
  });

  it('renders attachments preview', () => {
    render(<MessageInput {...defaultProps} />);
    expect(screen.getByTestId('attachments-preview')).toBeInTheDocument();
  });

  it('disables textarea when disabled prop is true', () => {
    render(<MessageInput {...defaultProps} disabled />);
    expect(screen.getByPlaceholderText('Type a message...')).toBeDisabled();
  });

  it('renders reply preview when replyTo is provided', () => {
    const replyTo = { id: 'r1', content: 'Original message', author: 'alice' };
    render(<MessageInput {...defaultProps} replyTo={replyTo} />);
    expect(screen.getByTestId('reply-preview')).toHaveTextContent('Original message');
  });

  it('does not render reply preview when replyTo is null', () => {
    render(<MessageInput {...defaultProps} replyTo={null} />);
    expect(screen.queryByTestId('reply-preview')).not.toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<MessageInput {...defaultProps} className="custom-class" />);
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('renders hidden file input', () => {
    const { container } = render(<MessageInput {...defaultProps} />);
    const fileInput = container.querySelector('input[type="file"]');
    expect(fileInput).toBeInTheDocument();
    expect(fileInput).toHaveClass('hidden');
  });
});
