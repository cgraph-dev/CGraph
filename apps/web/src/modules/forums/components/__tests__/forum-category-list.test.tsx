/** @module ForumCategoryList tests */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('@/lib/animation-presets', () => ({
  tweens: { standard: {}, fast: {} },
  springs: { snappy: {}, bouncy: {} },
  loop: () => ({}),
  staggerConfigs: { standard: { staggerChildren: 0.05 }, fast: {} },
}));

vi.mock('react-router-dom', () => ({
  Link: ({
    children,
    to,
    className,
  }: {
    children: React.ReactNode;
    to: string;
    className?: string;
  }) => (
    <a href={to} className={className}>
      {children}
    </a>
  ),
}));

vi.mock('@heroicons/react/24/outline', () => ({
  FolderIcon: ({ className }: { className?: string }) => (
    <span data-testid="folder-icon" className={className} />
  ),
  DocumentTextIcon: ({ className }: { className?: string }) => (
    <span data-testid="doc-icon" className={className} />
  ),
  ChevronRightIcon: ({ className }: { className?: string }) => (
    <span data-testid="chevron-icon" className={className} />
  ),
  ChevronDownIcon: ({ className }: { className?: string }) => (
    <span data-testid="chevron-down-icon" className={className} />
  ),
  PlusIcon: ({ className }: { className?: string }) => (
    <span data-testid="plus-icon" className={className} />
  ),
  Cog6ToothIcon: ({ className }: { className?: string }) => (
    <span data-testid="cog-icon" className={className} />
  ),
  EyeIcon: ({ className }: { className?: string }) => (
    <span data-testid="eye-icon" className={className} />
  ),
}));

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

vi.mock('@/modules/forums/components/forum-category-list/index', () => ({
  useForumCategoryList: (categories: { id: string }[], _forums: unknown[]) => ({
    expandedCategories: new Set(categories.map((c) => c.id)),
    forumsByCategory: {},
    toggleCategory: vi.fn(),
  }),
  ForumRow: () => <div data-testid="forum-row" />,
  ForumCategoryCard: () => <div data-testid="forum-category-card" />,
  ForumCategoryEmptyState: () => <div data-testid="empty-state">No categories yet</div>,
}));

import { ForumCategoryList } from '../forum-category-list';

function makeCategory(overrides: Record<string, unknown> = {}) {
  return {
    id: 'cat-1',
    name: 'General Discussion',
    slug: 'general',
    description: 'Talk about anything',
    color: '#10B981',
    order: 1,
    postCount: 42,
    ...overrides,
  };
}

describe('ForumCategoryList', () => {
  let onCategoryClick: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onCategoryClick = vi.fn();
  });

  it('renders category names', () => {
    const categories = [makeCategory()];
    render(<ForumCategoryList categories={categories} onCategoryClick={onCategoryClick} />);
    expect(screen.getByText('General Discussion')).toBeInTheDocument();
  });

  it('renders category description', () => {
    const categories = [makeCategory()];
    render(<ForumCategoryList categories={categories} />);
    expect(screen.getByText('Talk about anything')).toBeInTheDocument();
  });

  it('renders post count', () => {
    const categories = [makeCategory({ postCount: 1234 })];
    render(<ForumCategoryList categories={categories} />);
    expect(screen.getByText('1,234')).toBeInTheDocument();
  });

  it('renders multiple categories', () => {
    const categories = [
      makeCategory({ id: 'cat-1', name: 'General' }),
      makeCategory({ id: 'cat-2', name: 'Tech Talk' }),
    ];
    render(<ForumCategoryList categories={categories} />);
    expect(screen.getByText('General')).toBeInTheDocument();
    expect(screen.getByText('Tech Talk')).toBeInTheDocument();
  });

  it('renders folder icons for categories', () => {
    const categories = [makeCategory()];
    render(<ForumCategoryList categories={categories} />);
    expect(screen.getByTestId('folder-icon')).toBeInTheDocument();
  });

  it('renders chevron icons for expand/collapse', () => {
    const categories = [makeCategory()];
    render(<ForumCategoryList categories={categories} />);
    expect(screen.getByTestId('chevron-icon')).toBeInTheDocument();
  });

  it('does not show admin controls when canManage is false', () => {
    const categories = [makeCategory()];
    render(<ForumCategoryList categories={categories} canManage={false} />);
    expect(screen.queryByTestId('cog-icon')).not.toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <ForumCategoryList categories={[makeCategory()]} className="custom-class" />
    );
    expect(container.innerHTML).toContain('custom-class');
  });
});
