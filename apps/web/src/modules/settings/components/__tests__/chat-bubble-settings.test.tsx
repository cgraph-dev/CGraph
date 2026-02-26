/** @module ChatBubbleSettings tests */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('@/shared/components/ui', () => ({
  GlassCard: ({
    children,
    className,
    variant,
  }: {
    children: React.ReactNode;
    className?: string;
    variant?: string;
  }) => (
    <div data-testid="glass-card" className={className} data-variant={variant}>
      {children}
    </div>
  ),
}));

const mockUpdateChatBubble = vi.fn();
const mockResetChatBubble = vi.fn();
const mockApplyPreset = vi.fn();

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

vi.mock('@/modules/settings/store/customization', () => ({
  useChatCustomization: () => ({
    updateChat: vi.fn(),
  }),
}));

vi.mock('@/data/chatBackgrounds', () => ({
  CHAT_BACKGROUNDS: [{ id: 'default_dark', name: 'Dark', category: 'solid' }],
  getBackgroundsByCategory: () => [],
}));

vi.mock('./chat-bubble-settings.constants', () => ({
  CHAT_BUBBLE_PRESETS_UI: [
    { id: 'default', label: 'Default', preview: 'bg-gray-700' },
    { id: 'neon', label: 'Neon', preview: 'bg-green-500' },
  ],
  CHAT_BUBBLE_TABS: [
    { id: 'colors', label: 'Colors' },
    { id: 'shape', label: 'Shape' },
  ],
}));

vi.mock('./chat-bubble-tabs', () => ({
  ColorsTab: () => <div data-testid="colors-tab">Colors Tab</div>,
  ShapeTab: () => <div data-testid="shape-tab">Shape Tab</div>,
  EffectsTab: () => <div data-testid="effects-tab">Effects Tab</div>,
  AnimationsTab: () => <div data-testid="animations-tab">Animations Tab</div>,
  LayoutTab: () => <div data-testid="layout-tab">Layout Tab</div>,
  BackgroundsTab: () => <div data-testid="backgrounds-tab">Backgrounds Tab</div>,
}));

import ChatBubbleSettings from '../chat-bubble-settings';

describe('ChatBubbleSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the settings header', () => {
    render(<ChatBubbleSettings />);
    expect(screen.getByText('Chat Bubble Customization')).toBeInTheDocument();
  });

  it('renders subtitle text', () => {
    render(<ChatBubbleSettings />);
    expect(screen.getByText('Personalize your message bubbles')).toBeInTheDocument();
  });

  it('renders the chat bubble icon', () => {
    render(<ChatBubbleSettings />);
    expect(screen.getByTestId('icon-ChatBubbleLeftIcon')).toBeInTheDocument();
  });

  it('renders the reset button icon', () => {
    render(<ChatBubbleSettings />);
    expect(screen.getByTestId('icon-ArrowPathIcon')).toBeInTheDocument();
  });

  it('renders Quick Presets section', () => {
    render(<ChatBubbleSettings />);
    expect(screen.getByText('Quick Presets')).toBeInTheDocument();
  });

  it('renders preset options', () => {
    render(<ChatBubbleSettings />);
    expect(screen.getByText('Default')).toBeInTheDocument();
    expect(screen.getByText('Neon')).toBeInTheDocument();
  });

  it('renders Preview section', () => {
    render(<ChatBubbleSettings />);
    expect(screen.getByText('Preview')).toBeInTheDocument();
  });

  it('renders GlassCard components', () => {
    render(<ChatBubbleSettings />);
    const cards = screen.getAllByTestId('glass-card');
    expect(cards.length).toBeGreaterThanOrEqual(2);
  });

  it('calls applyPreset when a preset button is clicked', () => {
    render(<ChatBubbleSettings />);
    fireEvent.click(screen.getByText('Neon'));
    expect(mockApplyPreset).toHaveBeenCalledWith('neon');
  });
});
