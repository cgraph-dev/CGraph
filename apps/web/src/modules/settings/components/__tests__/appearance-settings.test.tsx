/**
 * @file appearance-settings.test.tsx
 * @description Tests for AppearanceSettingsEnhanced component — comprehensive
 *   theme customization panel with visual theme picker, font scaling, etc.
 * @module settings/components/__tests__/AppearanceSettingsEnhanced
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

// ── framer-motion mock ───────────────────────────────────────────────

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

const mockThemeContext = {
  theme: { id: 'midnight', name: 'Midnight', category: 'dark', isBuiltIn: true, colors: {} },
  preferences: {
    settings: {
      fontScale: 1,
      messageSpacing: 'comfortable',
      messageDisplay: 'cozy',
      backgroundEffect: 'none',
      shaderVariant: 'default',
      backgroundIntensity: 0.6,
      reduceMotion: false,
      highContrast: false,
    },
  },
  availableThemes: [],
  isSystemPreference: false,
  setTheme: vi.fn(),
  updateSettings: vi.fn(),
  setFontScale: vi.fn(),
  setMessageDisplay: vi.fn(),
  setMessageSpacing: vi.fn(),
  toggleReduceMotion: vi.fn(),
  toggleHighContrast: vi.fn(),
  toggleSystemPreference: vi.fn(),
  deleteCustomTheme: vi.fn(),
};

vi.mock('@/contexts/theme-context-enhanced', () => ({
  useThemeEnhanced: () => mockThemeContext,
}));

vi.mock('./theme-selection', () => ({
  ThemeSelection: () => <div data-testid="theme-selection">ThemeSelection</div>,
}));
vi.mock('./display-options', () => ({
  DisplayOptions: () => <div data-testid="display-options">DisplayOptions</div>,
}));
vi.mock('./background-effects', () => ({
  BackgroundEffects: () => <div data-testid="bg-effects">BackgroundEffects</div>,
}));
vi.mock('./accessibility', () => ({
  Accessibility: () => <div data-testid="accessibility">Accessibility</div>,
}));
vi.mock('./live-preview', () => ({
  LivePreview: () => <div data-testid="live-preview">LivePreview</div>,
}));

import { AppearanceSettingsEnhanced } from '../appearance-settings/appearance-settings-enhanced';

// ── Tests ──────────────────────────────────────────────────────────────
describe('AppearanceSettingsEnhanced', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders the heading', () => {
    render(<AppearanceSettingsEnhanced />);
    expect(screen.getByText('Appearance')).toBeInTheDocument();
  });

  it('renders description text', () => {
    render(<AppearanceSettingsEnhanced />);
    expect(screen.getByText(/Customize how CGraph looks/)).toBeInTheDocument();
  });

  it('renders ThemeSelection section', () => {
    render(<AppearanceSettingsEnhanced />);
    expect(screen.getByTestId('theme-selection')).toBeInTheDocument();
  });

  it('renders DisplayOptions section', () => {
    render(<AppearanceSettingsEnhanced />);
    expect(screen.getByTestId('display-options')).toBeInTheDocument();
  });

  it('renders BackgroundEffects section', () => {
    render(<AppearanceSettingsEnhanced />);
    expect(screen.getByTestId('bg-effects')).toBeInTheDocument();
  });

  it('renders Accessibility section', () => {
    render(<AppearanceSettingsEnhanced />);
    expect(screen.getByTestId('accessibility')).toBeInTheDocument();
  });

  it('renders LivePreview section', () => {
    render(<AppearanceSettingsEnhanced />);
    expect(screen.getByTestId('live-preview')).toBeInTheDocument();
  });

  it('renders changes saved automatically note', () => {
    render(<AppearanceSettingsEnhanced />);
    expect(screen.getByText(/Changes are saved automatically/)).toBeInTheDocument();
  });
});
