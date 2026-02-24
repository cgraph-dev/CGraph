/** @module stats-header tests */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('@heroicons/react/24/solid', () => ({
  StarIcon: ({ style }: { style?: Record<string, string> }) => (
    <span data-testid="star-icon" style={style} />
  ),
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

import { StatsHeader } from '../stats-header';

describe('StatsHeader', () => {
  const mockStats = {
    total: 50,
    unlocked: 25,
    byRarity: {
      common: { total: 20, unlocked: 15 },
      uncommon: { total: 15, unlocked: 7 },
      rare: { total: 8, unlocked: 2 },
      epic: { total: 5, unlocked: 1 },
      legendary: { total: 2, unlocked: 0 },
    },
  };

  it('renders Achievements heading', () => {
    render(<StatsHeader stats={mockStats} />);
    expect(screen.getByText('Achievements')).toBeInTheDocument();
  });

  it('shows unlocked count', () => {
    render(<StatsHeader stats={mockStats} />);
    expect(screen.getByText(/25 of 50 unlocked/)).toBeInTheDocument();
  });

  it('renders star icons for each rarity', () => {
    render(<StatsHeader stats={mockStats} />);
    const stars = screen.getAllByTestId('star-icon');
    expect(stars).toHaveLength(5);
  });

  it('shows rarity breakdown counts', () => {
    render(<StatsHeader stats={mockStats} />);
    expect(screen.getByText('15/20')).toBeInTheDocument(); // common
    expect(screen.getByText('7/15')).toBeInTheDocument();  // uncommon
    expect(screen.getByText('2/8')).toBeInTheDocument();   // rare
    expect(screen.getByText('1/5')).toBeInTheDocument();   // epic
    expect(screen.getByText('0/2')).toBeInTheDocument();   // legendary
  });
});
