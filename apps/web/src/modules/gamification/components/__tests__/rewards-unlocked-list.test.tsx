/**
 * @file Tests for RewardsUnlockedList component
 * @module gamification/components/level-up-modal/rewards-unlocked-list
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className }: Record<string, unknown>) => (
      <div className={className as string}>{children as React.ReactNode}</div>
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock heroicons
vi.mock('@heroicons/react/24/outline', () => ({
  GiftIcon: ({ className }: { className?: string }) => (
    <span data-testid="gift-icon" className={className} />
  ),
}));

vi.mock('@heroicons/react/24/solid', () => ({
  StarIcon: ({ className }: { className?: string }) => (
    <span data-testid="star-icon" className={className} />
  ),
}));

import RewardsUnlockedList from '../level-up-modal/rewards-unlocked-list';

describe('RewardsUnlockedList', () => {
  it('renders nothing when not visible', () => {
    const { container } = render(<RewardsUnlockedList visible={false} />);
    expect(container.innerHTML).toBe('');
  });

  it('renders header when visible', () => {
    render(<RewardsUnlockedList visible />);
    expect(screen.getByText('Rewards Unlocked')).toBeInTheDocument();
  });

  it('renders gift icon in header', () => {
    render(<RewardsUnlockedList visible />);
    expect(screen.getByTestId('gift-icon')).toBeInTheDocument();
  });

  it('renders title section with titles', () => {
    render(<RewardsUnlockedList visible titles={['Champion', 'Legend']} />);
    expect(screen.getByText('New Titles')).toBeInTheDocument();
    expect(screen.getByText(/"Champion"/)).toBeInTheDocument();
    expect(screen.getByText(/"Legend"/)).toBeInTheDocument();
  });

  it('does not render title section when titles empty', () => {
    render(<RewardsUnlockedList visible titles={[]} />);
    expect(screen.queryByText('New Titles')).not.toBeInTheDocument();
  });

  it('renders badge section with badges', () => {
    render(<RewardsUnlockedList visible badges={['🏆', '⭐']} />);
    expect(screen.getByText('New Badges')).toBeInTheDocument();
    expect(screen.getByText('🏆')).toBeInTheDocument();
    expect(screen.getByText('⭐')).toBeInTheDocument();
  });

  it('does not render badge section when badges empty', () => {
    render(<RewardsUnlockedList visible badges={[]} />);
    expect(screen.queryByText('New Badges')).not.toBeInTheDocument();
  });

  it('renders perk section with perks', () => {
    render(<RewardsUnlockedList visible perks={['Custom avatar', 'Extra slots']} />);
    expect(screen.getByText('New Perks')).toBeInTheDocument();
    expect(screen.getByText(/Custom avatar/)).toBeInTheDocument();
    expect(screen.getByText(/Extra slots/)).toBeInTheDocument();
  });

  it('renders lore section with fragment count', () => {
    render(<RewardsUnlockedList visible loreFragments={['fragment1', 'fragment2', 'fragment3']} />);
    expect(screen.getByText('Lore Unlocked')).toBeInTheDocument();
    expect(screen.getByText(/3 new story fragment\(s\) available/)).toBeInTheDocument();
  });

  it('renders star icons next to each title', () => {
    render(<RewardsUnlockedList visible titles={['Hero', 'Sage']} />);
    const stars = screen.getAllByTestId('star-icon');
    expect(stars.length).toBe(2);
  });

  it('renders all sections together', () => {
    render(
      <RewardsUnlockedList
        visible
        titles={['Champion']}
        badges={['🏆']}
        perks={['Bonus XP']}
        loreFragments={['lore1']}
      />
    );
    expect(screen.getByText('New Titles')).toBeInTheDocument();
    expect(screen.getByText('New Badges')).toBeInTheDocument();
    expect(screen.getByText('New Perks')).toBeInTheDocument();
    expect(screen.getByText('Lore Unlocked')).toBeInTheDocument();
  });
});
