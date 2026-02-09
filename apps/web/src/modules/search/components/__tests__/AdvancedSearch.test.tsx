import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import AdvancedSearch from '../advanced-search/AdvancedSearch';

// ── Mocks ──────────────────────────────────────────────────────────────

vi.mock('@/modules/forums/store', () => ({
  useForumStore: vi.fn(() => ({
    forums: [
      { id: 'f1', name: 'General Discussion' },
      { id: 'f2', name: 'Announcements' },
    ],
  })),
}));

vi.mock('@/lib/utils', () => ({
  cn: (...args: any[]) => args.filter(Boolean).join(' '),
}));

vi.mock('@heroicons/react/24/outline', () => ({
  MagnifyingGlassIcon: (p: any) => <svg data-testid="search-icon" {...p} />,
  FunnelIcon: (p: any) => <svg data-testid="funnel-icon" {...p} />,
  ChevronDownIcon: (p: any) => <svg data-testid="chevron-down" {...p} />,
  ChevronUpIcon: (p: any) => <svg data-testid="chevron-up" {...p} />,
}));

vi.mock('@/components', () => ({
  Button: ({ children, onClick, disabled, ...rest }: any) => (
    <button onClick={onClick} disabled={disabled} {...rest}>
      {children}
    </button>
  ),
}));

vi.mock('../advanced-search/SearchBar', () => ({
  SearchBar: ({
    filters,
    updateFilter,
    handleSearch,
    handleKeyPress,
    isExpanded,
    setIsExpanded,
    isLoading,
  }: any) => (
    <div data-testid="search-bar">
      <input
        data-testid="keyword-input"
        value={filters.keywords}
        onChange={(e: any) => updateFilter('keywords', e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder="Search keywords..."
      />
      <button data-testid="search-btn" onClick={handleSearch} disabled={isLoading}>
        Search
      </button>
      <button data-testid="toggle-filters" onClick={() => setIsExpanded(!isExpanded)}>
        {isExpanded ? 'Hide' : 'Show'} Filters
      </button>
    </div>
  ),
}));

vi.mock('../advanced-search/FilterPanel', () => ({
  FilterPanel: ({ filters, updateFilter, handleSearch, handleReset, isLoading, forums }: any) => (
    <div data-testid="filter-panel">
      <input
        data-testid="author-input"
        value={filters.author}
        onChange={(e: any) => updateFilter('author', e.target.value)}
        placeholder="Author..."
      />
      <select
        data-testid="date-range"
        value={filters.dateRange}
        onChange={(e: any) => updateFilter('dateRange', e.target.value)}
      >
        <option value="any">Any</option>
        <option value="day">Day</option>
        <option value="week">Week</option>
      </select>
      <select
        data-testid="sort-by"
        value={filters.sortBy}
        onChange={(e: any) => updateFilter('sortBy', e.target.value)}
      >
        <option value="relevance">Relevance</option>
        <option value="date">Date</option>
      </select>
      <button data-testid="reset-btn" onClick={handleReset}>
        Reset
      </button>
      <button data-testid="panel-search-btn" onClick={handleSearch}>
        Search
      </button>
      <span data-testid="forum-count">{forums.length} forums</span>
    </div>
  ),
}));

// ── Tests ──────────────────────────────────────────────────────────────

describe('AdvancedSearch', () => {
  let onSearch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    onSearch = vi.fn();
  });

  it('renders search bar', () => {
    render(<AdvancedSearch onSearch={onSearch} />);
    expect(screen.getByTestId('search-bar')).toBeInTheDocument();
  });

  it('filter panel is hidden by default', () => {
    render(<AdvancedSearch onSearch={onSearch} />);
    expect(screen.queryByTestId('filter-panel')).not.toBeInTheDocument();
  });

  it('shows filter panel when defaultExpanded is true', () => {
    render(<AdvancedSearch onSearch={onSearch} defaultExpanded />);
    expect(screen.getByTestId('filter-panel')).toBeInTheDocument();
  });

  it('toggles filter panel visibility', () => {
    render(<AdvancedSearch onSearch={onSearch} />);
    expect(screen.queryByTestId('filter-panel')).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId('toggle-filters'));
    expect(screen.getByTestId('filter-panel')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('toggle-filters'));
    expect(screen.queryByTestId('filter-panel')).not.toBeInTheDocument();
  });

  it('updates keywords on input change', () => {
    render(<AdvancedSearch onSearch={onSearch} />);
    const input = screen.getByTestId('keyword-input');
    fireEvent.change(input, { target: { value: 'hello world' } });
    expect(input).toHaveValue('hello world');
  });

  it('calls onSearch with filters when search clicked', () => {
    render(<AdvancedSearch onSearch={onSearch} />);
    fireEvent.change(screen.getByTestId('keyword-input'), { target: { value: 'test query' } });
    fireEvent.click(screen.getByTestId('search-btn'));
    expect(onSearch).toHaveBeenCalledTimes(1);
    const calledFilters = onSearch.mock.calls[0][0];
    expect(calledFilters.keywords).toBe('test query');
  });

  it('does NOT call onSearch with empty keywords and author', () => {
    render(<AdvancedSearch onSearch={onSearch} />);
    fireEvent.click(screen.getByTestId('search-btn'));
    expect(onSearch).not.toHaveBeenCalled();
  });

  it('calls onSearch on Enter key press', () => {
    render(<AdvancedSearch onSearch={onSearch} />);
    const input = screen.getByTestId('keyword-input');
    fireEvent.change(input, { target: { value: 'enter test' } });
    fireEvent.keyPress(input, { key: 'Enter', charCode: 13 });
    expect(onSearch).toHaveBeenCalledTimes(1);
  });

  it('resets filters via reset button', () => {
    render(<AdvancedSearch onSearch={onSearch} defaultExpanded />);
    // Set values first
    fireEvent.change(screen.getByTestId('keyword-input'), { target: { value: 'search term' } });
    fireEvent.change(screen.getByTestId('author-input'), { target: { value: 'someuser' } });
    // Reset
    fireEvent.click(screen.getByTestId('reset-btn'));
    // After reset, keyword input should be empty
    expect(screen.getByTestId('keyword-input')).toHaveValue('');
  });

  it('passes forums from store to filter panel', () => {
    render(<AdvancedSearch onSearch={onSearch} defaultExpanded />);
    expect(screen.getByTestId('forum-count')).toHaveTextContent('2 forums');
  });

  it('updates date range filter', () => {
    render(<AdvancedSearch onSearch={onSearch} defaultExpanded />);
    fireEvent.change(screen.getByTestId('date-range'), { target: { value: 'week' } });
    expect(screen.getByTestId('date-range')).toHaveValue('week');
  });

  it('updates sort by filter', () => {
    render(<AdvancedSearch onSearch={onSearch} defaultExpanded />);
    fireEvent.change(screen.getByTestId('sort-by'), { target: { value: 'date' } });
    expect(screen.getByTestId('sort-by')).toHaveValue('date');
  });

  it('applies custom className', () => {
    const { container } = render(<AdvancedSearch onSearch={onSearch} className="my-search" />);
    expect(container.firstChild).toHaveClass('my-search');
  });

  it('supports author-only search', () => {
    render(<AdvancedSearch onSearch={onSearch} defaultExpanded />);
    fireEvent.change(screen.getByTestId('author-input'), { target: { value: 'john' } });
    fireEvent.click(screen.getByTestId('panel-search-btn'));
    expect(onSearch).toHaveBeenCalledTimes(1);
    expect(onSearch.mock.calls[0][0].author).toBe('john');
  });
});
