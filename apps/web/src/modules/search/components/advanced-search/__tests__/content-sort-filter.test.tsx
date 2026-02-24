/** @module ContentSortFilter tests */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('@/stores/theme', () => ({
  useThemeStore: () => ({ theme: { colorPreset: 'blue' } }),
  THEME_COLORS: { blue: { primary: '#3b82f6' } },
}));

vi.mock('@/lib/logger', () => ({
  createLogger: () => ({ debug: vi.fn(), error: vi.fn(), warn: vi.fn() }),
  chatLogger: { debug: vi.fn() },
}));

vi.mock('@heroicons/react/24/outline', () => ({
  ArrowsUpDownIcon: () => <svg data-testid="arrows-icon" />,
}));

vi.mock('@/modules/search/components/advanced-search/constants', () => ({
  SELECT_CLS: 'mock-select-cls',
  LABEL_CLS: 'mock-label-cls',
  CONTENT_TYPES: ['all', 'threads', 'posts'] as const,
  SORT_BY_OPTIONS: [
    { value: 'relevance', label: 'Relevance' },
    { value: 'date', label: 'Date' },
    { value: 'author', label: 'Author' },
    { value: 'replies', label: 'Replies' },
    { value: 'views', label: 'Views' },
  ],
}));

import { ContentSortFilter } from '../content-sort-filter';

const defaultFilters = {
  keywords: '',
  author: '',
  dateRange: 'any' as const,
  searchIn: 'all' as const,
  forumId: null,
  includeSubforums: true,
  contentType: 'all' as const,
  showClosed: true,
  showSticky: true,
  showNormal: true,
  sortBy: 'relevance' as const,
  sortOrder: 'desc' as const,
  resultsPerPage: 25,
};

describe('ContentSortFilter', () => {
  const updateFilter = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders content type radio buttons', () => {
    render(<ContentSortFilter filters={defaultFilters} updateFilter={updateFilter} />);
    expect(screen.getByLabelText('All')).toBeInTheDocument();
    expect(screen.getByLabelText('Threads')).toBeInTheDocument();
    expect(screen.getByLabelText('Posts')).toBeInTheDocument();
  });

  it('checks the matching content type radio', () => {
    render(<ContentSortFilter filters={defaultFilters} updateFilter={updateFilter} />);
    expect(screen.getByLabelText('All')).toBeChecked();
  });

  it('calls updateFilter when content type is changed', () => {
    render(<ContentSortFilter filters={defaultFilters} updateFilter={updateFilter} />);
    fireEvent.click(screen.getByLabelText('Threads'));
    expect(updateFilter).toHaveBeenCalledWith('contentType', 'threads');
  });

  it('renders sort by select with options', () => {
    render(<ContentSortFilter filters={defaultFilters} updateFilter={updateFilter} />);
    expect(screen.getByText('Relevance')).toBeInTheDocument();
    expect(screen.getByText('Date')).toBeInTheDocument();
    expect(screen.getByText('Author')).toBeInTheDocument();
  });

  it('calls updateFilter when sort by is changed', () => {
    render(<ContentSortFilter filters={defaultFilters} updateFilter={updateFilter} />);
    const selects = screen.getAllByRole('combobox');
    fireEvent.change(selects[0], { target: { value: 'date' } });
    expect(updateFilter).toHaveBeenCalledWith('sortBy', 'date');
  });

  it('renders sort order select with Ascending and Descending', () => {
    render(<ContentSortFilter filters={defaultFilters} updateFilter={updateFilter} />);
    expect(screen.getByText('Descending')).toBeInTheDocument();
    expect(screen.getByText('Ascending')).toBeInTheDocument();
  });

  it('calls updateFilter when sort order is changed', () => {
    render(<ContentSortFilter filters={defaultFilters} updateFilter={updateFilter} />);
    const selects = screen.getAllByRole('combobox');
    fireEvent.change(selects[1], { target: { value: 'asc' } });
    expect(updateFilter).toHaveBeenCalledWith('sortOrder', 'asc');
  });

  it('renders the sort icon', () => {
    render(<ContentSortFilter filters={defaultFilters} updateFilter={updateFilter} />);
    expect(screen.getByTestId('arrows-icon')).toBeInTheDocument();
  });

  it('renders the Content Type label', () => {
    render(<ContentSortFilter filters={defaultFilters} updateFilter={updateFilter} />);
    expect(screen.getByText('Content Type')).toBeInTheDocument();
  });
});
