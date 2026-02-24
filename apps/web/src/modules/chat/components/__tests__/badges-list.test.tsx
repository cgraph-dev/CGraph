/**
 * @file Tests for BadgesList component (chat-info-panel)
 * @module chat/components/chat-info-panel/badges-list
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className }: { children: React.ReactNode; className?: string }) => (
      <div className={className}>{children}</div>
    ),
  },
}));

vi.mock('@heroicons/react/24/outline', () => ({
  SparklesIcon: ({ className }: { className?: string }) => (
    <span data-testid="sparkles-icon" className={className} />
  ),
}));

vi.mock('@/shared/components/ui', () => ({
  GlassCard: ({
    children,
    className,
    variant,
    glow,
  }: {
    children: React.ReactNode;
    className?: string;
    variant?: string;
    glow?: boolean;
  }) => (
    <div data-testid="glass-card" className={className} data-variant={variant} data-glow={glow}>
      {children}
    </div>
  ),
}));

vi.mock('@/lib/animations/transitions', () => ({
  springs: { bouncy: { type: 'spring', stiffness: 300, damping: 20 } },
}));

import { BadgesList } from '../chat-info-panel/badges-list';

function makeBadges(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: `badge-${i}`,
    name: `Badge ${i}`,
    emoji: ['🏆', '⭐', '🎯', '🔥', '💎'][i % 5]!,
    rarity: ['common', 'rare', 'epic'][i % 3]!,
  }));
}

describe('BadgesList', () => {
  it('renders nothing when badges array is empty', () => {
    const { container } = render(<BadgesList badges={[]} />);
    expect(container.innerHTML).toBe('');
  });

  it('renders "Top Badges" heading', () => {
    render(<BadgesList badges={makeBadges(2)} />);
    expect(screen.getByText('Top Badges')).toBeInTheDocument();
  });

  it('renders sparkles icon', () => {
    render(<BadgesList badges={makeBadges(1)} />);
    expect(screen.getByTestId('sparkles-icon')).toBeInTheDocument();
  });

  it('renders badge emojis', () => {
    render(<BadgesList badges={makeBadges(2)} />);
    expect(screen.getByText('🏆')).toBeInTheDocument();
    expect(screen.getByText('⭐')).toBeInTheDocument();
  });

  it('renders badge names', () => {
    render(<BadgesList badges={makeBadges(2)} />);
    expect(screen.getByText('Badge 0')).toBeInTheDocument();
    expect(screen.getByText('Badge 1')).toBeInTheDocument();
  });

  it('displays maximum 3 badges', () => {
    render(<BadgesList badges={makeBadges(5)} />);
    expect(screen.getByText('Badge 0')).toBeInTheDocument();
    expect(screen.getByText('Badge 1')).toBeInTheDocument();
    expect(screen.getByText('Badge 2')).toBeInTheDocument();
    expect(screen.queryByText('Badge 3')).not.toBeInTheDocument();
  });

  it('renders GlassCard for each badge', () => {
    render(<BadgesList badges={makeBadges(2)} />);
    const cards = screen.getAllByTestId('glass-card');
    expect(cards).toHaveLength(2);
  });

  it('uses neon variant for GlassCards', () => {
    render(<BadgesList badges={makeBadges(1)} />);
    expect(screen.getByTestId('glass-card')).toHaveAttribute('data-variant', 'neon');
  });

  it('renders single badge correctly', () => {
    render(<BadgesList badges={makeBadges(1)} />);
    expect(screen.getByText('Badge 0')).toBeInTheDocument();
    expect(screen.getByText('🏆')).toBeInTheDocument();
  });

  it('renders exactly 3 badges from a list of 3', () => {
    render(<BadgesList badges={makeBadges(3)} />);
    const cards = screen.getAllByTestId('glass-card');
    expect(cards).toHaveLength(3);
  });
});
