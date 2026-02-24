/** @module achievement-modal tests */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, onClick }: React.PropsWithChildren<{ className?: string; onClick?: () => void }>) => (
      <div className={className} onClick={onClick}>{children}</div>
    ),
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
}));

vi.mock('@heroicons/react/24/solid', () => ({
  TrophyIcon: () => <span data-testid="trophy-icon" />,
}));

vi.mock('@/shared/components/ui', () => ({
  GlassCard: ({ children, className }: React.PropsWithChildren<{ className?: string }>) => (
    <div className={className} data-testid="glass-card">{children}</div>
  ),
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

import { AchievementModal } from '../achievement-modal';

describe('AchievementModal', () => {
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
    isUnlocked: true,
    progress: 100,
    onClose: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders achievement name', () => {
    render(<AchievementModal {...defaultProps} />);
    expect(screen.getByText('First Post')).toBeInTheDocument();
  });

  it('renders achievement description', () => {
    render(<AchievementModal {...defaultProps} />);
    expect(screen.getByText('Create your first post')).toBeInTheDocument();
  });

  it('renders trophy icon', () => {
    render(<AchievementModal {...defaultProps} />);
    expect(screen.getByTestId('trophy-icon')).toBeInTheDocument();
  });

  it('shows rarity label', () => {
    render(<AchievementModal {...defaultProps} />);
    expect(screen.getByText(/rare/i)).toBeInTheDocument();
  });

  it('shows XP reward', () => {
    render(<AchievementModal {...defaultProps} />);
    expect(screen.getByText(/100/)).toBeInTheDocument();
  });

  it('renders nothing when achievement is null', () => {
    const { container } = render(
      <AchievementModal {...defaultProps} achievement={null} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('calls onClose when backdrop is clicked', () => {
    render(<AchievementModal {...defaultProps} />);
    const backdrop = screen.getByText('First Post').closest('.fixed');
    if (backdrop) fireEvent.click(backdrop);
    expect(defaultProps.onClose).toHaveBeenCalled();
  });
});
