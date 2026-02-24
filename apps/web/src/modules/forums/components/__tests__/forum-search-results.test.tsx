/** @module SearchResults tests */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('framer-motion', () => {
  const cache = new Map<string | symbol, (p: React.PropsWithChildren<Record<string, unknown>>) => React.ReactElement>();
  return {
    motion: new Proxy({} as Record<string, (p: React.PropsWithChildren<Record<string, unknown>>) => React.ReactElement>, {
      get: (_target, prop) => {
        if (!cache.has(prop)) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const Tag = (typeof prop === 'string' ? prop : 'div') as any;
          cache.set(prop, function MotionMock({ children, className, onClick }) {
            return <Tag className={className as string} onClick={onClick as React.MouseEventHandler}>{children}</Tag>;
          });
        }
        return cache.get(prop);
      },
    }),
    AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
  };
});

vi.mock('@/lib/animation-presets', () => ({
  tweens: { standard: {}, slow: {} },
  springs: { snappy: {}, bouncy: {} },
  loop: () => ({}),
  staggerConfigs: { fast: { staggerChildren: 0.03 } },
}));

vi.mock('@heroicons/react/24/outline', () => ({
  MagnifyingGlassIcon: ({ className }: { className?: string }) => (
    <span data-testid="search-icon" className={className} />
  ),
  ClockIcon: ({ className }: { className?: string }) => (
    <span data-testid="clock-icon" className={className} />
  ),
}));

vi.mock('@/shared/components/ui', () => ({
  GlassCard: ({
    children,
    className,
    variant,
  }: {
    children: React.ReactNode;
    className?: string;
    variant?: string;
  }) => (
    <div data-testid="glass-card" className={className} data-variant={variant}>
      {children}
    </div>
  ),
}));

vi.mock('../forum-search/search-result-item', () => ({
  SearchResultItem: ({
    result,
    onClick,
  }: {
    result: { title: string };
    onClick: () => void;
  }) => (
    <div data-testid="search-result-item" onClick={onClick}>
      {result.title}
    </div>
  ),
}));

import { SearchResults } from '../forum-search/search-results';

function makeResult(id: string, title: string) {
  return {
    id,
    type: 'post' as const,
    title,
    snippet: `snippet for ${title}`,
    author: { username: 'testuser', avatarUrl: null },
    createdAt: '2025-01-01T00:00:00Z',
  };
}

describe('SearchResults', () => {
  let onResultClick: ReturnType<typeof vi.fn>;
  let onSuggestionClick: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onResultClick = vi.fn();
    onSuggestionClick = vi.fn();
  });

  const defaultProps = {
    isOpen: true,
    isLoading: false,
    query: 'test query',
    results: [] as ReturnType<typeof makeResult>[],
    suggestions: [] as string[],
    selectedIndex: -1,
    primaryColor: '#3b82f6',
    onResultClick: vi.fn(),
    onSuggestionClick: vi.fn(),
  };

  it('renders loading state with spinner', () => {
    render(
      <SearchResults
        {...defaultProps}
        isLoading={true}
        query="test"
        onResultClick={onResultClick}
        onSuggestionClick={onSuggestionClick}
      />
    );
    expect(screen.getByText('Searching...')).toBeInTheDocument();
  });

  it('renders search results', () => {
    const results = [makeResult('1', 'First Result'), makeResult('2', 'Second Result')];
    render(
      <SearchResults
        {...defaultProps}
        results={results}
        onResultClick={onResultClick}
        onSuggestionClick={onSuggestionClick}
      />
    );
    expect(screen.getByText('First Result')).toBeInTheDocument();
    expect(screen.getByText('Second Result')).toBeInTheDocument();
  });

  it('renders no results state when query has results but none found', () => {
    render(
      <SearchResults
        {...defaultProps}
        query="xyznotfound"
        results={[]}
        onResultClick={onResultClick}
        onSuggestionClick={onSuggestionClick}
      />
    );
    expect(screen.getByText(/No results found for/)).toBeInTheDocument();
    expect(screen.getByText(/xyznotfound/)).toBeInTheDocument();
  });

  it('renders suggestions when no query but suggestions exist', () => {
    render(
      <SearchResults
        {...defaultProps}
        query=""
        suggestions={['react hooks', 'typescript tips']}
        onResultClick={onResultClick}
        onSuggestionClick={onSuggestionClick}
      />
    );
    expect(screen.getByText('react hooks')).toBeInTheDocument();
    expect(screen.getByText('typescript tips')).toBeInTheDocument();
  });

  it('renders "Recent Searches" header for suggestions', () => {
    render(
      <SearchResults
        {...defaultProps}
        query=""
        suggestions={['test']}
        onResultClick={onResultClick}
        onSuggestionClick={onSuggestionClick}
      />
    );
    expect(screen.getByText('Recent Searches')).toBeInTheDocument();
  });

  it('calls onSuggestionClick when a suggestion is clicked', () => {
    render(
      <SearchResults
        {...defaultProps}
        query=""
        suggestions={['react hooks']}
        onResultClick={onResultClick}
        onSuggestionClick={onSuggestionClick}
      />
    );
    fireEvent.click(screen.getByText('react hooks'));
    expect(onSuggestionClick).toHaveBeenCalledWith('react hooks');
  });

  it('does not render dropdown when isOpen is false', () => {
    render(
      <SearchResults
        {...defaultProps}
        isOpen={false}
        query="test"
        results={[makeResult('1', 'Result')]}
        onResultClick={onResultClick}
        onSuggestionClick={onSuggestionClick}
      />
    );
    expect(screen.queryByText('Result')).not.toBeInTheDocument();
  });

  it('does not render dropdown when query is too short and no suggestions', () => {
    render(
      <SearchResults
        {...defaultProps}
        query="a"
        results={[]}
        suggestions={[]}
        onResultClick={onResultClick}
        onSuggestionClick={onSuggestionClick}
      />
    );
    expect(screen.queryByTestId('glass-card')).not.toBeInTheDocument();
  });
});
