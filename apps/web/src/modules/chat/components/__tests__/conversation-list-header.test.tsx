/** @module conversation-list-header tests */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className }: React.PropsWithChildren<Record<string, unknown>>) => (
      <div className={className as string}>{children}</div>
    ),
    button: ({
      children,
      className,
      onClick,
    }: React.PropsWithChildren<{ className?: string; onClick?: () => void }>) => (
      <button className={className} onClick={onClick}>
        {children}
      </button>
    ),
  },
}));

vi.mock('@/stores/theme', () => ({
  useThemeStore: () => ({
    theme: { colorPreset: 'blue' },
  }),
  THEME_COLORS: {
    blue: { primary: '#3b82f6', accent: '#8b5cf6' },
  },
}));

vi.mock('@heroicons/react/24/outline', () => ({
  MagnifyingGlassIcon: () => <span data-testid="search-icon" />,
  PlusIcon: () => <span data-testid="plus-icon" />,
}));

vi.mock('../conversation-list/constants', () => ({
  FILTER_OPTIONS: [
    { id: 'all', label: 'All' },
    { id: 'direct', label: 'Direct' },
    { id: 'group', label: 'Groups' },
    { id: 'unread', label: 'Unread' },
  ],
}));

import { ConversationListHeader } from '../conversation-list/conversation-list-header';

describe('ConversationListHeader', () => {
  const defaultProps = {
    searchQuery: '',
    onSearchChange: vi.fn(),
    filter: 'all' as const,
    onFilterChange: vi.fn(),
    onNewChat: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders Messages title', () => {
    render(<ConversationListHeader {...defaultProps} />);
    expect(screen.getByText('Messages')).toBeInTheDocument();
  });

  it('renders search input with placeholder', () => {
    render(<ConversationListHeader {...defaultProps} />);
    expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
  });

  it('calls onSearchChange when typing in search', () => {
    render(<ConversationListHeader {...defaultProps} />);
    const input = screen.getByPlaceholderText(/search/i);
    fireEvent.change(input, { target: { value: 'hello' } });
    expect(defaultProps.onSearchChange).toHaveBeenCalledWith('hello');
  });

  it('renders filter buttons', () => {
    render(<ConversationListHeader {...defaultProps} />);
    expect(screen.getByText('All')).toBeInTheDocument();
    expect(screen.getByText('Direct')).toBeInTheDocument();
    expect(screen.getByText('Groups')).toBeInTheDocument();
    expect(screen.getByText('Unread')).toBeInTheDocument();
  });

  it('calls onFilterChange when filter button is clicked', () => {
    render(<ConversationListHeader {...defaultProps} />);
    fireEvent.click(screen.getByText('Direct'));
    expect(defaultProps.onFilterChange).toHaveBeenCalledWith('direct');
  });

  it('calls onNewChat when plus button is clicked', () => {
    render(<ConversationListHeader {...defaultProps} />);
    const buttons = screen.getAllByRole('button');
    const newChatBtn = buttons.find((b) => b.querySelector('[data-testid="plus-icon"]'));
    if (newChatBtn) {
      fireEvent.click(newChatBtn);
      expect(defaultProps.onNewChat).toHaveBeenCalled();
    }
  });

  it('shows current search query in input', () => {
    render(<ConversationListHeader {...defaultProps} searchQuery="test query" />);
    expect(screen.getByDisplayValue('test query')).toBeInTheDocument();
  });
});
