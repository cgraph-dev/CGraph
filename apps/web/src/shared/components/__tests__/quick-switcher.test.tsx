/** @module quick-switcher tests */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QuickSwitcher } from '../quick-switcher';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock('framer-motion', () => {
  const cache = new Map<
    string | symbol,
    (p: React.PropsWithChildren<Record<string, unknown>>) => React.ReactElement
  >();
  return {
    motion: new Proxy(
      {} as Record<
        string,
        (p: React.PropsWithChildren<Record<string, unknown>>) => React.ReactElement
      >,
      {
        get: (_target, prop) => {
          if (!cache.has(prop)) {
            const Tag = (
              typeof prop === 'string' ? prop : 'div'
            ) as keyof React.JSX.IntrinsicElements;
            cache.set(
              prop,
              function MotionMock({ children, className, onClick, onMouseEnter, ..._rest }) {
                return (
                  <Tag
                    className={className as string}
                    onClick={onClick as React.MouseEventHandler}
                    onMouseEnter={onMouseEnter as React.MouseEventHandler}
                  >
                    {children}
                  </Tag>
                );
              }
            );
          }
          return cache.get(prop);
        },
      }
    ),
    AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
  };
});

vi.mock('@/lib/animation-presets', () => ({
  springs: { snappy: {} },
}));

vi.mock('@heroicons/react/24/outline', () => ({
  MagnifyingGlassIcon: () => <span data-testid="search-icon" />,
  ChatBubbleLeftRightIcon: () => <span data-testid="chat-icon" />,
  UserGroupIcon: () => <span data-testid="group-icon" />,
  HashtagIcon: () => <span data-testid="hash-icon" />,
  UserIcon: () => <span data-testid="user-icon" />,
  Cog6ToothIcon: () => <span data-testid="cog-icon" />,
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
