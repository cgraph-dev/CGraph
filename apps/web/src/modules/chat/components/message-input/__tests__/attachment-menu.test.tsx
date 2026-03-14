/** @module AttachmentMenu tests */
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

vi.mock('@heroicons/react/24/outline', () => ({
  PlusCircleIcon: () => <svg data-testid="plus-circle-icon" />,
  PhotoIcon: () => <svg data-testid="photo-icon" />,
  DocumentIcon: () => <svg data-testid="document-icon" />,
  GifIcon: () => <svg data-testid="gif-icon" />,
}));

import { AttachmentMenu } from '../attachment-menu';

describe('AttachmentMenu', () => {
  const onToggle = vi.fn();
  const onFileSelect = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the toggle button with PlusCircleIcon', () => {
    render(
      <AttachmentMenu attachmentMode="none" onToggle={onToggle} onFileSelect={onFileSelect} />
    );
    expect(screen.getByTestId('plus-circle-icon')).toBeInTheDocument();
  });

  it('calls onToggle with "file" when toggle button is clicked', () => {
    render(
      <AttachmentMenu attachmentMode="none" onToggle={onToggle} onFileSelect={onFileSelect} />
    );
    const btn = screen.getByTestId('plus-circle-icon').closest('button');
    if (btn) fireEvent.click(btn);
    expect(onToggle).toHaveBeenCalledWith('file');
  });

  it('shows menu items when attachmentMode is "file"', () => {
    render(
      <AttachmentMenu attachmentMode="file" onToggle={onToggle} onFileSelect={onFileSelect} />
    );
    expect(screen.getByTestId('photo-icon')).toBeInTheDocument();
    expect(screen.getByTestId('document-icon')).toBeInTheDocument();
    expect(screen.getByTestId('gif-icon')).toBeInTheDocument();
  });

  it('hides menu items when attachmentMode is "none"', () => {
    render(
      <AttachmentMenu attachmentMode="none" onToggle={onToggle} onFileSelect={onFileSelect} />
    );
    expect(screen.queryByTestId('photo-icon')).not.toBeInTheDocument();
    expect(screen.queryByTestId('document-icon')).not.toBeInTheDocument();
  });

  it('calls onFileSelect when photo button is clicked', () => {
    render(
      <AttachmentMenu attachmentMode="file" onToggle={onToggle} onFileSelect={onFileSelect} />
    );
    const photoBtn = screen.getByTestId('photo-icon').closest('button');
    if (photoBtn) fireEvent.click(photoBtn);
    expect(onFileSelect).toHaveBeenCalled();
  });

  it('calls onFileSelect when document button is clicked', () => {
    render(
      <AttachmentMenu attachmentMode="file" onToggle={onToggle} onFileSelect={onFileSelect} />
    );
    const docBtn = screen.getByTestId('document-icon').closest('button');
    if (docBtn) fireEvent.click(docBtn);
    expect(onFileSelect).toHaveBeenCalled();
  });

  it('calls onToggle with "gif" when GIF button is clicked', () => {
    render(
      <AttachmentMenu attachmentMode="file" onToggle={onToggle} onFileSelect={onFileSelect} />
    );
    const gifBtn = screen.getByTestId('gif-icon').closest('button');
    if (gifBtn) fireEvent.click(gifBtn);
    expect(onToggle).toHaveBeenCalledWith('gif');
  });

  it('renders three action buttons in the dropdown', () => {
    render(
      <AttachmentMenu attachmentMode="file" onToggle={onToggle} onFileSelect={onFileSelect} />
    );
    const buttons = screen.getAllByRole('button');
    // toggle button + 3 attachment buttons
    expect(buttons.length).toBe(4);
  });
});
