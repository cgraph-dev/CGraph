/** @module AchievementCard tests */

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

vi.mock('../constants', () => ({
  RARITY_COLORS: {
    common: '#9ca3af',
    uncommon: '#22c55e',
    rare: '#3b82f6',
    epic: '#a855f7',
    legendary: '#f59e0b',
  },
  RARITY_GRADIENTS: {
    common: 'from-gray-400 to-gray-600',
    uncommon: 'from-green-400 to-green-600',
    rare: 'from-blue-400 to-blue-600',
    epic: 'from-purple-400 to-purple-600',
    legendary: 'from-yellow-400 to-yellow-600',
  },
}));

import { AchievementCard } from '../achievement-display/achievement-card';

function makeAchievement(overrides: Record<string, unknown> = {}) {
  return {
    id: 'ach-1',
    name: 'First Message',
    description: 'Send your first message in chat',
    iconUrl: '',
    category: 'messaging' as const,
    xpReward: 100,
    coinReward: 50,
    rarity: 'common' as const,
    requirements: [],
    currentProgress: 0,
    targetProgress: 1,
    ...overrides,
  };
}

describe('AchievementCard', () => {
  let onClick: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onClick = vi.fn();
  });

  it('renders achievement name', () => {
    render(
      <AchievementCard
        achievement={makeAchievement()}
        index={0}
        unlocked={true}
        progress={100}
        showProgress={false}
        onClick={onClick}
      />
    );
    expect(screen.getByText('First Message')).toBeInTheDocument();
  });

  it('renders achievement description', () => {
    render(
      <AchievementCard
        achievement={makeAchievement()}
        index={0}
        unlocked={true}
        progress={100}
        showProgress={false}
        onClick={onClick}
      />
    );
    expect(screen.getByText('Send your first message in chat')).toBeInTheDocument();
  });

  it('renders rarity badge', () => {
    render(
      <AchievementCard
        achievement={makeAchievement({ rarity: 'epic' })}
        index={0}
        unlocked={true}
        progress={100}
        showProgress={false}
        onClick={onClick}
      />
    );
    expect(screen.getByText('epic')).toBeInTheDocument();
  });

  it('calls onClick when card is clicked', () => {
    render(
      <AchievementCard
        achievement={makeAchievement()}
        index={0}
        unlocked={true}
        progress={100}
        showProgress={false}
        onClick={onClick}
      />
    );
    fireEvent.click(screen.getByText('First Message'));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('shows lock icon when not unlocked', () => {
    render(
      <AchievementCard
        achievement={makeAchievement()}
        index={0}
        unlocked={false}
        progress={0}
        showProgress={false}
        onClick={onClick}
      />
    );
    expect(screen.getByTestId('icon-LockClosedIcon')).toBeInTheDocument();
  });

  it('does not show lock icon when unlocked', () => {
    render(
      <AchievementCard
        achievement={makeAchievement()}
        index={0}
        unlocked={true}
        progress={100}
        showProgress={false}
        onClick={onClick}
      />
    );
    expect(screen.queryByTestId('icon-LockClosedIcon')).not.toBeInTheDocument();
  });

  it('shows trophy icon when no icon URL', () => {
    render(
      <AchievementCard
        achievement={makeAchievement({ iconUrl: '' })}
        index={0}
        unlocked={true}
        progress={100}
        showProgress={false}
        onClick={onClick}
      />
    );
    expect(screen.getByTestId('icon-TrophyIcon')).toBeInTheDocument();
  });

  it('shows custom icon when iconUrl is provided', () => {
    render(
      <AchievementCard
        achievement={makeAchievement({ iconUrl: 'https://example.com/icon.png' })}
        index={0}
        unlocked={true}
        progress={100}
        showProgress={false}
        onClick={onClick}
      />
    );
    const img = screen.getByAltText('First Message');
    expect(img).toHaveAttribute('src', 'https://example.com/icon.png');
  });

  it('shows progress bar when showProgress is true and not unlocked', () => {
    render(
      <AchievementCard
        achievement={makeAchievement({ targetProgress: 10, currentProgress: 5 })}
        index={0}
        unlocked={false}
        progress={50}
        showProgress={true}
        onClick={onClick}
      />
    );
    expect(screen.getByText('5/10')).toBeInTheDocument();
    expect(screen.getByText('Progress')).toBeInTheDocument();
  });

  it('renders GlassCard with neon variant when unlocked', () => {
    render(
      <AchievementCard
        achievement={makeAchievement()}
        index={0}
        unlocked={true}
        progress={100}
        showProgress={false}
        onClick={onClick}
      />
    );
    expect(screen.getByTestId('glass-card')).toHaveAttribute('data-variant', 'neon');
  });
});
