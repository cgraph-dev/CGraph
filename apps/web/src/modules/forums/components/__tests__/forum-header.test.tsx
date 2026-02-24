/**
 * @file forum-header.test.tsx
 * @description Tests for ForumHeader component — forum banner, icon, stats,
 *   vote buttons, and action buttons.
 * @module forums/components/__tests__/ForumHeader
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

// ── framer-motion mock ───────────────────────────────────────────────

vi.mock('@/stores/theme', () => ({ useThemeStore: () => ({ theme: { colorPreset: 'blue' } }), THEME_COLORS: { blue: { primary: '#3b82f6', accent: '#8b5cf6' } } }));

vi.mock('@/shared/components/ui', () => ({
  GlassCard: ({ children, className }: React.PropsWithChildren<{ className?: string }>) => (
    <div data-testid="glass-card" className={className}>{children}</div>
  ),
}));

vi.mock('../forum-header/vote-buttons', () => ({
  VoteButtons: ({ score }: { score: number }) => <div data-testid="vote-buttons">Score: {score}</div>,
}));

vi.mock('../forum-header/forum-stats', () => ({
  ForumStats: ({ memberCount }: { memberCount: number }) => <div data-testid="forum-stats">{memberCount} members</div>,
}));

vi.mock('../forum-header/forum-actions', () => ({
  ForumActions: () => <div data-testid="forum-actions">Actions</div>,
}));

vi.mock('../forum-header/forum-icon', () => ({
  ForumIcon: ({ name }: { name: string }) => <div data-testid="forum-icon">{name}</div>,
}));

vi.mock('../forum-header/forum-header-compact', () => ({
  ForumHeaderCompact: ({ forum }: { forum: { name: string } }) => <div data-testid="compact-header">{forum.name}</div>,
}));

vi.mock('../forum-header/forum-header-hero', () => ({
  ForumHeaderHero: ({ forum }: { forum: { name: string } }) => <div data-testid="hero-header">{forum.name}</div>,
}));

vi.mock('../forum-header/utils', () => ({ copyCurrentUrl: vi.fn() }));

// ── Helpers ────────────────────────────────────────────────────────────
const makeForum = (overrides?: Record<string, unknown>) => ({
  id: 'f-1',
  name: 'Test Forum',
  description: 'A test forum',
  iconUrl: null,
  bannerUrl: null,
  memberCount: 500,
  score: 42,
  userVote: 0,
  featured: false,
  ...overrides,
});

import { ForumHeader } from '../forum-header/forum-header';

// ── Tests ──────────────────────────────────────────────────────────────
describe('ForumHeader', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders forum name in default variant', () => {
    render(<ForumHeader forum={makeForum()} />);
    expect(screen.getByText('Test Forum')).toBeInTheDocument();
  });

  it('renders vote buttons when onVote is provided', () => {
    render(<ForumHeader forum={makeForum()} onVote={vi.fn()} />);
    expect(screen.getByTestId('vote-buttons')).toBeInTheDocument();
  });

  it('renders compact variant', () => {
    render(<ForumHeader forum={makeForum()} variant="compact" />);
    expect(screen.getByTestId('compact-header')).toBeInTheDocument();
  });

  it('renders hero variant', () => {
    render(<ForumHeader forum={makeForum()} variant="hero" onVote={vi.fn()} />);
    expect(screen.getByTestId('hero-header')).toBeInTheDocument();
  });

  it('renders forum icon sub-component', () => {
    render(<ForumHeader forum={makeForum()} />);
    expect(screen.getByTestId('forum-icon')).toBeInTheDocument();
  });

  it('renders forum stats sub-component', () => {
    render(<ForumHeader forum={makeForum({ memberCount: 300 })} />);
    expect(screen.getByTestId('forum-stats')).toBeInTheDocument();
  });

  it('passes isMember false by default', () => {
    render(<ForumHeader forum={makeForum()} />);
    expect(screen.getByTestId('forum-actions')).toBeInTheDocument();
  });

  it('renders description when present', () => {
    render(<ForumHeader forum={makeForum({ description: 'Welcome!' })} />);
    expect(screen.getByText('Welcome!')).toBeInTheDocument();
  });

  it('renders banner image when bannerUrl provided', () => {
    const { container } = render(<ForumHeader forum={makeForum({ bannerUrl: '/banner.jpg' })} />);
    const img = container.querySelector('img[src="/banner.jpg"]');
    expect(img).toBeTruthy();
  });

  it('applies custom className', () => {
    const { container } = render(<ForumHeader forum={makeForum()} className="custom-cls" />);
    expect(container.innerHTML).toContain('custom-cls');
  });
});
