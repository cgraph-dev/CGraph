/**
 * @file Tests for EmptyState component (badge-collection)
 * @module gamification/components/badges/badge-collection/empty-state
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className }: { children: React.ReactNode; className?: string }) => (
      <div className={className}>{children}</div>
    ),
  },
}));

vi.mock('@heroicons/react/24/outline', () => ({
  QuestionMarkCircleIcon: ({ className }: { className?: string }) => (
    <span data-testid="question-icon" className={className} />
  ),
}));

vi.mock('@/modules/gamification/store', () => ({}));

import { EmptyState } from '../badges/badge-collection/empty-state';

describe('BadgeCollection EmptyState', () => {
  it('renders no achievements message', () => {
    render(<EmptyState onClearFilters={vi.fn()} />);
    expect(screen.getByText('No achievements match your filters')).toBeInTheDocument();
  });

  it('renders clear filters button', () => {
    render(<EmptyState onClearFilters={vi.fn()} />);
    expect(screen.getByText('Clear filters')).toBeInTheDocument();
  });

  it('renders question mark icon', () => {
    render(<EmptyState onClearFilters={vi.fn()} />);
    expect(screen.getByTestId('question-icon')).toBeInTheDocument();
  });

  it('calls onClearFilters when button clicked', async () => {
    const user = userEvent.setup();
    const onClearFilters = vi.fn();
    render(<EmptyState onClearFilters={onClearFilters} />);
    await user.click(screen.getByText('Clear filters'));
    expect(onClearFilters).toHaveBeenCalledOnce();
  });

  it('renders as centered text', () => {
    const { container } = render(<EmptyState onClearFilters={vi.fn()} />);
    expect(container.querySelector('.text-center')).toBeInTheDocument();
  });

  it('renders clear filters as a button element', () => {
    render(<EmptyState onClearFilters={vi.fn()} />);
    const button = screen.getByText('Clear filters');
    expect(button.tagName).toBe('BUTTON');
  });

  it('applies primary color to clear filters button', () => {
    render(<EmptyState onClearFilters={vi.fn()} />);
    const button = screen.getByText('Clear filters');
    expect(button.className).toContain('text-primary-400');
  });

  it('renders with padding', () => {
    const { container } = render(<EmptyState onClearFilters={vi.fn()} />);
    expect(container.querySelector('.py-12')).toBeInTheDocument();
  });
});
