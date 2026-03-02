/** @module ContentSortFilter tests */
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

vi.mock('@heroicons/react/24/outline', () => ({
  ArrowsUpDownIcon: () => <svg data-testid="arrows-icon" />,
}));

vi.mock('@/modules/search/components/advanced-search/constants', () => ({
  SELECT_CLS: 'mock-select-cls',
  LABEL_CLS: 'mock-label-cls',
  CONTENT_TYPES: ['all', 'threads', 'posts'] as const,
  SORT_BY_OPTIONS: [
    { value: 'relevance', label: 'Relevance' },
    { value: 'date', label: 'Date' },
    { value: 'author', label: 'Author' },
    { value: 'replies', label: 'Replies' },
    { value: 'views', label: 'Views' },
  ],
}));

import { ContentSortFilter } from '../content-sort-filter';
import type { AdvancedSearchFilters } from '../types';

const defaultFilters: AdvancedSearchFilters = {
  keywords: '',
  author: '',
  dateRange: 'any' as const,
  searchIn: 'all' as const,
  forumId: null,
  includeSubforums: true,
  contentType: 'all' as const,
  showClosed: true,
  showSticky: true,
  showNormal: true,
  sortBy: 'relevance' as const,
  sortOrder: 'desc' as const,
  resultsPerPage: 25,
};

describe('ContentSortFilter', () => {
  const updateFilter = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders content type radio buttons', () => {
    render(<ContentSortFilter filters={defaultFilters} updateFilter={updateFilter} />);
    expect(screen.getByLabelText('All')).toBeInTheDocument();
    expect(screen.getByLabelText('Threads')).toBeInTheDocument();
    expect(screen.getByLabelText('Posts')).toBeInTheDocument();
  });

  it('checks the matching content type radio', () => {
    render(<ContentSortFilter filters={defaultFilters} updateFilter={updateFilter} />);
    expect(screen.getByLabelText('All')).toBeChecked();
  });

  it('calls updateFilter when content type is changed', () => {
    render(<ContentSortFilter filters={defaultFilters} updateFilter={updateFilter} />);
    fireEvent.click(screen.getByLabelText('Threads'));
    expect(updateFilter).toHaveBeenCalledWith('contentType', 'threads');
  });

  it('renders sort by select with options', () => {
    render(<ContentSortFilter filters={defaultFilters} updateFilter={updateFilter} />);
    expect(screen.getByText('Relevance')).toBeInTheDocument();
    expect(screen.getByText('Date')).toBeInTheDocument();
    expect(screen.getByText('Author')).toBeInTheDocument();
  });

  it('calls updateFilter when sort by is changed', () => {
    render(<ContentSortFilter filters={defaultFilters} updateFilter={updateFilter} />);
    const selects = screen.getAllByRole('combobox');
    fireEvent.change(selects[0]!, { target: { value: 'date' } });
    expect(updateFilter).toHaveBeenCalledWith('sortBy', 'date');
  });

  it('renders sort order select with Ascending and Descending', () => {
    render(<ContentSortFilter filters={defaultFilters} updateFilter={updateFilter} />);
    expect(screen.getByText('Descending')).toBeInTheDocument();
    expect(screen.getByText('Ascending')).toBeInTheDocument();
  });

  it('calls updateFilter when sort order is changed', () => {
    render(<ContentSortFilter filters={defaultFilters} updateFilter={updateFilter} />);
    const selects = screen.getAllByRole('combobox');
    fireEvent.change(selects[1]!, { target: { value: 'asc' } });
    expect(updateFilter).toHaveBeenCalledWith('sortOrder', 'asc');
  });

  it('renders the sort icon', () => {
    render(<ContentSortFilter filters={defaultFilters} updateFilter={updateFilter} />);
    expect(screen.getByTestId('arrows-icon')).toBeInTheDocument();
  });

  it('renders the Content Type label', () => {
    render(<ContentSortFilter filters={defaultFilters} updateFilter={updateFilter} />);
    expect(screen.getByText('Content Type')).toBeInTheDocument();
  });
});
