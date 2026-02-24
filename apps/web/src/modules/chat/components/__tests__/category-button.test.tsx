/**
 * @file Tests for CategoryButton component (gif-picker)
 * @module chat/components/gif-picker/category-button
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('framer-motion', () => ({
  motion: {
    button: ({
      children,
      className,
      onClick,
    }: {
      children: React.ReactNode;
      className?: string;
      onClick?: () => void;
    }) => (
      <button className={className} onClick={onClick}>
        {children}
      </button>
    ),
  },
}));

vi.mock('@/lib/utils', () => ({
  cn: (...args: unknown[]) => args.filter(Boolean).join(' '),
}));

import { CategoryButton } from '../gif-picker/category-button';
import type { CategoryButtonProps } from '../gif-picker/types';

function makeProps(overrides: Partial<CategoryButtonProps> = {}): CategoryButtonProps {
  return {
    category: {
      id: 'trending',
      name: 'Trending',
      icon: <span data-testid="category-icon">🔥</span>,
      searchTerm: 'trending',
    },
    isActive: false,
    onClick: vi.fn(),
    ...overrides,
  };
}

describe('CategoryButton', () => {
  it('renders category name', () => {
    render(<CategoryButton {...makeProps()} />);
    expect(screen.getByText('Trending')).toBeInTheDocument();
  });

  it('renders category icon', () => {
    render(<CategoryButton {...makeProps()} />);
    expect(screen.getByTestId('category-icon')).toBeInTheDocument();
  });

  it('calls onClick when clicked', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<CategoryButton {...makeProps({ onClick })} />);
    await user.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('applies active styles when isActive is true', () => {
    render(<CategoryButton {...makeProps({ isActive: true })} />);
    const button = screen.getByRole('button');
    expect(button.className).toContain('bg-primary-600');
  });

  it('applies inactive styles when isActive is false', () => {
    render(<CategoryButton {...makeProps({ isActive: false })} />);
    const button = screen.getByRole('button');
    expect(button.className).toContain('bg-dark-700');
  });

  it('renders different category names', () => {
    const category = {
      id: 'reactions',
      name: 'Reactions',
      icon: <span>😂</span>,
      searchTerm: 'reactions',
    };
    render(<CategoryButton {...makeProps({ category })} />);
    expect(screen.getByText('Reactions')).toBeInTheDocument();
  });

  it('renders as a button element', () => {
    render(<CategoryButton {...makeProps()} />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('renders icon and name together', () => {
    render(<CategoryButton {...makeProps()} />);
    const button = screen.getByRole('button');
    expect(button.textContent).toContain('Trending');
  });
});
