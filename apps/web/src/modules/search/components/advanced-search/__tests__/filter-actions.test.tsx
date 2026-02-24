/**
 * @file Tests for FilterActions component (advanced-search)
 * @module search/components/advanced-search/filter-actions
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('@/components', () => ({
  Button: ({
    children,
    onClick,
    disabled,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
  }) => (
    <button data-testid="search-button" onClick={onClick} disabled={disabled}>
      {children}
    </button>
  ),
}));

import { FilterActions } from '../filter-actions';
import type { AdvancedSearchFilters } from '../types';

function makeFilters(overrides: Partial<AdvancedSearchFilters> = {}): AdvancedSearchFilters {
  return {
    keywords: '',
    author: '',
    dateRange: 'any',
    searchIn: 'all',
    forumId: null,
    includeSubforums: true,
    contentType: 'all',
    showClosed: true,
    showSticky: true,
    showNormal: true,
    sortBy: 'relevance',
    sortOrder: 'desc',
    resultsPerPage: 25,
    ...overrides,
  };
}

describe('FilterActions', () => {
  const defaultProps = {
    filters: makeFilters(),
    updateFilter: vi.fn(),
    handleSearch: vi.fn(),
    handleReset: vi.fn(),
    isLoading: false,
  };

  it('renders Reset filters button', () => {
    render(<FilterActions {...defaultProps} />);
    expect(screen.getByText('Reset filters')).toBeInTheDocument();
  });

  it('renders Search button', () => {
    render(<FilterActions {...defaultProps} />);
    expect(screen.getByText('Search')).toBeInTheDocument();
  });

  it('renders Results per page label', () => {
    render(<FilterActions {...defaultProps} />);
    expect(screen.getByText('Results per page:')).toBeInTheDocument();
  });

  it('calls handleReset when Reset filters is clicked', async () => {
    const user = userEvent.setup();
    const handleReset = vi.fn();
    render(<FilterActions {...defaultProps} handleReset={handleReset} />);
    await user.click(screen.getByText('Reset filters'));
    expect(handleReset).toHaveBeenCalledOnce();
  });

  it('calls handleSearch when Search button is clicked', async () => {
    const user = userEvent.setup();
    const handleSearch = vi.fn();
    render(<FilterActions {...defaultProps} handleSearch={handleSearch} />);
    await user.click(screen.getByText('Search'));
    expect(handleSearch).toHaveBeenCalledOnce();
  });

  it('disables Search button when isLoading is true', () => {
    render(<FilterActions {...defaultProps} isLoading={true} />);
    expect(screen.getByTestId('search-button')).toBeDisabled();
  });

  it('renders results per page select with current value', () => {
    render(<FilterActions {...defaultProps} filters={makeFilters({ resultsPerPage: 50 })} />);
    const select = screen.getByRole('combobox');
    expect(select).toHaveValue('50');
  });

  it('renders all results per page options', () => {
    render(<FilterActions {...defaultProps} />);
    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(3);
    expect(options[0]).toHaveValue('10');
    expect(options[1]).toHaveValue('25');
    expect(options[2]).toHaveValue('50');
  });

  it('calls updateFilter when results per page changes', async () => {
    const user = userEvent.setup();
    const updateFilter = vi.fn();
    render(<FilterActions {...defaultProps} updateFilter={updateFilter} />);
    await user.selectOptions(screen.getByRole('combobox'), '50');
    expect(updateFilter).toHaveBeenCalledWith('resultsPerPage', 50);
  });

  it('renders with border-top separator', () => {
    const { container } = render(<FilterActions {...defaultProps} />);
    expect(container.querySelector('.border-t')).toBeInTheDocument();
  });
});
