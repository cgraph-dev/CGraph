/**
 * @file group-list.test.tsx
 * @description Tests for GroupList component — group listing with search,
 *   grid/list view toggle, and create group modal.
 * @module groups/components/__tests__/GroupList
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
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

const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({ useNavigate: () => mockNavigate }));

vi.mock('lucide-react', () => ({
  Plus: (p: React.SVGProps<SVGSVGElement>) => <svg data-testid="plus-icon" {...p} />,
  Search: (p: React.SVGProps<SVGSVGElement>) => <svg data-testid="search-icon" {...p} />,
  LayoutGrid: (p: React.SVGProps<SVGSVGElement>) => <svg data-testid="grid-icon" {...p} />,
  List: (p: React.SVGProps<SVGSVGElement>) => <svg data-testid="list-icon" {...p} />,
  Users: (p: React.SVGProps<SVGSVGElement>) => <svg data-testid="users-icon" {...p} />,
}));

const mockGroups = [
  {
    id: 'g-1',
    name: 'Alpha Group',
    description: 'First group',
    isPublic: true,
    memberCount: 10,
    onlineMemberCount: 3,
    iconUrl: null,
  },
  {
    id: 'g-2',
    name: 'Beta Group',
    description: 'Second group',
    isPublic: false,
    memberCount: 20,
    onlineMemberCount: 0,
    iconUrl: null,
  },
];

vi.mock('../../hooks/useGroups', () => ({
  useGroups: () => ({ groups: mockGroups, isLoading: false, create: vi.fn() }),
}));

vi.mock('../group-list/group-icon', () => ({ GroupIcon: () => <div data-testid="group-icon" /> }));
vi.mock('../group-list/group-card', () => ({
  GroupCard: ({ group, onClick }: { group: { name: string }; onClick: () => void }) => (
    <div data-testid="group-card" onClick={onClick}>
      {group.name}
    </div>
  ),
}));
vi.mock('../group-list/group-list-item', () => ({
  GroupListItem: ({ group, onClick }: { group: { name: string }; onClick: () => void }) => (
    <div data-testid="group-list-item" onClick={onClick}>
      {group.name}
    </div>
  ),
}));
vi.mock('../group-list/create-group-modal', () => ({
  CreateGroupModal: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div data-testid="create-modal">Create Modal</div> : null,
}));

import { GroupList } from '../group-list/group-list';

// ── Tests ──────────────────────────────────────────────────────────────
describe('GroupList', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders group cards in grid view by default', () => {
    render(<GroupList />);
    const cards = screen.getAllByTestId('group-card');
    expect(cards).toHaveLength(2);
  });

  it('renders search input when showSearch is true', () => {
    render(<GroupList showSearch />);
    expect(screen.getByPlaceholderText('Search groups...')).toBeInTheDocument();
  });

  it('hides search input when showSearch is false', () => {
    render(<GroupList showSearch={false} showCreateButton={false} />);
    expect(screen.queryByPlaceholderText('Search groups...')).not.toBeInTheDocument();
  });

  it('filters groups by search query', () => {
    render(<GroupList />);
    const input = screen.getByPlaceholderText('Search groups...');
    fireEvent.change(input, { target: { value: 'Alpha' } });
    expect(screen.getByText('Alpha Group')).toBeInTheDocument();
    expect(screen.queryByText('Beta Group')).not.toBeInTheDocument();
  });

  it('renders create group button when showCreateButton is true', () => {
    render(<GroupList />);
    expect(screen.getByText('Create Group')).toBeInTheDocument();
  });

  it('navigates to group on card click', () => {
    render(<GroupList />);
    fireEvent.click(screen.getByText('Alpha Group'));
    expect(mockNavigate).toHaveBeenCalledWith('/groups/g-1');
  });

  it('renders grid/list toggle buttons', () => {
    render(<GroupList />);
    expect(screen.getByTitle('Grid view')).toBeInTheDocument();
    expect(screen.getByTitle('List view')).toBeInTheDocument();
  });

  it('renders empty state when no groups match search', () => {
    render(<GroupList />);
    const input = screen.getByPlaceholderText('Search groups...');
    fireEvent.change(input, { target: { value: 'zzzzz' } });
    expect(screen.getByText('No groups found')).toBeInTheDocument();
  });
});
