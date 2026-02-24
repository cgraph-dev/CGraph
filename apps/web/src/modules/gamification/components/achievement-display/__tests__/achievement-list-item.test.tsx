/** @module achievement-list-item tests */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, onClick }: React.PropsWithChildren<{ className?: string; onClick?: () => void }>) => (
      <div className={className} onClick={onClick}>{children}</div>
    ),
  },
}));

vi.mock('@heroicons/react/24/outline', () => ({
  TrophyIcon: () => <span data-testid="trophy-icon" />,
  LockClosedIcon: () => <span data-testid="lock-icon" />,
  CheckCircleIcon: () => <span data-testid="check-icon" />,
}));

vi.mock('../constants', () => ({
  RARITY_COLORS: {
    common: '#9CA3AF',
    uncommon: '#22C55E',
    rare: '#3B82F6',
    epic: '#A855F7',
    legendary: '#F59E0B',
  },
}));

import { AchievementListItem } from '../achievement-list-item';

describe('AchievementListItem', () => {
  const mockAchievement = {
    id: 'a1',
    name: 'First Post',
    description: 'Create your first post',
    icon: '📝',
    rarity: 'rare' as const,
    category: 'social' as const,
    xpReward: 100,
  };

  const defaultProps = {
    achievement: mockAchievement,
    index: 0,
    unlocked: true,
    progress: 100,
    showProgress: false,
    onClick: vi.fn(),
  };

  it('renders achievement name', () => {
    render(<AchievementListItem {...defaultProps} />);
    expect(screen.getByText('First Post')).toBeInTheDocument();
  });

  it('renders achievement description', () => {
    render(<AchievementListItem {...defaultProps} />);
    expect(screen.getByText('Create your first post')).toBeInTheDocument();
  });

  it('shows check icon when unlocked', () => {
    render(<AchievementListItem {...defaultProps} />);
    expect(screen.getByTestId('check-icon')).toBeInTheDocument();
  });

  it('shows lock icon when not unlocked', () => {
    render(<AchievementListItem {...defaultProps} unlocked={false} />);
    expect(screen.getByTestId('lock-icon')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const onClick = vi.fn();
    render(<AchievementListItem {...defaultProps} onClick={onClick} />);
    fireEvent.click(screen.getByText('First Post'));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('applies opacity when not unlocked', () => {
    const { container } = render(<AchievementListItem {...defaultProps} unlocked={false} />);
    expect(container.firstChild).toHaveClass('opacity-70');
  });
});
