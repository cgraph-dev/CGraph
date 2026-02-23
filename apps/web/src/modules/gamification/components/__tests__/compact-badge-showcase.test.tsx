/**
 * @file Tests for CompactBadgeShowcase component
 * @module gamification/components/badges/compact-badge-showcase
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, style, ...rest }: Record<string, unknown>) => (
      <div className={className as string} style={style as React.CSSProperties}>
        {children as React.ReactNode}
      </div>
    ),
    span: ({ children, className, ...rest }: Record<string, unknown>) => (
      <span className={className as string}>{children as React.ReactNode}</span>
    ),
  },
}));

// Mock gamification store to prevent barrel hang
vi.mock('@/modules/gamification/store', () => ({}));

// Mock AnimatedBadgeWithTooltip
vi.mock('../badges/animated-badge', () => ({
  AnimatedBadgeWithTooltip: ({
    achievement,
    size,
  }: {
    achievement: { id: string; name: string };
    size: string;
  }) => (
    <div data-testid={`badge-${achievement.id}`} data-size={size}>
      {achievement.name}
    </div>
  ),
}));

// Mock cn utility
vi.mock('@/lib/utils', () => ({
  cn: (...args: unknown[]) => args.filter(Boolean).join(' '),
}));

import { CompactBadgeShowcase } from '../badges/compact-badge-showcase';

interface MockAchievement {
  id: string;
  name: string;
  [key: string]: unknown;
}

function makeBadges(count: number): MockAchievement[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `badge-${i + 1}`,
    name: `Badge ${i + 1}`,
  }));
}

describe('CompactBadgeShowcase', () => {
  it('renders nothing when badges array is empty', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { container } = render(<CompactBadgeShowcase badges={[] as any} />);
    expect(container.innerHTML).toBe('');
  });

  it('renders visible badges up to maxVisible', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    render(<CompactBadgeShowcase badges={makeBadges(5) as any} maxVisible={3} />);
    expect(screen.getByTestId('badge-badge-1')).toBeInTheDocument();
    expect(screen.getByTestId('badge-badge-2')).toBeInTheDocument();
    expect(screen.getByTestId('badge-badge-3')).toBeInTheDocument();
    expect(screen.queryByTestId('badge-badge-4')).not.toBeInTheDocument();
  });

  it('shows overflow count when more badges than maxVisible', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    render(<CompactBadgeShowcase badges={makeBadges(5) as any} maxVisible={3} />);
    expect(screen.getByText('+2')).toBeInTheDocument();
  });

  it('does not show overflow when all badges fit', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    render(<CompactBadgeShowcase badges={makeBadges(2) as any} maxVisible={3} />);
    expect(screen.queryByText(/\+\d/)).not.toBeInTheDocument();
  });

  it('uses default maxVisible of 3', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    render(<CompactBadgeShowcase badges={makeBadges(5) as any} />);
    expect(screen.getByText('+2')).toBeInTheDocument();
  });

  it('passes size prop to AnimatedBadgeWithTooltip', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    render(<CompactBadgeShowcase badges={makeBadges(1) as any} size="sm" />);
    expect(screen.getByTestId('badge-badge-1').getAttribute('data-size')).toBe('sm');
  });

  it('uses default xs size', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    render(<CompactBadgeShowcase badges={makeBadges(1) as any} />);
    expect(screen.getByTestId('badge-badge-1').getAttribute('data-size')).toBe('xs');
  });

  it('applies custom className', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { container } = render(
      <CompactBadgeShowcase badges={makeBadges(1) as any} className="custom" />
    );
    expect(container.firstElementChild?.className).toContain('custom');
  });

  it('renders badge names', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    render(<CompactBadgeShowcase badges={makeBadges(2) as any} />);
    expect(screen.getByText('Badge 1')).toBeInTheDocument();
    expect(screen.getByText('Badge 2')).toBeInTheDocument();
  });

  it('renders exactly maxVisible badges with large array', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    render(<CompactBadgeShowcase badges={makeBadges(10) as any} maxVisible={4} />);
    expect(screen.getByText('+6')).toBeInTheDocument();
    expect(screen.getAllByTestId(/^badge-/).length).toBe(4);
  });
});
