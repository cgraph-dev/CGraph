/** @module quick-switcher tests */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QuickSwitcher } from '../quick-switcher';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

const testItems = [
  {
    id: 'c1',
    type: 'conversation' as const,
    name: 'Alice Chat',
    path: '/chat/alice',
    icon: () => <span />,
  },
  {
    id: 'c2',
    type: 'group' as const,
    name: 'Dev Team',
    subtitle: 'Engineering',
    path: '/groups/dev',
    icon: () => <span />,
  },
];

beforeEach(() => {
  vi.clearAllMocks();
});

describe('QuickSwitcher', () => {
  it('returns null when not open', () => {
    const { container } = render(<QuickSwitcher isOpen={false} onClose={vi.fn()} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders search input when open', () => {
    render(<QuickSwitcher isOpen={true} onClose={vi.fn()} items={testItems} />);
    expect(screen.getByPlaceholderText('Where would you like to go?')).toBeTruthy();
  });

  it('shows default settings pages', () => {
    render(<QuickSwitcher isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByText('Account Settings')).toBeTruthy();
    expect(screen.getByText('Appearance')).toBeTruthy();
  });

  it('shows custom items', () => {
    render(<QuickSwitcher isOpen={true} onClose={vi.fn()} items={testItems} />);
    expect(screen.getByText('Alice Chat')).toBeTruthy();
    expect(screen.getByText('Dev Team')).toBeTruthy();
  });

  it('filters items based on search query', () => {
    render(<QuickSwitcher isOpen={true} onClose={vi.fn()} items={testItems} />);
    const input = screen.getByPlaceholderText('Where would you like to go?');
    fireEvent.change(input, { target: { value: 'Alice' } });
    // highlightMatch wraps matched text in <mark>, so use regex
    expect(screen.getByText(/Alice/)).toBeTruthy();
    expect(screen.queryByText('Dev Team')).toBeNull();
  });

  it('shows no-results message when nothing matches', () => {
    render(<QuickSwitcher isOpen={true} onClose={vi.fn()} items={testItems} />);
    const input = screen.getByPlaceholderText('Where would you like to go?');
    fireEvent.change(input, { target: { value: 'zzzzz' } });
    expect(screen.getByText(/No results for/)).toBeTruthy();
  });

  it('navigates on item click', () => {
    const onClose = vi.fn();
    render(<QuickSwitcher isOpen={true} onClose={onClose} items={testItems} />);
    fireEvent.click(screen.getByText('Alice Chat'));
    expect(mockNavigate).toHaveBeenCalledWith('/chat/alice');
    expect(onClose).toHaveBeenCalled();
  });

  it('shows keyboard shortcuts footer', () => {
    render(<QuickSwitcher isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByText('Navigate')).toBeTruthy();
    expect(screen.getByText('Open')).toBeTruthy();
    expect(screen.getByText('Close')).toBeTruthy();
  });

  it('shows ESC badge', () => {
    render(<QuickSwitcher isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByText('ESC')).toBeTruthy();
  });
});
