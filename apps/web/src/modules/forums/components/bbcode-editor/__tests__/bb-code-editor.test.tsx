/** @module BBCodeEditor tests */
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

vi.mock('@/components/content/bb-code-renderer', () => ({
  __esModule: true,
  default: ({ content }: { content: string }) => <div data-testid="bbcode-preview">{content}</div>,
}));

vi.mock('@/lib/bbcode', () => ({
  validateBBCode: () => ({ isValid: true, errors: [] }),
  countBBCodeCharacters: (text: string) => text.length,
}));

vi.mock('@/lib/utils', () => ({
  cn: (...args: (string | boolean | undefined)[]) => args.filter(Boolean).join(' '),
}));

vi.mock('./hooks', () => ({
  useTextSelection: () => ({ getSelection: () => ({ start: 0, end: 0, text: '' }) }),
  useBBCodeInsertion: () => ({ insertTag: vi.fn(), insertAtCursor: vi.fn() }),
  useDropdownClose: vi.fn(),
}));

vi.mock('./editor-toolbar', () => ({
  EditorToolbar: (props: { isPreviewMode: boolean }) => (
    <div data-testid="editor-toolbar">{props.isPreviewMode ? 'preview' : 'edit'}</div>
  ),
}));

vi.mock('./editor-footer', () => ({
  EditorFooter: ({ charCount }: { charCount: number }) => (
    <div data-testid="editor-footer">chars:{charCount}</div>
  ),
}));

import BBCodeEditor from '../bb-code-editor';

describe('BBCodeEditor', () => {
  const onChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders textarea with placeholder', () => {
    render(<BBCodeEditor value="" onChange={onChange} />);
    expect(screen.getByPlaceholderText('Write your message...')).toBeInTheDocument();
  });

  it('renders custom placeholder', () => {
    render(<BBCodeEditor value="" onChange={onChange} placeholder="Enter BBCode..." />);
    expect(screen.getByPlaceholderText('Enter BBCode...')).toBeInTheDocument();
  });

  it('renders toolbar by default', () => {
    render(<BBCodeEditor value="" onChange={onChange} />);
    expect(screen.getByTestId('editor-toolbar')).toBeInTheDocument();
  });

  it('hides toolbar when disableToolbar is true', () => {
    render(<BBCodeEditor value="" onChange={onChange} disableToolbar />);
    expect(screen.queryByTestId('editor-toolbar')).not.toBeInTheDocument();
  });

  it('renders footer with character count', () => {
    render(<BBCodeEditor value="Hello" onChange={onChange} showCharCount />);
    expect(screen.getByTestId('editor-footer')).toHaveTextContent('chars:5');
  });

  it('calls onChange when text is typed', () => {
    render(<BBCodeEditor value="" onChange={onChange} />);
    fireEvent.change(screen.getByPlaceholderText('Write your message...'), {
      target: { value: 'Hello' },
    });
    expect(onChange).toHaveBeenCalledWith('Hello');
  });

  it('applies custom className', () => {
    const { container } = render(
      <BBCodeEditor value="" onChange={onChange} className="my-class" />
    );
    expect(container.firstChild).toHaveClass('my-class');
  });

  it('sets id on textarea when provided', () => {
    render(<BBCodeEditor value="" onChange={onChange} id="my-editor" />);
    expect(screen.getByPlaceholderText('Write your message...')).toHaveAttribute('id', 'my-editor');
  });

  it('applies minHeight style to textarea', () => {
    render(<BBCodeEditor value="" onChange={onChange} minHeight={200} />);
    const textarea = screen.getByPlaceholderText('Write your message...');
    expect(textarea).toHaveStyle({ minHeight: '200px' });
  });

  it('displays the current value in textarea', () => {
    render(<BBCodeEditor value="[b]Bold text[/b]" onChange={onChange} />);
    expect(screen.getByPlaceholderText('Write your message...')).toHaveValue('[b]Bold text[/b]');
  });
});
