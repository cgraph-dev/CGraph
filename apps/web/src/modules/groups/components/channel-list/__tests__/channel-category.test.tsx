/** @module channel-category tests */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
  useLocation: () => ({ pathname: '/', search: '', hash: '', state: null }),
  useParams: () => ({}),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Link: ({ children, ...props }: any) => <a {...props}>{children}</a>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  NavLink: ({ children, ...props }: any) => <a {...props}>{children}</a>,
}));

vi.mock('./sortable-channel', () => ({
  SortableChannel: ({ channel }: { channel: { name: string } }) => (
    <div data-testid="channel">{channel.name}</div>
  ),
}));

import { CategorySection } from '../channel-category';

describe('CategorySection', () => {
  const mockCategory = {
    id: 'cat1',
    name: 'TEXT CHANNELS',
    channels: [
      { id: 'ch1', name: 'general', type: 'text' as const, position: 0 },
      { id: 'ch2', name: 'random', type: 'text' as const, position: 1 },
    ],
  };

  const defaultProps = {
    category: mockCategory,
    isExpanded: true,
    activeChannelId: 'ch1',
    onToggle: vi.fn(),
    onCreateChannel: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders category name', () => {
    render(<CategorySection {...defaultProps} />);
    expect(screen.getByText('TEXT CHANNELS')).toBeInTheDocument();
  });

  it('renders channels when expanded', () => {
    render(<CategorySection {...defaultProps} />);
    expect(screen.getByText('general')).toBeInTheDocument();
    expect(screen.getByText('random')).toBeInTheDocument();
  });

  it('calls onToggle when header clicked', () => {
    render(<CategorySection {...defaultProps} />);
    fireEvent.click(screen.getByText('TEXT CHANNELS'));
    expect(defaultProps.onToggle).toHaveBeenCalledOnce();
  });

  it('renders chevron icon', () => {
    render(<CategorySection {...defaultProps} />);
    expect(screen.getByTestId('icon-ChevronDownIcon')).toBeInTheDocument();
  });
});
