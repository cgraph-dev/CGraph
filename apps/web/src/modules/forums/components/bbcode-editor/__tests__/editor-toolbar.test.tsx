/** @module EditorToolbar tests */
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

vi.mock('@/lib/utils', () => ({
  cn: (...args: (string | boolean | undefined)[]) => args.filter(Boolean).join(' '),
}));

vi.mock('./color-picker', () => ({
  ColorPicker: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div data-testid="color-picker" /> : <div data-testid="color-picker-closed" />,
}));

vi.mock('./size-picker', () => ({
  SizePicker: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div data-testid="size-picker" /> : <div data-testid="size-picker-closed" />,
}));

vi.mock('./smilies-picker', () => ({
  SmiliesPicker: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div data-testid="smilies-picker" /> : <div data-testid="smilies-picker-closed" />,
}));

import { EditorToolbar } from '../editor-toolbar';

const defaultProps = {
  insertTag: vi.fn(),
  insertAtCursor: vi.fn(),
  promptLink: vi.fn(),
  promptImage: vi.fn(),
  promptYouTube: vi.fn(),
  showColorPicker: false,
  setShowColorPicker: vi.fn(),
  showSizePicker: false,
  setShowSizePicker: vi.fn(),
  showSmilies: false,
  setShowSmilies: vi.fn(),
  showPreview: true,
  isPreviewMode: false,
  setIsPreviewMode: vi.fn(),
};

describe('EditorToolbar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders bold button', () => {
    render(<EditorToolbar {...defaultProps} />);
    expect(screen.getByTitle('Bold')).toBeInTheDocument();
  });

  it('calls insertTag for bold on click', () => {
    render(<EditorToolbar {...defaultProps} />);
    fireEvent.click(screen.getByTitle('Bold'));
    expect(defaultProps.insertTag).toHaveBeenCalledWith('[b]', '[/b]');
  });

  it('renders italic button and calls insertTag', () => {
    render(<EditorToolbar {...defaultProps} />);
    fireEvent.click(screen.getByTitle('Italic'));
    expect(defaultProps.insertTag).toHaveBeenCalledWith('[i]', '[/i]');
  });

  it('calls promptLink when link button is clicked', () => {
    render(<EditorToolbar {...defaultProps} />);
    fireEvent.click(screen.getByTitle('Insert Link'));
    expect(defaultProps.promptLink).toHaveBeenCalled();
  });

  it('calls promptImage when image button is clicked', () => {
    render(<EditorToolbar {...defaultProps} />);
    fireEvent.click(screen.getByTitle('Insert Image'));
    expect(defaultProps.promptImage).toHaveBeenCalled();
  });

  it('calls promptYouTube when YouTube button is clicked', () => {
    render(<EditorToolbar {...defaultProps} />);
    fireEvent.click(screen.getByTitle('Insert YouTube'));
    expect(defaultProps.promptYouTube).toHaveBeenCalled();
  });

  it('renders preview toggle when showPreview is true', () => {
    render(<EditorToolbar {...defaultProps} />);
    expect(screen.getByText('Preview')).toBeInTheDocument();
  });

  it('shows Edit text when in preview mode', () => {
    render(<EditorToolbar {...defaultProps} isPreviewMode />);
    expect(screen.getByText('Edit')).toBeInTheDocument();
  });

  it('calls setIsPreviewMode when preview button is clicked', () => {
    render(<EditorToolbar {...defaultProps} />);
    fireEvent.click(screen.getByText('Preview'));
    expect(defaultProps.setIsPreviewMode).toHaveBeenCalledWith(true);
  });

  it('renders code block button and calls insertTag', () => {
    render(<EditorToolbar {...defaultProps} />);
    fireEvent.click(screen.getByTitle('Code Block'));
    expect(defaultProps.insertTag).toHaveBeenCalledWith('[code]', '[/code]');
  });
});
