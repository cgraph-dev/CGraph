/** @module filter-bar tests */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className }: React.PropsWithChildren<{ className?: string }>) => (
      <div className={className}>{children}</div>
    ),
    button: ({
      children,
      className,
      onClick,
    }: React.PropsWithChildren<{ className?: string; onClick?: () => void }>) => (
      <button className={className} onClick={onClick}>{children}</button>
    ),
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
}));

vi.mock('@heroicons/react/24/outline', () => ({
  FunnelIcon: () => <span data-testid="funnel-icon" />,
  MagnifyingGlassIcon: () => <span data-testid="search-icon" />,
  ChevronDownIcon: () => <span data-testid="chevron-icon" />,
}));

vi.mock('../constants', () => ({
  CATEGORY_ICONS: {},
  CATEGORIES: ['social', 'combat', 'exploration'],
}));

import { FilterBar } from '../filter-bar';

describe('FilterBar', () => {
  const defaultProps = {
    searchQuery: '',
    selectedCategory: 'all' as const,
    sortBy: 'rarity' as const,
    showFilters: false,
    primaryColor: '#6366f1',
    onSearchChange: vi.fn(),
    onCategoryChange: vi.fn(),
    onSortChange: vi.fn(),
    onToggleFilters: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders search input', () => {
    render(<FilterBar {...defaultProps} />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('renders search icon', () => {
    render(<FilterBar {...defaultProps} />);
    expect(screen.getByTestId('search-icon')).toBeInTheDocument();
  });

  it('shows current search query in input', () => {
    render(<FilterBar {...defaultProps} searchQuery="warrior" />);
    expect(screen.getByDisplayValue('warrior')).toBeInTheDocument();
  });

  it('calls onSearchChange when typing', () => {
    render(<FilterBar {...defaultProps} />);
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'test' } });
    expect(defaultProps.onSearchChange).toHaveBeenCalledWith('test');
  });

  it('renders funnel icon for filter toggle', () => {
    render(<FilterBar {...defaultProps} />);
    expect(screen.getByTestId('funnel-icon')).toBeInTheDocument();
  });

  it('calls onToggleFilters when funnel button clicked', () => {
    render(<FilterBar {...defaultProps} />);
    const funnelBtn = screen.getByTestId('funnel-icon').closest('button');
    if (funnelBtn) fireEvent.click(funnelBtn);
    expect(defaultProps.onToggleFilters).toHaveBeenCalledOnce();
  });
});
